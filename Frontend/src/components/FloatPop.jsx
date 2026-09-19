const SHAPES = ['star', 'crown', 'crow', 'burst', 'heart', 'bolt', 'diamond', 'hex']
const PATHS = ['arc', 'dip', 'zag', 'loop', 'bounce', 'slash']

export function pickShape() {
  return SHAPES[Math.floor(Math.random() * SHAPES.length)]
}

export function pickPath() {
  return PATHS[Math.floor(Math.random() * PATHS.length)]
}

function Glyph({ shape }) {
  switch (shape) {
    case 'star':
      return (
        <svg viewBox="0 0 64 64" aria-hidden="true">
          <polygon points="32,4 40,24 62,24 44,38 52,58 32,46 12,58 20,38 2,24 24,24" />
        </svg>
      )
    case 'crown':
      return (
        <svg viewBox="0 0 64 64" aria-hidden="true">
          <path d="M8 48 L12 20 L24 34 L32 12 L40 34 L52 20 L56 48 Z" />
          <rect x="10" y="48" width="44" height="8" rx="2" />
        </svg>
      )
    case 'crow':
      return (
        <svg viewBox="0 0 64 64" aria-hidden="true">
          <path d="M10 34 C18 18 30 16 40 22 C48 14 58 16 60 24 C50 24 48 30 50 38 C44 50 28 52 16 44 C12 50 6 52 4 48 C8 46 10 40 10 34 Z" />
          <circle cx="22" cy="28" r="2.5" fill="#fffdf6" />
        </svg>
      )
    case 'burst':
      return (
        <svg viewBox="0 0 64 64" aria-hidden="true">
          <polygon points="32,2 38,22 58,12 44,30 62,32 44,36 58,52 38,42 32,62 26,42 6,52 20,36 2,32 20,30 6,12 26,22" />
        </svg>
      )
    case 'heart':
      return (
        <svg viewBox="0 0 64 64" aria-hidden="true">
          <path d="M32 56 C12 40 6 26 16 16 C24 10 30 14 32 20 C34 14 40 10 48 16 C58 26 52 40 32 56 Z" />
        </svg>
      )
    case 'bolt':
      return (
        <svg viewBox="0 0 64 64" aria-hidden="true">
          <polygon points="36,4 16,36 30,36 24,60 50,26 34,26" />
        </svg>
      )
    case 'diamond':
      return (
        <svg viewBox="0 0 64 64" aria-hidden="true">
          <polygon points="32,4 60,32 32,60 4,32" />
        </svg>
      )
    default:
      return (
        <svg viewBox="0 0 64 64" aria-hidden="true">
          <polygon points="18,8 46,8 60,32 46,56 18,56 4,32" />
        </svg>
      )
  }
}

export default function FloatPop({ pop }) {
  return (
    <span
      className={`float-pop float-pop--${pop.side}`}
      style={{
        left: pop.x,
        top: pop.y,
        '--rot': `${pop.rot}deg`,
        '--scale': pop.scale,
        color: pop.color,
      }}
    >
      <Glyph shape={pop.shape} />
      {pop.text ? <em>{pop.text}</em> : null}
    </span>
  )
}

export function Projectile({ shot }) {
  return (
    <div
      className={`shot shot--from-${shot.from} shot--${shot.path}`}
      style={{ color: shot.color }}
    >
      <Glyph shape={shot.shape} />
    </div>
  )
}
