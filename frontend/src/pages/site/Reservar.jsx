// Fluxo de reserva do hóspede (busca de quartos, dados e confirmação).
import { useState } from 'react'
import { RoomSVG } from '../../components/rooms/RoomPlan.jsx'
import { GUEST } from '../../data/seed.js'
import { ocupado } from '../../domain/reservas.js'
import { aud } from '../../services/auditoria.js'
import { money, days, today, fmt, dig } from '../../utils/format.js'

export function Reservar({ d, setD, f, setF }) {
  const [c, setC] = useState({ tipo: 'PF', nome: '', doc: '', email: '', tel: '' })
  const [err, setErr] = useState('')
  const [done, setDone] = useState(null)
  const valid = f.co > f.ci,
    n = valid ? days(f.ci, f.co) : 0
  const why = (q) =>
    ['MANUTENCAO', 'BLOQUEADO'].includes(q.situacao_atual)
      ? 'Indisponível no momento'
      : valid && ocupado(d, q.id, f.ci, f.co)
        ? 'Já reservado no período'
        : ''
  const sel = d.quartos.find((q) => q.id === +f.q),
    total = sel ? n * sel.preco_diaria : 0
  const go = async () => {
    const doc = dig(c.doc)
    if (!valid) return setErr('O check-out deve ser depois do check-in.')
    if (f.ci <= today && f.ci < today) return setErr('O check-in não pode ser no passado.')
    if (!sel) return setErr('Escolha um quarto.')
    if (why(sel)) return setErr(why(sel) + '.')
    if (!c.nome.trim()) return setErr('Informe seu nome.')
    if (doc.length !== (c.tipo === 'PF' ? 11 : 14))
      return setErr(c.tipo === 'PF' ? 'O CPF deve ter 11 dígitos.' : 'O CNPJ deve ter 14 dígitos.')
    if (c.email && d.clientes.some((x) => x.email === c.email && x.doc !== doc))
      return setErr('Este e-mail já pertence a outro cadastro.')
    const ex = d.clientes.find((x) => x.doc === doc)
    const cli = ex || {
      id: 1 + Math.max(0, ...d.clientes.map((x) => x.id)),
      nome: c.nome.trim(),
      email: c.email,
      telefone: c.tel,
      tipo: c.tipo,
      doc,
      data_cadastro: today,
    }
    const r = {
      id: 1 + Math.max(0, ...d.reservas.map((x) => x.id)),
      id_cliente: cli.id,
      id_quarto: sel.id,
      data_checkin: f.ci,
      data_checkout: f.co,
      status: 'PENDENTE',
      valor_total: total,
    }
    const nd = await aud(
      { ...d, clientes: ex ? d.clientes : [...d.clientes, cli], reservas: [...d.reservas, r] },
      GUEST,
      'INCLUIR',
      'reservas',
      '#' + r.id,
      Object.entries(r)
        .map(([k, v]) => k + '=' + v)
        .join(', ') + (ex ? '' : '; novo cliente #' + cli.id),
    )
    setD(nd)
    setDone({ r, cli, novo: !ex })
    setErr('')
  }
  if (done) {
    const { r, cli, novo } = done,
      q = d.quartos.find((x) => x.id === r.id_quarto),
      nul = (v) => (v ? `'${v}'` : 'NULL')
    const sql =
      (novo
        ? `INSERT INTO cliente (nome, email, telefone, tipo_cliente, data_cadastro)\nVALUES ('${cli.nome}', ${nul(cli.email)}, ${nul(cli.telefone)}, '${cli.tipo}', '${cli.data_cadastro}');\n${cli.tipo === 'PF' ? `INSERT INTO pessoa_fisica (id_cliente, cpf) VALUES (LAST_INSERT_ID(), '${cli.doc}');` : `INSERT INTO pessoa_juridica (id_cliente, cnpj, razao_social) VALUES (LAST_INSERT_ID(), '${cli.doc}', '${cli.nome}');`}\n\n`
        : '') +
      `INSERT INTO reserva (id_cliente, id_quarto, data_checkin, data_checkout, status, valor_total)\nVALUES (${novo ? 'LAST_INSERT_ID()' : cli.id}, ${r.id_quarto}, '${r.data_checkin}', '${r.data_checkout}', 'PENDENTE', ${r.valor_total.toFixed(2)});`
    return (
      <div>
        <div className="top">
          <h2>Reserva solicitada</h2>
          <button
            className="btn"
            onClick={() => {
              setDone(null)
              setF({ ...f, q: '' })
            }}
          >
            Fazer outra reserva
          </button>
        </div>
        <div className="split">
          <div className="card">
            <RoomSVG
              q={q}
              es="RESERVADO"
              sub={`${cli.nome.split(' ')[0]} · ${fmt(r.data_checkin)} a ${fmt(r.data_checkout)}`}
            />
          </div>
          <div>
            <div className="card">
              <b>Protocolo nº {r.id}</b>
              <br />
              Quarto {q.numero} ({q.tipo}), {days(r.data_checkin, r.data_checkout)} noite(s)
              <br />
              Total: <b>{money(r.valor_total)}</b>
              <br />
              <br />
              <span className="tag">PENDENTE</span> Um funcionário vai conferir seus dados. Guarde o
              protocolo e seu {cli.tipo === 'PF' ? 'CPF' : 'CNPJ'} para acompanhar na aba "Consultar
              reserva".
            </div>
            <div className="card">
              <b>Registro gravado no banco</b>
              <div className="wrap">
                <table>
                  <thead>
                    <tr>
                      <th>id_reserva</th>
                      <th>id_cliente</th>
                      <th>id_quarto</th>
                      <th>check-in</th>
                      <th>check-out</th>
                      <th>status</th>
                      <th>valor_total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>{r.id}</td>
                      <td>{r.id_cliente}</td>
                      <td>{r.id_quarto}</td>
                      <td>{r.data_checkin}</td>
                      <td>{r.data_checkout}</td>
                      <td>
                        <span className="tag">{r.status}</span>
                      </td>
                      <td>{r.valor_total.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="sql">{sql}</div>
            </div>
          </div>
        </div>
      </div>
    )
  }
  const list = [...d.quartos]
    .filter((q) => !f.tipo || q.tipo === f.tipo)
    .sort((a, b) => a.numero - b.numero)
  return (
    <div>
      <h2 className="sec">1. Período e quarto</h2>
      <div className="card">
        <div className="form" style={{ marginBottom: 0 }}>
          <div>
            <label>Check-in</label>
            <input
              type="date"
              min={today}
              value={f.ci}
              onChange={(e) => setF({ ...f, ci: e.target.value, q: '' })}
            />
          </div>
          <div>
            <label>Check-out</label>
            <input
              type="date"
              min={f.ci}
              value={f.co}
              onChange={(e) => setF({ ...f, co: e.target.value, q: '' })}
            />
          </div>
          <div>
            <label>Tipo de quarto</label>
            <select value={f.tipo} onChange={(e) => setF({ ...f, tipo: e.target.value })}>
              <option value="">Todos</option>
              {['SIMPLES', 'DUPLO', 'SUITE', 'LUXO'].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      <div className="rooms">
        {list.map((q) => {
          const w = why(q)
          return (
            <button
              key={q.id}
              disabled={!!w}
              className={'rc' + (+f.q === q.id ? ' sel' : '') + (w ? ' off' : '')}
              onClick={() => setF({ ...f, q: q.id })}
            >
              <RoomSVG
                q={q}
                es={w ? (w.startsWith('Já') ? 'RESERVADO' : q.situacao_atual) : 'DISPONIVEL'}
              />
              <b>
                Quarto {q.numero} · {q.tipo}
              </b>
              <small>{w || money(q.preco_diaria) + ' por noite'}</small>
            </button>
          )
        })}
      </div>
      <h2 className="sec">2. Seus dados</h2>
      <div className="card">
        <div className="form">
          <div>
            <label>Tipo de cadastro</label>
            <select value={c.tipo} onChange={(e) => setC({ ...c, tipo: e.target.value })}>
              <option value="PF">Pessoa física</option>
              <option value="PJ">Pessoa jurídica</option>
            </select>
          </div>
          <div>
            <label>{c.tipo === 'PF' ? 'Nome completo' : 'Razão social'}</label>
            <input value={c.nome} onChange={(e) => setC({ ...c, nome: e.target.value })} />
          </div>
          <div>
            <label>{c.tipo === 'PF' ? 'CPF' : 'CNPJ'}</label>
            <input
              value={c.doc}
              onChange={(e) => setC({ ...c, doc: e.target.value })}
              inputMode="numeric"
            />
          </div>
          <div>
            <label>E-mail (opcional)</label>
            <input
              type="email"
              value={c.email}
              onChange={(e) => setC({ ...c, email: e.target.value })}
            />
          </div>
          <div>
            <label>Telefone (opcional)</label>
            <input value={c.tel} onChange={(e) => setC({ ...c, tel: e.target.value })} />
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div>
            {sel ? (
              <>
                <b>Quarto {sel.numero}</b>: {n} noite(s) × {money(sel.preco_diaria)} ={' '}
                <b>{money(total)}</b>
              </>
            ) : (
              'Selecione um quarto acima.'
            )}
          </div>
          <button className="btn" onClick={go}>
            Solicitar reserva
          </button>
        </div>
        {err && (
          <div className="err" role="alert">
            {err}
          </div>
        )}
      </div>
    </div>
  )
}
