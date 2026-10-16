export function Skyline({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 900 360" aria-hidden="true" className={className}>
      <rect y="250" width="900" height="110" fill="#321D2D" />
      <g fill="#7B302E"><rect x="60" y="190" width="260" height="110" /><rect x="340" y="160" width="220" height="140" /><rect x="590" y="200" width="250" height="100" /></g>
      <g fill="#43263B"><polygon points="60,190 190,140 320,190" /><polygon points="340,160 450,110 560,160" /><polygon points="590,200 715,160 840,200" /></g>
      <rect x="500" y="20" width="26" height="240" fill="#8d3a36" /><rect x="494" y="14" width="38" height="12" fill="#D9A04D" />
      <g fill="#D9A04D" opacity=".85">
        {[90, 130, 170, 370, 410, 620, 670].map((x, i) => <rect key={x} x={x} y={i < 3 ? 220 : i < 5 ? 195 : 225} width="14" height="24" />)}
      </g>
    </svg>
  )
}
