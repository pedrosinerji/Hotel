// Planta baixa do quarto com carimbo de situação.
import { COL } from '../../domain/quartos.js'

export const sf = (f, s = 'var(--ink)', w = 2) => ({ fill: f, stroke: s, strokeWidth: w })

// planta baixa do quarto (vista de cima); a faixa colorida mostra a situação
export function RoomSVG({ q, es, sub }) {
  const bed = (x, y, w, h) => (
    <g key={x}>
      <rect x={x} y={y} width={w} height={h} rx="6" style={sf('var(--soft)')} />
      <rect
        x={x + 5}
        y={y + 6}
        width={w > 80 ? (w - 16) / 2 : w - 10}
        height="18"
        rx="5"
        style={sf('var(--card)', 'var(--ink)', 1.5)}
      />
      {w > 80 && (
        <rect
          x={x + w / 2 + 3}
          y={y + 6}
          width={(w - 16) / 2}
          height="18"
          rx="5"
          style={sf('var(--card)', 'var(--ink)', 1.5)}
        />
      )}
    </g>
  )
  const box = (x, y, w, h, k) => (
    <rect
      key={k}
      x={x}
      y={y}
      width={w}
      height={h}
      rx="4"
      style={sf('var(--card)', 'var(--ink)', 1.5)}
    />
  )
  const T = q.tipo
  return (
    <svg
      viewBox="0 0 320 200"
      style={{ width: '100%', display: 'block' }}
      role="img"
      aria-label={`Quarto ${q.numero}, ${q.tipo}, ${es}`}
    >
      <g>
        <rect
          x="10"
          y="10"
          width="300"
          height="180"
          rx="8"
          style={sf('var(--bg)', 'var(--ink)', 3)}
        />
        <rect
          x="10"
          y="10"
          width="300"
          height="180"
          rx="8"
          style={{ fill: COL[es], opacity: 0.14 }}
        />
        <rect x="105" y="7" width="100" height="6" style={{ fill: '#8fb4c9' }} />
        <rect x="26" y="186" width="44" height="8" style={{ fill: 'var(--card)' }} />
        <path
          d="M26 188 A44 44 0 0 1 70 144"
          style={{ fill: 'none', stroke: 'var(--mut)', strokeDasharray: '4 3' }}
        />
        <rect x="232" y="10" width="78" height="66" style={sf('var(--card)')} />
        <text x="271" y="60" textAnchor="middle" style={{ fill: 'var(--mut)', fontSize: 11 }}>
          WC
        </text>
        <circle cx="250" cy="30" r="9" style={sf('var(--bg)', 'var(--ink)', 1.5)} />
        <text x="20" y="30" style={{ fill: 'var(--ink)', fontSize: 16, fontWeight: 700 }}>
          Quarto {q.numero}
        </text>
        {T === 'SIMPLES' && [bed(40, 48, 60, 100), box(160, 152, 100, 24, 'd')]}
        {T === 'DUPLO' && [
          bed(36, 48, 56, 100),
          bed(104, 48, 56, 100),
          box(190, 152, 100, 24, 'd'),
        ]}
        {T === 'SUITE' && [
          bed(40, 44, 100, 110),
          box(180, 140, 110, 36, 's'),
          box(190, 98, 70, 22, 'd'),
        ]}
        {T === 'LUXO' && [
          bed(36, 40, 124, 120),
          box(176, 134, 120, 40, 's'),
          <circle key="t" cx="240" cy="108" r="16" style={sf('var(--card)', 'var(--ink)', 1.5)} />,
        ]}
        {es !== 'DISPONIVEL' && (
          <g>
            <g transform="rotate(-14 160 100)">
              <rect
                x="40"
                y="78"
                width="240"
                height="40"
                rx="3"
                style={{ fill: 'var(--card)', fillOpacity: 0.9, stroke: COL[es], strokeWidth: 3 }}
              />
              <rect
                x="45"
                y="83"
                width="230"
                height="30"
                rx="2"
                style={{ fill: 'none', stroke: COL[es], strokeWidth: 1 }}
              />
              <text
                x="160"
                y="106"
                textAnchor="middle"
                style={{ fill: COL[es], fontSize: 21, fontWeight: 700, letterSpacing: 2 }}
              >
                {es === 'MANUTENCAO' ? 'MANUTENÇÃO' : es}
              </text>
            </g>
            {sub && (
              <g>
                <rect
                  x="30"
                  y="150"
                  width="260"
                  height="22"
                  rx="11"
                  style={{ fill: 'var(--card)', stroke: COL[es] }}
                />
                <text
                  x="160"
                  y="165"
                  textAnchor="middle"
                  style={{ fill: 'var(--ink)', fontSize: 12 }}
                >
                  {sub}
                </text>
              </g>
            )}
          </g>
        )}
      </g>
    </svg>
  )
}
