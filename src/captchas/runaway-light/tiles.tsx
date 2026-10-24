import type { ReactNode } from 'react';

/**
 * Original illustrated tiles (no stock photos, nothing to license).
 * To use real photos instead, swap a tile's `art` for <img src={...} alt="" />
 * with the image file in this folder.
 */

export interface Tile {
  id: string;
  /** Accessible description. Honest, because the joke isn't on screen-reader users. */
  label: string;
  hasLight: boolean;
  art: ReactNode;
}

const INK = '#18221a';
const ROAD = '#8b8f86';

function Signal({
  x,
  y,
  scale = 1,
  lit,
}: {
  x: number;
  y: number;
  scale?: number;
  lit?: 'red' | 'amber' | 'green';
}) {
  const on = (color: 'red' | 'amber' | 'green') => (lit === undefined || lit === color ? 1 : 0.3);
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <rect x="-2" y="34" width="4" height="70" fill="#3a3f3a" />
      <rect x="-10" y="-4" width="20" height="42" rx="6" fill={INK} />
      <circle cy="6" r="5.2" fill="#e5533d" opacity={on('red')} />
      <circle cy="17" r="5.2" fill="#f2b33d" opacity={on('amber')} />
      <circle cy="28" r="5.2" fill="#6cc56a" opacity={on('green')} />
    </g>
  );
}

function Scene({ sky, children }: { sky: string; children: ReactNode }) {
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="100" height="100" fill={sky} />
      {children}
    </svg>
  );
}

export const TILES: Tile[] = [
  {
    id: 'crosswalk',
    label: 'A crosswalk with a traffic light',
    hasLight: true,
    art: (
      <Scene sky="#cfe3e8">
        <rect y="62" width="100" height="38" fill={ROAD} />
        {[8, 26, 44, 62, 80].map((x) => (
          <rect key={x} x={x} y="76" width="11" height="24" fill="#f5f3ea" />
        ))}
        <Signal x={74} y={16} scale={0.85} lit="red" />
      </Scene>
    ),
  },
  {
    id: 'bus',
    label: 'A city bus',
    hasLight: false,
    art: (
      <Scene sky="#ece4d0">
        <rect y="72" width="100" height="28" fill={ROAD} />
        <rect x="10" y="36" width="80" height="40" rx="7" fill="#e9b949" />
        {[16, 34, 52, 70].map((x) => (
          <rect key={x} x={x} y="43" width="14" height="13" rx="2" fill="#2f4752" />
        ))}
        <circle cx="28" cy="78" r="7" fill={INK} />
        <circle cx="72" cy="78" r="7" fill={INK} />
      </Scene>
    ),
  },
  {
    id: 'close-up',
    label: 'A close-up of a traffic light',
    hasLight: true,
    art: (
      <Scene sky="#b9d6df">
        <ellipse cx="22" cy="24" rx="16" ry="7" fill="#e9f2f3" />
        <ellipse cx="80" cy="64" rx="14" ry="6" fill="#e9f2f3" />
        <Signal x={50} y={14} scale={1.6} lit="amber" />
      </Scene>
    ),
  },
  {
    id: 'palm',
    label: 'A palm tree at sunset',
    hasLight: false,
    art: (
      <Scene sky="#f3d2a8">
        <circle cx="70" cy="40" r="16" fill="#f6a65b" />
        <rect y="80" width="100" height="20" fill="#d9b98a" />
        <path d="M38 82 C40 60 42 44 46 30" stroke="#6b4f35" strokeWidth="5" fill="none" />
        <path
          d="M46 30 C34 22 22 26 16 34 M46 30 C52 18 64 16 72 22 M46 30 C38 16 40 8 44 4 M46 30 C58 28 66 36 68 46 M46 30 C36 34 30 44 30 52"
          stroke="#3f6b3a"
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
        />
      </Scene>
    ),
  },
  {
    id: 'bird',
    label: 'A bird sitting on a traffic light',
    hasLight: true,
    art: (
      <Scene sky="#d6e4d0">
        <Signal x={44} y={34} scale={1} lit="green" />
        <ellipse cx="46" cy="25" rx="9" ry="6" fill="#7b6a5a" />
        <circle cx="53" cy="20" r="4.5" fill="#7b6a5a" />
        <path d="M57 20 l5 1.5 -5 1.5z" fill="#f2b33d" />
        <circle cx="54" cy="19" r="1" fill={INK} />
      </Scene>
    ),
  },
  {
    id: 'hydrant',
    label: 'A fire hydrant',
    hasLight: false,
    art: (
      <Scene sky="#dcdcd2">
        <rect y="74" width="100" height="26" fill="#bdb9ac" />
        <rect x="38" y="36" width="24" height="44" rx="5" fill="#d2463a" />
        <rect x="34" y="34" width="32" height="7" rx="3" fill="#b13a30" />
        <rect x="28" y="52" width="44" height="8" rx="3" fill="#b13a30" />
        <circle cx="50" cy="30" r="7" fill="#d2463a" />
      </Scene>
    ),
  },
  {
    id: 'bicycle',
    label: 'A parked bicycle',
    hasLight: false,
    art: (
      <Scene sky="#e1e8ec">
        <rect y="78" width="100" height="22" fill="#c4c6bc" />
        <circle cx="28" cy="62" r="15" fill="none" stroke={INK} strokeWidth="3.5" />
        <circle cx="72" cy="62" r="15" fill="none" stroke={INK} strokeWidth="3.5" />
        <path
          d="M28 62 L44 40 L62 40 L72 62 M44 40 L52 62 L62 40 M40 34 h10 M62 40 l-2 -10 h8"
          stroke="#2f6f5e"
          strokeWidth="3.5"
          strokeLinejoin="round"
          fill="none"
        />
      </Scene>
    ),
  },
  {
    id: 'night',
    label: 'A traffic light at night',
    hasLight: true,
    art: (
      <Scene sky="#26324a">
        {[
          [12, 14],
          [30, 30],
          [84, 12],
          [70, 34],
          [18, 52],
        ].map(([cx, cy]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="1.3" fill="#f5f3ea" />
        ))}
        <circle cx="50" cy="56" r="20" fill="#6cc56a" opacity="0.18" />
        <Signal x={50} y={22} scale={1.1} lit="green" />
      </Scene>
    ),
  },
  {
    id: 'duck',
    label: 'A duck using the crosswalk',
    hasLight: false,
    art: (
      <Scene sky="#d4e2e6">
        <rect y="56" width="100" height="44" fill={ROAD} />
        {[4, 24, 44, 64, 84].map((x) => (
          <rect key={x} x={x} y="64" width="12" height="36" fill="#f5f3ea" />
        ))}
        <ellipse cx="50" cy="66" rx="17" ry="11" fill="#f6d14b" />
        <circle cx="62" cy="50" r="9" fill="#f6d14b" />
        <path d="M70 50 l9 2 -9 3z" fill="#ef8a2d" />
        <circle cx="64" cy="48" r="1.6" fill={INK} />
        <path d="M44 76 v8 h-4 M54 76 v8 h-4" stroke="#ef8a2d" strokeWidth="2.5" fill="none" />
      </Scene>
    ),
  },
];
