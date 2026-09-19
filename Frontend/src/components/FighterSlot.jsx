import FighterPortrait from './FighterPortrait.jsx'

export function getMood(meme, stats) {
  const record = stats.fighters[meme.id]
  const popularity = meme.yesterdayPopularity + (record?.wins ?? 0) * 8 - (record?.losses ?? 0) * 5
  const isChamp = stats.lastChampionId === meme.id || popularity >= 80
  if (isChamp && popularity >= 70) return 'champion'
  if (popularity < 22) return 'homeless'
  if (popularity < 40) return 'washed'
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
  const record = stats.fighters[meme.id] ?? { wins: 0, losses: 0 }

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
          <dd>{meme.yesterdayPopularity}</dd>
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
