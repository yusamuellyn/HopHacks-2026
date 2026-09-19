import { useMemo, useState } from 'react'
import { MEMES, memeDossier } from '../data/memes.js'
import { formatCount, getDailyLeaderboard, getFighterRecord } from '../lib/stats.js'
import FighterPortrait from './FighterPortrait.jsx'
import { useSfx } from '../lib/sfx.jsx'

const PAGES = ['scouting', 'highlights', 'leaderboard']

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
  const recap = useMemo(
    () => buildRecap(left, right, result, totals, maxCombos, stats),
    [left, right, result, totals, maxCombos, stats],
  )

  return (
    <div className="recap">
      <div className="recap__card">
        <p className="winner__kicker">POST-BATTLE · {page + 1} / 3</p>
        <h2 className="recap__title">
          {result.winner.name.toUpperCase()} WINS
        </h2>
        <p className="recap__sub">{roundShare(result.winnerShare)}% meme dominance</p>

        {pageId === 'scouting' && <ScoutPage left={left} right={right} winnerId={result.winner.id} />}
        {pageId === 'highlights' && <HighlightsPage recap={recap} left={left} right={right} result={result} totals={totals} />}
        {pageId === 'leaderboard' && <LeaderboardPage board={board} winnerId={result.winner.id} stats={stats} />}

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

function HighlightsPage({ recap, left, right, result, totals }) {
  const rows = [
    { label: 'Yesterday', left: totals?.leftYesterday ?? 0, right: totals?.rightYesterday ?? 0 },
    { label: 'Latest day', left: totals?.leftLatest ?? 0, right: totals?.rightLatest ?? 0 },
    { label: 'All posts', left: result.left.mentions, right: result.right.mentions },
  ]
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
            <b>{formatCount(result.left.mentions)}</b>
            <span>keyword hits</span>
          </div>
        </div>
        <span className="recap-score__vs">VS</span>
        <div className={`recap-score__card ${right.id === result.winner.id ? 'is-winner' : ''}`}>
          {right.id === result.winner.id && <WinnerCrown />}
          <FighterPortrait meme={right} mood="contender" state="idle" bare />
          <div className="recap-score__meta">
            <strong>{right.name}</strong>
            <b>{formatCount(result.right.mentions)}</b>
            <span>keyword hits</span>
          </div>
        </div>
      </div>
      <h4>When they were found</h4>
      <ul className="recap-sources">
        {rows.map((row) => {
          const total = row.left + row.right || 1
          return (
            <li key={row.label}>
              <span>{row.label}</span>
              <div className="recap-bar" style={{ '--left': `${(row.left / total) * 100}%` }}>
                <i />
              </div>
              <em>
                {formatCount(row.left)}–{formatCount(row.right)}
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

function LeaderboardPage({ board, winnerId, stats }) {
  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })
  const recent = stats.recent || []
  return (
    <div className="recap-board">
      <h3>Arena record</h3>
      <p className="recap-board__date">
        {today} · {stats.battles || 0} tracked fight{stats.battles === 1 ? '' : 's'}
      </p>
      <ol className="recap-board__grid">
        {board.length === 0 && (
          <li className="recap-board__empty">No saved fights yet. This one just got logged.</li>
        )}
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
                {row.wins}-{row.losses} record
              </span>
            </li>
          )
        })}
      </ol>
      {recent.length > 0 && (
        <div className="recap-history">
          <h4>Recent fights</h4>
          <ul>
            {recent.slice(0, 6).map((fight) => (
              <li key={fight.id}>
                {nameFor(fight.leftId)} vs {nameFor(fight.rightId)} · {nameFor(fight.winnerId)} won {roundShare(fight.winnerShare)}%
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function nameFor(id) {
  return MEMES.find((meme) => meme.id === id)?.name || id
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

function buildRecap(left, right, result, totals, maxCombos, stats) {
  const winnerMentions = result.winnerSide === 'left' ? result.left.mentions : result.right.mentions
  const loserMentions = result.winnerSide === 'left' ? result.right.mentions : result.left.mentions
  const winnerCombo = maxCombos?.[result.winnerSide] || 0
  const winnerRecord = getFighterRecord(stats, result.winner.id)
  const ydayWinner = result.winnerSide === 'left' ? totals?.leftYesterday : totals?.rightYesterday
  const ydayLoser = result.winnerSide === 'left' ? totals?.rightYesterday : totals?.leftYesterday
  const notes = [
    `${result.winner.name} closed it ${formatCount(winnerMentions)}–${formatCount(loserMentions)} on real keyword hits.`,
    `Yesterday's searches: ${formatCount(ydayWinner)} for ${result.winner.name} vs ${formatCount(ydayLoser)} for ${result.loser.name}.`,
    winnerCombo > 1
      ? `${result.winner.name} stacked a ${winnerCombo}-hit combo before the KO.`
      : `${result.loser.name} never found a real combo. The timeline did not blink.`,
    winnerRecord.wins || winnerRecord.losses
      ? `${result.winner.name} now sits at ${winnerRecord.wins}-${winnerRecord.losses} in the arena book.`
      : `${result.winner.name} just opened an arena record.`,
  ]
  return {
    blurb: `${result.winner.name} took the belt with ${roundShare(result.winnerShare)}% of the posts. ${result.loser.name} showed up, then got washed as the mentions piled on.`,
    notes,
  }
}
