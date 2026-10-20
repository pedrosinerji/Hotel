// Rotas do funcionário (exigem login): dados, conferência de reservas e mudança de status.
import { Router } from 'express'
import { pool, transacao } from '../db.js'
import { exigeLogin, exigePapel } from '../auth.js'
import { ErroApp, ah } from '../erros.js'
import { registrar } from '../audit.js'

export const staff = Router()
staff.use(exigeLogin, exigePapel('GERENTE', 'RECEPCAO'))

const TRANSICOES = {
  PENDENTE: ['CONFIRMADA', 'CANCELADA'],
  CONFIRMADA: ['EM_ANDAMENTO', 'CANCELADA'],
  EM_ANDAMENTO: ['FINALIZADA'],
}

staff.get(
  '/dados',
  ah(async (req, res) => {
    const [quartos] = await pool.execute(
      'SELECT id_quarto AS id, numero, tipo, preco_diaria, situacao_atual FROM quarto ORDER BY numero',
    )
    const [reservas] = await pool.execute(
      `SELECT id_reserva AS id, id_cliente, id_quarto, data_checkin, data_checkout, status, valor_total
         FROM reserva ORDER BY id_reserva`,
    )
    const [clientes] = await pool.execute(
      `SELECT c.id_cliente AS id, c.nome, c.email, c.telefone, c.tipo_cliente AS tipo,
              COALESCE(pf.cpf, pj.cnpj) AS doc, c.data_cadastro
         FROM cliente c
         LEFT JOIN pessoa_fisica pf ON pf.id_cliente = c.id_cliente
         LEFT JOIN pessoa_juridica pj ON pj.id_cliente = c.id_cliente
        ORDER BY c.id_cliente`,
    )
    let auditoria = []
    if (req.user.papel === 'GERENTE') {
      ;[auditoria] = await pool.execute(
        `SELECT * FROM (
           SELECT id_auditoria AS id, data_hora, usuario, papel, acao, tabela, registro, detalhe
             FROM auditoria ORDER BY id_auditoria DESC LIMIT 500
         ) t ORDER BY id`,
      )
    }
    res.json({
      quartos: quartos.map((q) => ({ ...q, preco_diaria: Number(q.preco_diaria) })),
      reservas: reservas.map((r) => ({ ...r, valor_total: Number(r.valor_total) })),
      clientes,
      funcionarios: [],
      historico: [],
      auditoria,
    })
  }),
)

// Atualiza a situação do quarto e registra o histórico (RN16), dentro da transação de quem chamou.
async function mudaQuarto(conn, idQuarto, novo, motivo) {
  const [rows] = await conn.execute('SELECT situacao_atual FROM quarto WHERE id_quarto = ? FOR UPDATE', [idQuarto])
  const atual = rows[0].situacao_atual
  if (atual === novo) return
  await conn.execute(
    `UPDATE historico_status_quarto
        SET data_hora_fim = GREATEST(NOW(), data_hora_inicio + INTERVAL 1 SECOND)
      WHERE id_quarto = ? AND data_hora_fim IS NULL`,
    [idQuarto],
  )
  await conn.execute(
    `INSERT INTO historico_status_quarto (id_quarto, status_anterior, novo_status, data_hora_inicio, motivo_alteracao)
     VALUES (?, ?, ?, NOW(), ?)`,
    [idQuarto, atual, novo, motivo],
  )
  await conn.execute('UPDATE quarto SET situacao_atual = ? WHERE id_quarto = ?', [novo, idQuarto])
}

// Confirmar, recusar, check-in, check-out e cancelar. Várias tabelas, uma única transação.
staff.patch(
  '/reservas/:id/status',
  ah(async (req, res) => {
    const id = Number(req.params.id)
    const novo = String(req.body?.status || '')
    const motivo = String(req.body?.motivo || '').trim()
    try {
      await transacao(async (conn) => {
        const [rows] = await conn.execute(
          `SELECT id_reserva, id_quarto, status, data_checkin, data_checkout, CURDATE() AS hoje
             FROM reserva WHERE id_reserva = ? FOR UPDATE`,
          [id],
        )
        const r = rows[0]
        if (!r) throw new ErroApp(404, 'Reserva não encontrada.')
        if (!(TRANSICOES[r.status] || []).includes(novo))
          throw new ErroApp(409, `Não é possível passar de ${r.status} para ${novo}.`)
        if (novo === 'CANCELADA' && !motivo) throw new ErroApp(400, 'Informe o motivo.')
        if (novo === 'CANCELADA' && r.status !== 'PENDENTE' && req.user.papel !== 'GERENTE')
          throw new ErroApp(403, 'Somente o gerente cancela reservas já confirmadas.')

        if (novo === 'CONFIRMADA') {
          const [q] = await conn.execute('SELECT situacao_atual FROM quarto WHERE id_quarto = ? FOR UPDATE', [r.id_quarto])
          if (['MANUTENCAO', 'BLOQUEADO'].includes(q[0].situacao_atual))
            throw new ErroApp(409, 'O quarto está em manutenção ou bloqueado.')
          const [conf] = await conn.execute(
            `SELECT 1 FROM reserva
              WHERE id_quarto = ? AND id_reserva <> ? AND status <> 'CANCELADA'
                AND data_checkin < ? AND ? < data_checkout LIMIT 1`,
            [r.id_quarto, r.id_reserva, r.data_checkout, r.data_checkin],
          )
          if (conf.length) throw new ErroApp(409, 'Há outra reserva ativa neste quarto no mesmo período.')
        }
        if (novo === 'EM_ANDAMENTO' && r.data_checkin > r.hoje)
          throw new ErroApp(409, `O check-in só pode ser feito a partir de ${r.data_checkin}.`)

        await conn.execute('UPDATE reserva SET status = ? WHERE id_reserva = ?', [novo, id])
        if (novo === 'EM_ANDAMENTO') await mudaQuarto(conn, r.id_quarto, 'OCUPADO', 'Check-in da reserva #' + id)
        if (novo === 'FINALIZADA') await mudaQuarto(conn, r.id_quarto, 'LIMPEZA', 'Check-out da reserva #' + id)
        await registrar(
          conn,
          req.user,
          'STATUS_RESERVA',
          'reservas',
          '#' + id,
          `status: ${r.status} → ${novo}` + (motivo ? ` (motivo: ${motivo})` : ''),
        )
      })
    } catch (e) {
      if (e.status === 403) await registrar(pool, req.user, 'ACESSO_NEGADO', 'reservas', '#' + id, e.message).catch(() => {})
      throw e
    }
    res.json({ ok: true })
  }),
)



// CRUD administrativo para quatro entidades do modelo. Os nomes de tabela/coluna
// são definidos por allowlist; os valores do usuário sempre são parametrizados.
const CATALOGOS = {
  quartos: {
    tabela: 'quarto', pk: 'id_quarto',
    campos: ['numero', 'tipo', 'preco_diaria', 'situacao_atual'],
    select: 'id_quarto AS id, numero, tipo, preco_diaria, situacao_atual',
    normalizar: (b) => [Number(b.numero), String(b.tipo || '').toUpperCase(), Number(b.preco_diaria), String(b.situacao_atual || 'DISPONIVEL').toUpperCase()],
  },
  servicos: {
    tabela: 'servico', pk: 'id_servico',
    campos: ['nome_servico', 'preco_base'],
    select: 'id_servico AS id, nome_servico, preco_base',
    normalizar: (b) => [String(b.nome_servico || '').trim(), Number(b.preco_base)],
  },
  produtos: {
    tabela: 'produto', pk: 'id_produto',
    campos: ['id_fornecedor', 'nome_produto', 'qtd_estoque', 'preco_custo'],
    select: 'id_produto AS id, id_fornecedor, nome_produto, qtd_estoque, preco_custo',
    normalizar: (b) => [Number(b.id_fornecedor), String(b.nome_produto || '').trim(), Number(b.qtd_estoque), Number(b.preco_custo)],
  },
  fornecedores: {
    tabela: 'fornecedor', pk: 'id_fornecedor',
    campos: ['razao_social', 'cnpj', 'telefone'],
    select: 'id_fornecedor AS id, razao_social, cnpj, telefone',
    normalizar: (b) => [String(b.razao_social || '').trim(), String(b.cnpj || '').replace(/\D/g, ''), b.telefone ? String(b.telefone).trim() : null],
  },
}

function validarCatalogo(tipo, valores) {
  if (valores.some((v) => v === '' || v === undefined || (typeof v === 'number' && !Number.isFinite(v))))
    throw new ErroApp(400, 'Preencha os campos obrigatórios com valores válidos.')
  if (tipo === 'quartos' && (!Number.isInteger(valores[0]) || valores[0] <= 0 || !['SIMPLES','DUPLO','SUITE','LUXO'].includes(valores[1]) || valores[2] <= 0 || !['DISPONIVEL','OCUPADO','MANUTENCAO','LIMPEZA','BLOQUEADO'].includes(valores[3])))
    throw new ErroApp(400, 'Confira número, tipo, diária e situação do quarto.')
  if (tipo === 'servicos' && (!valores[0] || valores[1] < 0)) throw new ErroApp(400, 'Nome do serviço obrigatório e preço não negativo.')
  if (tipo === 'produtos' && (!Number.isInteger(valores[0]) || valores[0] <= 0 || !valores[1] || !Number.isInteger(valores[2]) || valores[2] < 0 || valores[3] < 0)) throw new ErroApp(400, 'Confira fornecedor, nome, estoque e custo do produto.')
  if (tipo === 'fornecedores' && (!valores[0] || !/^\d{14}$/.test(valores[1]))) throw new ErroApp(400, 'Razão social obrigatória e CNPJ com 14 dígitos.')
}

staff.get('/catalogos/:tipo', exigePapel('GERENTE'), ah(async (req, res) => {
  const cfg = CATALOGOS[req.params.tipo]
  if (!cfg) throw new ErroApp(404, 'Cadastro não encontrado.')
  const [rows] = await pool.execute(`SELECT ${cfg.select} FROM ${cfg.tabela} ORDER BY ${cfg.pk} DESC`)
  res.json(rows)
}))

staff.post('/catalogos/:tipo', exigePapel('GERENTE'), ah(async (req, res) => {
  const tipo = req.params.tipo, cfg = CATALOGOS[tipo]
  if (!cfg) throw new ErroApp(404, 'Cadastro não encontrado.')
  const valores = cfg.normalizar(req.body || {})
  validarCatalogo(tipo, valores)
  const cols = cfg.campos.join(', '), marks = cfg.campos.map(() => '?').join(', ')
  const id = await transacao(async (conn) => {
    const [r] = await conn.execute(`INSERT INTO ${cfg.tabela} (${cols}) VALUES (${marks})`, valores)
    if (tipo === 'quartos') {
      await conn.execute(`INSERT INTO historico_status_quarto (id_quarto, status_anterior, novo_status, data_hora_inicio, motivo_alteracao) VALUES (?, NULL, ?, NOW(), 'Cadastro inicial do quarto')`, [r.insertId, valores[3]])
    }
    await registrar(conn, req.user, 'CRIAR', cfg.tabela, String(r.insertId), 'Cadastro criado pela interface administrativa')
    return r.insertId
  })
  res.status(201).json({ id })
}))

staff.put('/catalogos/:tipo/:id', exigePapel('GERENTE'), ah(async (req, res) => {
  const tipo = req.params.tipo, cfg = CATALOGOS[tipo], id = Number(req.params.id)
  if (!cfg) throw new ErroApp(404, 'Cadastro não encontrado.')
  if (!Number.isInteger(id) || id <= 0) throw new ErroApp(400, 'Identificador inválido.')
  const valores = cfg.normalizar(req.body || {})
  validarCatalogo(tipo, valores)
  const sets = cfg.campos.map((c) => `${c} = ?`).join(', ')
  await transacao(async (conn) => {
    if (tipo === 'quartos') {
      const [atuais] = await conn.execute('SELECT situacao_atual FROM quarto WHERE id_quarto = ? FOR UPDATE', [id])
      if (!atuais.length) throw new ErroApp(404, 'Registro não encontrado.')
      if (atuais[0].situacao_atual !== valores[3]) {
        await conn.execute(`UPDATE historico_status_quarto SET data_hora_fim = GREATEST(NOW(), data_hora_inicio + INTERVAL 1 SECOND) WHERE id_quarto = ? AND data_hora_fim IS NULL`, [id])
        await conn.execute(`INSERT INTO historico_status_quarto (id_quarto, status_anterior, novo_status, data_hora_inicio, motivo_alteracao) VALUES (?, ?, ?, NOW(), 'Alteração administrativa')`, [id, atuais[0].situacao_atual, valores[3]])
      }
    }
    const [r] = await conn.execute(`UPDATE ${cfg.tabela} SET ${sets} WHERE ${cfg.pk} = ?`, [...valores, id])
    if (!r.affectedRows) throw new ErroApp(404, 'Registro não encontrado.')
    await registrar(conn, req.user, 'ALTERAR', cfg.tabela, String(id), 'Cadastro alterado pela interface administrativa')
  })
  res.json({ ok: true })
}))

staff.delete('/catalogos/:tipo/:id', exigePapel('GERENTE'), ah(async (req, res) => {
  const tipo = req.params.tipo, cfg = CATALOGOS[tipo], id = Number(req.params.id)
  if (!cfg) throw new ErroApp(404, 'Cadastro não encontrado.')
  if (!Number.isInteger(id) || id <= 0) throw new ErroApp(400, 'Identificador inválido.')
  const [r] = await pool.execute(`DELETE FROM ${cfg.tabela} WHERE ${cfg.pk} = ?`, [id])
  if (!r.affectedRows) throw new ErroApp(404, 'Registro não encontrado.')
  await registrar(pool, req.user, 'EXCLUIR', cfg.tabela, String(id), 'Cadastro removido pela interface administrativa')
  res.json({ ok: true })
}))

// Consulta parametrizada 1: reservas por período/status, com JOIN e agregação.
staff.get('/relatorios/reservas', ah(async (req, res) => {
  const inicio = String(req.query.inicio || '2000-01-01')
  const fim = String(req.query.fim || '2099-12-31')
  const status = String(req.query.status || '')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(inicio) || !/^\d{4}-\d{2}-\d{2}$/.test(fim)) throw new ErroApp(400, 'Informe datas no formato AAAA-MM-DD.')
  const [rows] = await pool.execute(
    `SELECT r.id_reserva AS reserva, c.nome AS cliente, q.numero AS quarto, r.data_checkin, r.data_checkout,
            r.status, r.valor_total, DATEDIFF(r.data_checkout, r.data_checkin) AS noites,
            COUNT(rs.id_servico) AS servicos_lancados
       FROM reserva r JOIN cliente c ON c.id_cliente = r.id_cliente
       JOIN quarto q ON q.id_quarto = r.id_quarto
       LEFT JOIN reserva_servico rs ON rs.id_reserva = r.id_reserva
      WHERE r.data_checkin >= ? AND r.data_checkin <= ? AND (? = '' OR r.status = ?)
      GROUP BY r.id_reserva, c.nome, q.numero, r.data_checkin, r.data_checkout, r.status, r.valor_total
      ORDER BY r.data_checkin DESC`, [inicio, fim, status, status])
  res.json(rows)
}))

// Consulta parametrizada 2: faturamento agregado por tipo de quarto.
staff.get('/relatorios/faturamento', ah(async (req, res) => {
  const inicio = String(req.query.inicio || '2000-01-01')
  const fim = String(req.query.fim || '2099-12-31')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(inicio) || !/^\d{4}-\d{2}-\d{2}$/.test(fim)) throw new ErroApp(400, 'Informe datas no formato AAAA-MM-DD.')
  const [rows] = await pool.execute(
    `SELECT q.tipo, COUNT(r.id_reserva) AS quantidade_reservas,
            COALESCE(SUM(CASE WHEN r.status <> 'CANCELADA' THEN r.valor_total ELSE 0 END), 0) AS faturamento,
            AVG(CASE WHEN r.status <> 'CANCELADA' THEN r.valor_total END) AS ticket_medio
       FROM quarto q LEFT JOIN reserva r ON r.id_quarto = q.id_quarto
        AND r.data_checkin >= ? AND r.data_checkin <= ?
      GROUP BY q.tipo ORDER BY faturamento DESC`, [inicio, fim])
  res.json(rows)
}))

// Relatório consolidado vindo de uma VIEW criada em sql/05_etapa2.sql.
staff.get('/relatorios/consolidado', exigePapel('GERENTE'), ah(async (req, res) => {
  const [rows] = await pool.execute('SELECT * FROM vw_relatorio_hotel ORDER BY tipo_quarto')
  res.json(rows)
}))

staff.post(
  '/logout',
  ah(async (req, res) => {
    await registrar(pool, req.user, 'LOGOUT', 'sessao', '-')
    res.json({ ok: true })
  }),
)
