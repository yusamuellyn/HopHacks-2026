import { useMemo, useState } from 'react'
import { MEMES, memeDossier } from '../data/memes.js'
import { getDailyLeaderboard } from '../lib/stats.js'
import FighterPortrait from './FighterPortrait.jsx'
import { useSfx } from '../lib/sfx.jsx'

const PAGES = ['scouting', 'highlights', 'leaderboard']
const SOURCE_LABELS = {
  reddit: 'Reddit',
  x: 'X',
  tiktok: 'TikTok',
  news: 'News',
}

function roundShare(n) {
  return Math.round(n)
}

export default function BattleRecap({
  left,
  right,
  result,
  stats,
  totals,
  maxCombos,
  onRematch,
  onShare,
}) {
  const [page, setPage] = useState(0)
  const sfx = useSfx()
  const pageId = PAGES[page]
  const board = useMemo(() => getDailyLeaderboard(stats, MEMES), [stats])
  const recap = useMemo(() => buildRecap(left, right, result, totals, maxCombos), [left, right, result, totals, maxCombos])

  return (
    <div className="recap">
      <div className="recap__card">
        <p className="winner__kicker">POST-BATTLE · {page + 1} / 3</p>
        <h2 className="recap__title">
          {result.winner.name.toUpperCase()} WINS
        </h2>
        <p className="recap__sub">{roundShare(result.winnerShare)}% meme dominance</p>

        {pageId === 'scouting' && <ScoutPage left={left} right={right} winnerId={result.winner.id} />}
        {pageId === 'highlights' && <HighlightsPage recap={recap} left={left} right={right} result={result} />}
        {pageId === 'leaderboard' && <LeaderboardPage board={board} winnerId={result.winner.id} />}

        <div className="recap__nav">
          <button
            type="button"
            className="ghost-btn recap__btn"
            disabled={page === 0}
            onClick={() => {
              sfx.play('pageFlip')
              setPage((n) => n - 1)
            }}
          >
            BACK
          </button>
          {page < PAGES.length - 1 ? (
            <button
              type="button"
              className="start-btn recap__btn"
              onClick={() => {
                sfx.play('pageFlip')
                setPage((n) => n + 1)
              }}
            >
              NEXT
            </button>
          ) : (
            <button type="button" className="start-btn recap__btn" onClick={onRematch}>
              REMATCH
            </button>
          )}
        </div>
        {page === PAGES.length - 1 && (
          <div className="recap__share">
            <button type="button" className="ghost-btn recap__btn" onClick={onShare}>
              SHARE THIS BATTLE
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function WinnerCrown() {
  return (
    <span className="winner-crown" aria-hidden="true">
      <svg viewBox="0 0 64 52">
        <path
          d="M8 22 L18 8 L32 20 L46 6 L56 22 L52 40 H12 Z"
          fill="#ffe14a"
          stroke="#171717"
          strokeWidth="4"
          strokeLinejoin="round"
        />
        <rect x="12" y="40" width="40" height="7" rx="2" fill="#f0c020" stroke="#171717" strokeWidth="4" />
        <circle cx="18" cy="22" r="4" fill="#ff4b6e" stroke="#171717" strokeWidth="3" />
        <circle cx="32" cy="18" r="4" fill="#7ad3ff" stroke="#171717" strokeWidth="3" />
        <circle cx="46" cy="22" r="4" fill="#ff7a18" stroke="#171717" strokeWidth="3" />
      </svg>
    </span>
  )
}

function ScoutPage({ left, right, winnerId }) {
  return (
    <div className="recap-scout">
      <h3>Fighter dossiers</h3>
      <div className="recap-scout__grid">
        <Dossier meme={left} won={left.id === winnerId} />
        <Dossier meme={right} won={right.id === winnerId} />
      </div>
    </div>
  )
}

function Dossier({ meme, won }) {
  const info = memeDossier(meme)
  return (
    <article className={`dossier ${won ? 'dossier--won is-winner' : ''}`}>
      {won && <WinnerCrown />}
      <div className="dossier__head">
        <FighterPortrait meme={meme} mood="contender" state="idle" />
        <div>
          <p className="dossier__tag">{won ? 'WINNER' : 'RUNNER-UP'}</p>
          <h4>{meme.name}</h4>
        </div>
      </div>
      <dl>
        <div>
          <dt>Age</dt>
          <dd>Broke out in {info.age}</dd>
        </div>
        <div>
          <dt>Peak</dt>
          <dd>{info.peak}</dd>
        </div>
        <div>
          <dt>Origin</dt>
          <dd>{info.origin}</dd>
        </div>
        <div>
          <dt>Most used</dt>
          <dd>{info.mostUsed}</dd>
        </div>
        <div>
          <dt>Also known as</dt>
          <dd>{info.alsoKnownAs}</dd>
        </div>
        <div className="dossier__meaning">
          <dt>Meaning / context</dt>
          <dd>{info.meaning}</dd>
        </div>
      </dl>
    </article>
  )
}

function HighlightsPage({ recap, left, right, result }) {
  const sources = ['reddit', 'x', 'tiktok', 'news']
  return (
    <div className="recap-highlights">
      <h3>Match highlights</h3>
      <p className="recap-highlights__blurb">{recap.blurb}</p>
      <div className="recap-score">
        <div className={`recap-score__card ${left.id === result.winner.id ? 'is-winner' : ''}`}>
          {left.id === result.winner.id && <WinnerCrown />}
          <FighterPortrait meme={left} mood="contender" state="idle" bare />
          <div className="recap-score__meta">
            <strong>{left.name}</strong>
            <b>{result.left.mentions}</b>
            <span>scored mentions</span>
          </div>
        </div>
        <span className="recap-score__vs">VS</span>
        <div className={`recap-score__card ${right.id === result.winner.id ? 'is-winner' : ''}`}>
          {right.id === result.winner.id && <WinnerCrown />}
          <FighterPortrait meme={right} mood="contender" state="idle" bare />
          <div className="recap-score__meta">
            <strong>{right.name}</strong>
            <b>{result.right.mentions}</b>
            <span>scored mentions</span>
          </div>
        </div>
      </div>
      {recap.liveTotals && (
        <p className="recap-live">
          Live scrape this window: {recap.liveTotals.left} vs {recap.liveTotals.right} raw mentions
          {recap.liveTotals.metric ? ` · metric ${recap.liveTotals.metric}` : ''}.
        </p>
      )}
      <h4>Searches by site</h4>
      <ul className="recap-sources">
        {sources.map((source) => {
          const l = result.left.sources[source] || 0
          const r = result.right.sources[source] || 0
          const total = l + r || 1
          return (
            <li key={source}>
              <span>{SOURCE_LABELS[source]}</span>
              <div className="recap-bar" style={{ '--left': `${(l / total) * 100}%` }}>
                <i />
              </div>
              <em>
                {l}–{r}
              </em>
            </li>
          )
        })}
      </ul>
      <ul className="recap-notes">
        {recap.notes.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>
    </div>
  )
}

function LeaderboardPage({ board, winnerId }) {
  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })
  return (
    <div className="recap-board">
      <h3>Today&apos;s leaderboard</h3>
      <p className="recap-board__date">{today} · ranked by wins today</p>
      <ol className="recap-board__grid">
        {board.map((row, index) => {
          const place = index + 1
          const podium = place === 1 ? 'gold' : place === 2 ? 'silver' : place === 3 ? 'bronze' : ''
          return (
            <li
              key={row.id}
              className={`${row.id === winnerId ? 'is-champ' : ''} ${podium ? `is-podium is-podium--${podium}` : ''}`}
            >
              <PlacePlaque place={place} />
              <FighterPortrait meme={row} mood="contender" state="idle" bare />
              <strong className="recap-board__name">{row.name}</strong>
              <span className="recap-board__stat">{row.dayWins} today</span>
              <span className="recap-board__stat recap-board__stat--muted">
                {row.wins}-{row.losses} all-time
              </span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

function PlacePlaque({ place }) {
  if (place > 3) return <span className="recap-board__rank">{place}</span>
  const metal = ['gold', 'silver', 'bronze'][place - 1]
  const label = ['1st', '2nd', '3rd'][place - 1]
  return (
    <span className={`plaque plaque--${metal}`}>
      <small>PLACE</small>
      <b>{label}</b>
    </span>
  )
}

function buildRecap(left, right, result, totals, maxCombos) {
  const winnerMentions = result.winnerSide === 'left' ? result.left.mentions : result.right.mentions
  const loserMentions = result.winnerSide === 'left' ? result.right.mentions : result.left.mentions
  const sourceTotals = ['reddit', 'x', 'tiktok', 'news'].map((source) => ({
    source,
    n: (result.left.sources[source] || 0) + (result.right.sources[source] || 0),
  }))
  const loudest = [...sourceTotals].sort((a, b) => b.n - a.n)[0]
  const winnerCombo = maxCombos?.[result.winnerSide] || 0
  const notes = [
    `${result.winner.name} closed it ${winnerMentions}–${loserMentions} in the scored search window.`,
    `Loudest platform: ${SOURCE_LABELS[loudest.source]} with ${loudest.n} hits this fight.`,
    winnerCombo > 1
      ? `${result.winner.name} stacked a ${winnerCombo}-hit combo before the KO.`
      : `${result.loser.name} never found a real combo. The timeline did not blink.`,
  ]
  return {
    blurb: `${result.winner.name} took the belt with ${roundShare(result.winnerShare)}% of the timeline. ${result.loser.name} showed up, then got washed as the mentions piled on.`,
    notes,
    liveTotals: totals
      ? { left: totals.leftTotal ?? 0, right: totals.rightTotal ?? 0, metric: totals.metric }
      : null,
  }
}
