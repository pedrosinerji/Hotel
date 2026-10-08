// Ilustração da faixa principal do site.
import { IMG } from '../../config/images.js'

export function HeroScene() {
  if (IMG.hero) return <img className="bg" src={IMG.hero} alt="" style={{ objectFit: 'cover' }} />
  return (
    <svg
      className="bg"
      viewBox="0 0 1200 580"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="hs" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#16394a" />
          <stop offset=".55" stopColor="#3b7f93" />
          <stop offset="1" stopColor="#f2b574" />
        </linearGradient>
        <linearGradient id="hp" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5cc0d2" />
          <stop offset="1" stopColor="#2a7c92" />
        </linearGradient>
        <pattern id="hw" width="26" height="30" patternUnits="userSpaceOnUse">
          <rect x="6" y="7" width="13" height="17" fill="#ffd68a" opacity=".85" />
        </pattern>
      </defs>
      <rect width="1200" height="580" fill="url(#hs)" />
      <circle cx="930" cy="360" r="78" fill="#ffd9a0" opacity=".85" />
      <rect x="700" y="170" width="300" height="270" fill="#0f2f3b" />
      <rect x="700" y="170" width="300" height="270" fill="url(#hw)" />
      <rect x="560" y="250" width="150" height="190" fill="#143c4a" />
      <rect x="560" y="250" width="150" height="190" fill="url(#hw)" opacity=".7" />
      <rect x="1000" y="290" width="130" height="150" fill="#143c4a" />
      <rect x="1000" y="290" width="130" height="150" fill="url(#hw)" opacity=".7" />
      <rect x="0" y="440" width="1200" height="12" fill="#d9c9a8" />
      <rect x="0" y="452" width="1200" height="130" fill="url(#hp)" />
      <path
        d="M0 490q40-14 80 0t80 0t80 0t80 0t80 0t80 0t80 0t80 0t80 0t80 0t80 0t80 0t80 0t80 0t80 0t80 0"
        fill="none"
        stroke="#fff"
        strokeOpacity=".35"
        strokeWidth="3"
      />
      <path
        d="M0 535q40-14 80 0t80 0t80 0t80 0t80 0t80 0t80 0t80 0t80 0t80 0t80 0t80 0t80 0t80 0t80 0t80 0"
        fill="none"
        stroke="#fff"
        strokeOpacity=".25"
        strokeWidth="3"
      />
    </svg>
  )
}
