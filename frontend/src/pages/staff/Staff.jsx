// Área do funcionário: conferência de reservas e mapa de ocupação.
import { useState } from 'react'
import { Gantt } from '../../components/rooms/Gantt.jsx'
import { RoomSVG } from '../../components/rooms/RoomPlan.jsx'
import { mudaQuarto } from '../../domain/quartos.js'
import { esOf, ocupado } from '../../domain/reservas.js'
import { Audit } from './Audit.jsx'
import { aud } from '../../services/auditoria.js'
import { money, days, today, fmt } from '../../utils/format.js'

export function Staff({ d, setD, me, out }) {
  const [tab, setTab] = useState('conf')
  const [fl, setFl] = useState('PENDENTE')
  const [sel, setSel] = useState(null)
  const [mot, setMot] = useState('')
  const G = me.papel === 'GERENTE'
  const rows = d.reservas.filter((r) => !fl || r.status === fl).sort((a, b) => b.id - a.id)
  const r = d.reservas.find((x) => x.id === sel),
    q = r && d.quartos.find((x) => x.id === r.id_quarto),
    c = r && d.clientes.find((x) => x.id === r.id_cliente)
  const chk = r
    ? [
        [
          `Documento (${c.tipo === 'PF' ? 'CPF' : 'CNPJ'}) com formato válido`,
          c.doc.length === (c.tipo === 'PF' ? 11 : 14),
        ],
        ['Período válido (check-out depois do check-in)', r.data_checkout > r.data_checkin],
        [
          'Sem conflito com outra reserva ativa no quarto',
          !ocupado(d, r.id_quarto, r.data_checkin, r.data_checkout, r.id),
        ],
        [
          'Quarto fora de manutenção e de bloqueio',
          !['MANUTENCAO', 'BLOQUEADO'].includes(q.situacao_atual),
        ],
        [
          `Valor confere (${days(r.data_checkin, r.data_checkout)} noites × ${money(q.preco_diaria)})`,
          Math.abs(r.valor_total - days(r.data_checkin, r.data_checkout) * q.preco_diaria) < 0.01,
        ],
      ]
    : []
  const ok = chk.every((x) => x[1])
  const act = async (novo) => {
    if (novo === 'CANCELADA' && !mot.trim()) return alert('Informe o motivo.')
    let nd = { ...d, reservas: d.reservas.map((x) => (x.id === r.id ? { ...x, status: novo } : x)) }
    if (novo === 'EM_ANDAMENTO')
      nd = mudaQuarto(nd, r.id_quarto, 'OCUPADO', 'Check-in da reserva #' + r.id)
    if (novo === 'FINALIZADA')
      nd = mudaQuarto(nd, r.id_quarto, 'LIMPEZA', 'Check-out da reserva #' + r.id)
    setD(
      await aud(
        nd,
        me,
        'STATUS_RESERVA',
        'reservas',
        '#' + r.id,
        `status: ${r.status} → ${novo}` + (mot ? ` (motivo: ${mot})` : ''),
      ),
    )
    setMot('')
  }
  const B = (t, novo, cls = 'btn', dis) => (
    <button className={cls} disabled={dis} onClick={() => act(novo)}>
      {t}
    </button>
  )
  return (
    <div className="pg">
      <div className="tabs">
        {[
          ['conf', 'Conferência de reservas'],
          ['mapa', 'Mapa de ocupação'],
          ...(G ? [['aud', 'Trilha de auditoria']] : []),
        ].map(([k, l]) => (
          <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>
            {l}
          </button>
        ))}
      </div>
      {tab === 'aud' ? (
        <Audit d={d} />
      ) : tab === 'mapa' ? (
        <div>
          <h2 style={{ marginBottom: 10 }}>Mapa de ocupação</h2>
          <Gantt d={d} from={today} />
        </div>
      ) : (
        <div>
          <div className="top">
            <h2>Conferência de reservas</h2>
            <div>
              <select
                value={fl}
                onChange={(e) => setFl(e.target.value)}
                aria-label="Filtrar por status"
              >
                <option value="">Todas</option>
                {['PENDENTE', 'CONFIRMADA', 'EM_ANDAMENTO', 'FINALIZADA', 'CANCELADA'].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
          {r && (
            <div className="split">
              <div className="card">
                <RoomSVG
                  q={q}
                  es={esOf(r.status) === 'DISPONIVEL' ? q.situacao_atual : esOf(r.status)}
                  sub={`${c.nome.split(' ')[0]} · ${fmt(r.data_checkin)} a ${fmt(r.data_checkout)}`}
                />
              </div>
              <div>
                <div className="card">
                  <b>Reserva #{r.id}</b> <span className="tag">{r.status}</span>
                  <br />
                  Cliente: {c.nome} ({c.tipo}) · {c.doc}
                  <br />
                  Contato: {c.email || '-'} · {c.telefone || '-'}
                  <br />
                  Quarto {q.numero} ({q.tipo}) · {r.data_checkin} a {r.data_checkout} ·{' '}
                  <b>{money(r.valor_total)}</b>
                  <ul className="chk">
                    {chk.map(([t, v]) => (
                      <li key={t} className={v ? 'y' : 'n'}>
                        {v ? '✔' : '✖'} {t}
                      </li>
                    ))}
                  </ul>
                  {r.status === 'PENDENTE' && (
                    <>
                      <div className="form">
                        <div>
                          <label>Motivo (obrigatório para recusar)</label>
                          <input value={mot} onChange={(e) => setMot(e.target.value)} />
                        </div>
                      </div>
                      {B('Confirmar reserva', 'CONFIRMADA', 'btn', !ok)}{' '}
                      {B('Recusar', 'CANCELADA', 'btn d')}
                    </>
                  )}
                  {r.status === 'CONFIRMADA' && (
                    <>
                      {B('Fazer check-in', 'EM_ANDAMENTO', 'btn', r.data_checkin > today)}{' '}
                      {r.data_checkin > today && (
                        <small>Check-in só a partir de {r.data_checkin}. </small>
                      )}
                      {G && (
                        <>
                          <input
                            style={{ margin: '8px 0' }}
                            placeholder="Motivo do cancelamento"
                            value={mot}
                            onChange={(e) => setMot(e.target.value)}
                          />
                          {B('Cancelar reserva', 'CANCELADA', 'btn d')}
                        </>
                      )}
                    </>
                  )}
                  {r.status === 'EM_ANDAMENTO' && B('Finalizar (check-out)', 'FINALIZADA')}
                  {['FINALIZADA', 'CANCELADA'].includes(r.status) && (
                    <small>Reserva encerrada.</small>
                  )}
                  {r.status === 'CONFIRMADA' && !G && (
                    <small style={{ display: 'block', marginTop: 6 }}>
                      Somente o gerente cancela reservas já confirmadas.
                    </small>
                  )}
                </div>
              </div>
            </div>
          )}
          <div className="card wrap">
            {rows.length ? (
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Cliente</th>
                    <th>Quarto</th>
                    <th>Check-in</th>
                    <th>Check-out</th>
                    <th>Status</th>
                    <th>Total</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((x) => {
                    const cl = d.clientes.find((y) => y.id === x.id_cliente),
                      qq = d.quartos.find((y) => y.id === x.id_quarto)
                    return (
                      <tr key={x.id}>
                        <td>{x.id}</td>
                        <td>{cl.nome}</td>
                        <td>{qq.numero}</td>
                        <td>{x.data_checkin}</td>
                        <td>{x.data_checkout}</td>
                        <td>
                          <span className="tag">{x.status}</span>
                        </td>
                        <td>{money(x.valor_total)}</td>
                        <td>
                          <button
                            className="btn g"
                            onClick={() => {
                              setSel(x.id)
                              setMot('')
                            }}
                          >
                            Conferir
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            ) : (
              <div className="empty">Nenhuma reserva com este status.</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
