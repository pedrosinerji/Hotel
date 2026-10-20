// Fluxo de reserva do hóspede (busca de quartos, dados e confirmação).
import { useState } from 'react'
import { RoomSVG } from '../../components/rooms/RoomPlan.jsx'
import { ocupado } from '../../domain/reservas.js'
import { api } from '../../services/api.js'
import { money, days, today, fmt } from '../../utils/format.js'

export function Reservar({ d, onChange, f, setF }) {
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
    if (!sel) return setErr('Escolha um quarto.')
    try {
      const res = await api.reservar({
        tipo: c.tipo,
        nome: c.nome,
        doc: c.doc,
        email: c.email,
        telefone: c.tel,
        id_quarto: sel.id,
        checkin: f.ci,
        checkout: f.co,
      })
      setDone(res)
      setErr('')
      onChange()
    } catch (e) {
      setErr(e.message)
    }
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
