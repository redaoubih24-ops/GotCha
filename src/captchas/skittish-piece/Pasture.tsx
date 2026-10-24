/** The puzzle picture: an original pasture, drawn in board units (320 × 200). */

function Sheep({ x, y, flip = false }: { x: number; y: number; flip?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -1 : 1} 1)`}>
      <path d="M-4 10 v8 M8 10 v8" stroke="#18221a" strokeWidth="2.4" strokeLinecap="round" />
      <ellipse cx="2" cy="4" rx="13" ry="9" fill="#fffef9" />
      <circle cx="-6" cy="0" r="6" fill="#fffef9" />
      <circle cx="8" cy="-1" r="6" fill="#fffef9" />
      <ellipse cx="15" cy="2" rx="5" ry="6" fill="#18221a" />
      <circle cx="16.5" cy="1" r="1" fill="#fffef9" />
    </g>
  );
}

export default function Pasture() {
  return (
    <g>
      <rect width="320" height="200" fill="#d9ebe6" />
      <circle cx="262" cy="38" r="20" fill="#f5e27a" />
      <ellipse cx="70" cy="34" rx="30" ry="9" fill="#f5f3ea" />
      <ellipse cx="160" cy="22" rx="20" ry="6" fill="#f5f3ea" />
      <path d="M0 108 C60 78 120 86 180 100 S280 88 320 98 V200 H0 Z" fill="#a9cf7c" />
      <path d="M0 140 C70 118 150 126 220 136 S300 128 320 132 V200 H0 Z" fill="#8fbf62" />
      <path d="M0 172 C80 160 180 166 320 160 V200 H0 Z" fill="#79ad4f" />
      {[10, 40, 70, 100, 130].map((x) => (
        <rect key={x} x={x} y="120" width="5" height="34" rx="1.5" fill="#8a6a49" />
      ))}
      <rect x="6" y="126" width="132" height="4" rx="2" fill="#a07b55" />
      <rect x="6" y="140" width="132" height="4" rx="2" fill="#a07b55" />
      <Sheep x={186} y={128} />
      <Sheep x={282} y={150} flip />
      <Sheep x={238} y={110} />
      <Sheep x={60} y={170} flip />
      {[
        [196, 176],
        [150, 186],
        [300, 184],
        [24, 186],
      ].map(([cx, cy]) => (
        <g key={`${cx}-${cy}`}>
          <circle cx={cx} cy={cy} r="2.4" fill="#fffef9" />
          <circle cx={cx} cy={cy} r="1" fill="#f2b33d" />
        </g>
      ))}
    </g>
  );
}
