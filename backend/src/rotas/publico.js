// Rotas públicas (hóspede, sem login): listar quartos, solicitar reserva e consultar reserva.
import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { pool, transacao } from '../db.js'
import { ErroApp, ah } from '../erros.js'
import { registrar } from '../audit.js'

export const publico = Router()

const HOSPEDE = { login: 'hospede', papel: 'PUBLICO' }
const dig = (s) => String(s || '').replace(/\D/g, '')
const ehData = (s) => /^\d{4}-\d{2}-\d{2}$/.test(String(s))
const limite = rateLimit({ windowMs: 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false })

// Quartos e períodos ocupados (sem dados de clientes).
publico.get(
  '/dados',
  ah(async (req, res) => {
    const [quartos] = await pool.execute(
      'SELECT id_quarto AS id, numero, tipo, preco_diaria, situacao_atual FROM quarto ORDER BY numero',
    )
    const [reservas] = await pool.execute(
      `SELECT id_reserva AS id, id_quarto, data_checkin, data_checkout, status
         FROM reserva
        WHERE status <> 'CANCELADA' AND data_checkout >= CURDATE()`,
    )
    res.json({
      quartos: quartos.map((q) => ({ ...q, preco_diaria: Number(q.preco_diaria) })),
      reservas,
      clientes: [],
      funcionarios: [],
      historico: [],
      auditoria: [],
    })
  }),
)

// Solicitar reserva: tudo numa transação (cliente + subclasse + reserva + auditoria).
publico.post(
  '/reservas',
  limite,
  ah(async (req, res) => {
    const b = req.body || {}
    const tipo = b.tipo === 'PJ' ? 'PJ' : 'PF'
    const doc = dig(b.doc)
    const nome = String(b.nome || '').trim()
    const email = String(b.email || '').trim() || null
    const telefone = String(b.telefone || '').trim() || null
    const idQuarto = Number(b.id_quarto)
    const ci = String(b.checkin || '')
    const co = String(b.checkout || '')

    if (!Number.isInteger(idQuarto)) throw new ErroApp(400, 'Escolha um quarto.')
    if (!ehData(ci) || !ehData(co) || co <= ci) throw new ErroApp(400, 'O check-out deve ser depois do check-in.')
    if (!nome) throw new ErroApp(400, 'Informe seu nome.')
    if (doc.length !== (tipo === 'PF' ? 11 : 14))
      throw new ErroApp(400, tipo === 'PF' ? 'O CPF deve ter 11 dígitos.' : 'O CNPJ deve ter 14 dígitos.')

    const resultado = await transacao(async (conn) => {
      // 1) trava a linha do quarto: duas pessoas não reservam o mesmo quarto ao mesmo tempo
      const [qs] = await conn.execute(
        `SELECT id_quarto, preco_diaria, situacao_atual, DATEDIFF(?, ?) AS noites, CURDATE() AS hoje
           FROM quarto WHERE id_quarto = ? FOR UPDATE`,
        [co, ci, idQuarto],
      )
      const q = qs[0]
      if (!q) throw new ErroApp(404, 'Quarto não encontrado.')
      if (ci < q.hoje) throw new ErroApp(400, 'O check-in não pode ser no passado.')
      if (['MANUTENCAO', 'BLOQUEADO'].includes(q.situacao_atual))
        throw new ErroApp(409, 'Este quarto está indisponível no momento.')

      // 2) conflito de datas com outra reserva ativa
      const [conf] = await conn.execute(
        `SELECT 1 FROM reserva
          WHERE id_quarto = ? AND status <> 'CANCELADA' AND data_checkin < ? AND ? < data_checkout LIMIT 1`,
        [idQuarto, co, ci],
      )
      if (conf.length) throw new ErroApp(409, 'Quarto já reservado neste período.')

      // 3) cliente: reaproveita pelo documento ou cadastra (superclasse + subclasse)
      const [ex] = await conn.execute(
        tipo === 'PF'
          ? `SELECT c.id_cliente AS id, c.nome, c.email, c.telefone, c.tipo_cliente AS tipo, c.data_cadastro
               FROM cliente c JOIN pessoa_fisica p ON p.id_cliente = c.id_cliente WHERE p.cpf = ?`
          : `SELECT c.id_cliente AS id, c.nome, c.email, c.telefone, c.tipo_cliente AS tipo, c.data_cadastro
               FROM cliente c JOIN pessoa_juridica p ON p.id_cliente = c.id_cliente WHERE p.cnpj = ?`,
        [doc],
      )
      let cli = ex[0]
      const novo = !cli
      if (novo) {
        if (email) {
          const [dup] = await conn.execute('SELECT 1 FROM cliente WHERE email = ?', [email])
          if (dup.length) throw new ErroApp(409, 'Este e-mail já pertence a outro cadastro.')
        }
        const [ins] = await conn.execute(
          'INSERT INTO cliente (nome, email, telefone, tipo_cliente, data_cadastro) VALUES (?, ?, ?, ?, CURDATE())',
          [nome, email, telefone, tipo],
        )
        if (tipo === 'PF')
          await conn.execute('INSERT INTO pessoa_fisica (id_cliente, cpf) VALUES (?, ?)', [ins.insertId, doc])
        else
          await conn.execute('INSERT INTO pessoa_juridica (id_cliente, cnpj, razao_social) VALUES (?, ?, ?)', [
            ins.insertId,
            doc,
            nome,
          ])
        cli = { id: ins.insertId, nome, email, telefone, tipo, data_cadastro: q.hoje }
      }
      cli = { ...cli, doc }

      // 4) reserva PENDENTE; o valor é calculado aqui, nunca vem do navegador
      const valor = Math.round(q.noites * Number(q.preco_diaria) * 100) / 100
      const [r] = await conn.execute(
        `INSERT INTO reserva (id_cliente, id_quarto, data_checkin, data_checkout, status, valor_total)
         VALUES (?, ?, ?, ?, 'PENDENTE', ?)`,
        [cli.id, idQuarto, ci, co, valor],
      )
      await registrar(
        conn,
        HOSPEDE,
        'INCLUIR',
        'reservas',
        '#' + r.insertId,
        `id_cliente=${cli.id}, id_quarto=${idQuarto}, ${ci} a ${co}, valor_total=${valor}` +
          (novo ? `; novo cliente #${cli.id}` : ''),
      )
      return {
        r: {
          id: r.insertId,
          id_cliente: cli.id,
          id_quarto: idQuarto,
          data_checkin: ci,
          data_checkout: co,
          status: 'PENDENTE',
          valor_total: valor,
        },
        cli,
        novo,
      }
    })
    res.status(201).json(resultado)
  }),
)

// Consulta pelo protocolo + documento usado na reserva.
publico.post(
  '/reservas/consulta',
  limite,
  ah(async (req, res) => {
    const protocolo = Number(req.body?.protocolo)
    const doc = dig(req.body?.doc)
    if (!Number.isInteger(protocolo) || !doc) throw new ErroApp(400, 'Informe o protocolo e o documento.')
    const [rows] = await pool.execute(
      `SELECT r.id_reserva AS id, r.id_cliente, r.id_quarto, r.data_checkin, r.data_checkout, r.status, r.valor_total,
              q.numero, q.tipo, q.preco_diaria, q.situacao_atual
         FROM reserva r
         JOIN cliente c ON c.id_cliente = r.id_cliente
         JOIN quarto q ON q.id_quarto = r.id_quarto
         LEFT JOIN pessoa_fisica pf ON pf.id_cliente = c.id_cliente
         LEFT JOIN pessoa_juridica pj ON pj.id_cliente = c.id_cliente
        WHERE r.id_reserva = ? AND COALESCE(pf.cpf, pj.cnpj) = ?`,
      [protocolo, doc],
    )
    const x = rows[0]
    if (!x) throw new ErroApp(404, 'Nenhuma reserva encontrada com esses dados.')
    res.json({
      r: {
        id: x.id,
        id_cliente: x.id_cliente,
        id_quarto: x.id_quarto,
        data_checkin: x.data_checkin,
        data_checkout: x.data_checkout,
        status: x.status,
        valor_total: Number(x.valor_total),
      },
      q: { id: x.id_quarto, numero: x.numero, tipo: x.tipo, preco_diaria: Number(x.preco_diaria), situacao_atual: x.situacao_atual },
    })
  }),
)
