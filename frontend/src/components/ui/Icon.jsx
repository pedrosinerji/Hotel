// Ícones de comodidades.

export const ICON = {
  wifi: (
    <>
      <path d="M5 12.5a11 11 0 0 1 14 0M1.5 9a16 16 0 0 1 21 0M8.5 16a6 6 0 0 1 7 0M12 20h.01" />
    </>
  ),
  coffee: (
    <>
      <path d="M17 8h1a4 4 0 0 1 0 8h-1M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4zM6 2v2M10 2v2M14 2v2" />
    </>
  ),
  pool: (
    <>
      <path d="M2 8q2.5-3 5 0t5 0t5 0t5 0M2 14q2.5-3 5 0t5 0t5 0t5 0M7 3v8M15 3v8M7 5h8" />
    </>
  ),
  car: (
    <>
      <path d="M3 16v-4l2-5h14l2 5v4zM3 16v2h3v-2M18 16v2h3v-2M6 12h12" />
      <circle cx="7.5" cy="14" r=".6" />
      <circle cx="16.5" cy="14" r=".6" />
    </>
  ),
  snow: (
    <>
      <path d="M12 2v20M3.3 7l17.4 10M3.3 17L20.7 7" />
    </>
  ),
  tv: (
    <>
      <rect x="2" y="5" width="20" height="13" rx="2" />
      <path d="M8 21h8" />
    </>
  ),
  fridge: (
    <>
      <rect x="6" y="2" width="12" height="20" rx="2" />
      <path d="M6 11h12M9 6v2M9 14v3" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
}

export const Icon = ({ n }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    {ICON[n]}
  </svg>
)
