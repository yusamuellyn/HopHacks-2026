import { memePhoto } from '../lib/memeArt.js'

function paths(sigil) {
  switch (sigil) {
    case 'drum':
      return (
        <>
          <rect x="34" y="38" width="52" height="70" rx="10" />
          <circle cx="60" cy="30" r="16" />
          <path d="M28 92 L92 92 L84 118 L36 118 Z" />
        </>
      )
    case 'toilet':
      return (
        <>
          <ellipse cx="60" cy="44" rx="28" ry="18" />
          <rect x="38" y="48" width="44" height="36" rx="8" />
          <path d="M46 84 h28 v18 a18 18 0 0 1 -28 0 z" />
        </>
      )
    case 'ohio':
      return (
        <>
          <path d="M30 40 L52 34 L78 38 L88 46 L86 92 L70 104 L40 100 L28 78 Z" />
          <circle cx="58" cy="64" r="8" />
        </>
      )
    case '67':
      return (
        <>
          <text x="60" y="92" textAnchor="middle" fontSize="52" fontWeight="700" fill="currentColor">
            67
          </text>
        </>
      )
    case 'shark':
      return (
        <>
          <path d="M20 72 C40 40 90 40 104 70 L88 78 L20 78 Z" />
          <path d="M70 48 L78 28 L86 50" />
        </>
      )
    case 'croc':
      return (
        <>
          <path d="M18 70 L70 52 L108 68 L96 86 L24 86 Z" />
          <rect x="22" y="46" width="40" height="12" rx="3" />
        </>
      )
    case 'labubu':
      return (
        <>
          <circle cx="60" cy="68" r="28" />
          <path d="M38 48 L32 22 L50 44" />
          <path d="M82 48 L88 22 L70 44" />
        </>
      )
    case 'chill':
      return (
        <>
          <ellipse cx="60" cy="70" rx="30" ry="26" />
          <circle cx="48" cy="66" r="5" />
          <circle cx="72" cy="66" r="5" />
        </>
      )
    case 'rizz':
      return (
        <>
          <path d="M60 28 L84 88 L36 88 Z" />
          <circle cx="60" cy="56" r="8" />
        </>
      )
    case 'sigma':
      return (
        <>
          <path d="M34 36 H86 L60 64 L86 108 H34" />
        </>
      )
    case 'gyatt':
      return (
        <>
          <circle cx="60" cy="62" r="30" />
          <path d="M42 70 Q60 96 78 70" />
        </>
      )
    case 'tax':
      return (
        <>
          <rect x="30" y="36" width="60" height="56" rx="6" />
          <path d="M42 56 H78 M42 72 H78" />
        </>
      )
    case 'demure':
      return (
        <>
          <path d="M36 96 Q60 28 84 96 Z" />
        </>
      )
    case 'brat':
      return (
        <>
          <rect x="28" y="36" width="64" height="64" />
        </>
      )
    default:
      return <circle cx="60" cy="64" r="28" />
  }
}

export function memeGlyph(meme) {
  if (meme.sigil === '67') return '67'
  return meme.name.split(/[\s-]/)[0].slice(0, 7).toUpperCase()
}

export default function FighterPortrait({ meme, mood, state = 'idle', bare = false }) {
  const photo = memePhoto(meme)
  return (
    <div
      className={`portrait portrait--${mood} portrait--${state} ${photo ? 'portrait--photo' : ''}`}
      style={{ '--meme': meme.color, '--meme-accent': meme.accent }}
    >
      {photo ? (
        <img src={photo} alt="" draggable="false" />
      ) : (
        <svg viewBox="0 0 120 130" aria-hidden="true">
          <g fill="currentColor">{paths(meme.sigil)}</g>
        </svg>
      )}
      {!bare && mood === 'champion' && <div className="portrait__belt">CHAMPION</div>}
      {!bare && mood === 'washed' && <div className="portrait__sign">WASHED</div>}
      {!bare && mood === 'homeless' && <div className="portrait__sign">TIRED</div>}
    </div>
  )
}
