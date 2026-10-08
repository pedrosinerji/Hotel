// Mapa de ocupação: quartos por dias.
import { nomeCli } from '../../domain/reservas.js'
import { days, today, addD } from '../../utils/format.js'

// mapa de ocupação: quartos x dias
export function Gantt({ d, from, n = 14, hi }) {
  const ds = Array.from({ length: n }, (_, i) => addD(from, i)),
    to = addD(from, n),
    gt = { gridTemplateColumns: `56px repeat(${n},1fr)` }
  return (
    <div>
      <div className="card wrap">
        <div style={{ minWidth: 640 }}>
          <div className="gr" style={gt}>
            <span />
            {ds.map((x) => (
              <small key={x} className={x === today ? 'tdy' : ''}>
                {x.slice(8)}/{x.slice(5, 7)}
              </small>
            ))}
          </div>
          {[...d.quartos]
            .sort((a, b) => a.numero - b.numero)
            .map((q) => (
              <div className="gr" style={gt} key={q.id}>
                <b>{q.numero}</b>
                {ds.map((x, i) => (
                  <i key={x} style={{ gridColumn: i + 2, gridRow: 1 }} />
                ))}
                {d.reservas
                  .filter(
                    (r) =>
                      r.id_quarto === q.id &&
                      r.status !== 'CANCELADA' &&
                      r.data_checkin < to &&
                      r.data_checkout > from,
                  )
                  .map((r) => {
                    const a = Math.max(0, days(from, r.data_checkin)),
                      b = Math.min(n, days(from, r.data_checkout))
                    return (
                      <em
                        key={r.id}
                        className={'b-' + r.status + (r.id === hi ? ' hi' : '')}
                        style={{ gridColumn: `${a + 2}/${b + 2}`, gridRow: 1 }}
                        title={`#${r.id} ${r.status}`}
                      >
                        {nomeCli(d, r)}
                      </em>
                    )
                  })}
              </div>
            ))}
        </div>
      </div>
      <div className="lg">
        {[
          ['Confirmada', '#8a5a14'],
          ['Pendente', '#c9a24a'],
          ['Em andamento', '#a8402e'],
          ['Finalizada', '#8a9188'],
        ].map(([t, c]) => (
          <span key={t} style={{ '--c': c }}>
            {t}
          </span>
        ))}
      </div>
    </div>
  )
}
