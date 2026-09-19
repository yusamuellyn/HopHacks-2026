import FighterPortrait from './FighterPortrait.jsx'
import { formatCount, getFighterRecord } from '../lib/stats.js'

export function getMood(meme, stats) {
  const record = getFighterRecord(stats, meme.id)
  const lastMonth = record.lastMonthMentions || 0
  const maxLastMonth = Math.max(1, stats.maxLastMonth || stats.maxYesterday || 0)
  const heat = Math.min(100, (Math.log1p(lastMonth) / Math.log1p(maxLastMonth)) * 100)
  const popularity = heat + (record.wins ?? 0) * 8 - (record.losses ?? 0) * 5
  const isChamp = stats.lastChampionId === meme.id || popularity >= 80
  if (isChamp && popularity >= 70) return 'champion'
  if (popularity < 12) return 'homeless'
  if (popularity < 28) return 'washed'
  return 'contender'
}

export default function FighterSlot({ meme, stats, side, emptyLabel }) {
  if (!meme) {
    return (
      <article className={`slot slot--empty slot--${side}`}>
        <div className="slot__silhouette">?</div>
        <h2>{emptyLabel}</h2>
        <p>Waiting for a fighter</p>
      </article>
    )
  }

  const mood = getMood(meme, stats)
  const record = getFighterRecord(stats, meme.id)

  return (
    <article
      className={`slot slot--filled slot--${side} slot--${mood}`}
      style={{ '--meme': meme.color, '--meme-accent': meme.accent }}
    >
      <div className="slot__meta">
        <span className="slot__age">{meme.age}</span>
        <span className="slot__origin">{meme.origin}</span>
      </div>
      <FighterPortrait meme={meme} mood={mood} />
      <h2>{meme.name}</h2>
      <p className="slot__desc">{meme.description}</p>
      <dl className="slot__stats">
        <div>
          <dt>Yesterday</dt>
          <dd>{formatCount(record.lastMonthMentions)}</dd>
        </div>
        <div>
          <dt>W / L</dt>
          <dd>
            {record.wins} / {record.losses}
          </dd>
        </div>
        <div>
          <dt>Aura</dt>
          <dd>{mood.toUpperCase()}</dd>
        </div>
      </dl>
    </article>
  )
}
