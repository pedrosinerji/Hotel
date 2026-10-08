// Ilustração do quarto usada nos cartões de acomodação.
import { IMG } from '../../config/images.js'

// ilustração do quarto (tipo define camas, sofá e janela)
export function Scene({ tipo, label }) {
  if (IMG[tipo])
    return (
      <img
        src={IMG[tipo]}
        alt={label || tipo}
        style={{ display: 'block', width: '100%', aspectRatio: '8/5', objectFit: 'cover' }}
      />
    )
  const cfg = {
    SIMPLES: { b: [[70, 110]], c: '#6d8f96' },
    DUPLO: {
      b: [
        [25, 100],
        [135, 100],
      ],
      c: '#c4a15a',
    },
    SUITE: { b: [[35, 170]], c: '#7a5c72' },
    LUXO: { b: [[30, 200]], c: '#1f4e5a' },
  }[tipo]
  const wx = tipo === 'LUXO' ? 250 : 268,
    ww = tipo === 'LUXO' ? 130 : 104
  return (
    <svg
      viewBox="0 0 400 250"
      role="img"
      aria-label={label || tipo}
      style={{ background: '#ebe3d3' }}
    >
      <defs>
        <linearGradient id="sk" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#a9d6ea" />
          <stop offset="1" stopColor="#f6e6c4" />
        </linearGradient>
        <linearGradient id="wl" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f4eee2" />
          <stop offset="1" stopColor="#e0d6c3" />
        </linearGradient>
      </defs>
      <rect width="400" height="190" fill="url(#wl)" />
      <rect y="190" width="400" height="60" fill="#8c6b4a" />
      <rect y="186" width="400" height="6" fill="#6f533a" />
      <rect x={wx} y="34" width={ww} height="112" fill="url(#sk)" stroke="#fff" strokeWidth="6" />
      <path d={`M${wx + ww / 2} 34v112M${wx} 90h${ww}`} stroke="#fff" strokeWidth="3" />
      <path d="M0 146 L40 120 L80 150Z" fill="#7aa58a" opacity=".0" />
      <rect x={wx - 16} y="30" width="14" height="124" rx="4" fill="#cdb995" />
      <rect x={wx + ww + 2} y="30" width="14" height="124" rx="4" fill="#cdb995" />
      <ellipse cx="150" cy="226" rx="130" ry="13" fill="#e8dcc6" opacity=".85" />
      {cfg.b.map(([x, w]) => (
        <g key={x}>
          <rect x={x} y="72" width={w} height="72" rx="6" fill="#6b4a32" />
          <rect x={x - 4} y="122" width={w + 8} height="70" rx="8" fill="#fbfaf6" />
          <rect x={x - 4} y="150" width={w + 8} height="42" rx="6" fill={cfg.c} />
          <rect x={x + 8} y="118" width={w / 2 - 14} height="20" rx="8" fill="#fff" />
          {w > 120 && (
            <rect x={x + w / 2 + 6} y="118" width={w / 2 - 14} height="20" rx="8" fill="#fff" />
          )}
        </g>
      ))}
      <rect
        x={tipo === 'DUPLO' ? 244 : cfg.b[0][0] + cfg.b[0][1] + 10}
        y="150"
        width="26"
        height="40"
        rx="3"
        fill="#6b4a32"
      />
      <circle
        cx={(tipo === 'DUPLO' ? 244 : cfg.b[0][0] + cfg.b[0][1] + 10) + 13}
        cy="136"
        r="9"
        fill="#ffe6a8"
      />
      {(tipo === 'SUITE' || tipo === 'LUXO') && (
        <g>
          <rect x="296" y="164" width="92" height="42" rx="8" fill="#5d7b83" />
          <rect x="296" y="150" width="92" height="22" rx="8" fill="#6f8f98" />
        </g>
      )}
      {tipo === 'LUXO' && (
        <g>
          <path d="M200 0v22" stroke="#6b4a32" strokeWidth="3" />
          <circle cx="200" cy="30" r="12" fill="#ffe6a8" />
          <rect x="372" y="150" width="14" height="40" rx="3" fill="#4d7a52" />
        </g>
      )}
    </svg>
  )
}
