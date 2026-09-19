import { useEffect, useMemo, useRef, useState } from 'react'
import { startBattle } from '../lib/battleEngine.js'
import { useFx } from '../lib/fx.jsx'
import { getMood } from './FighterSlot.jsx'
import FighterPortrait, { memeGlyph } from './FighterPortrait.jsx'
import FloatPop, { pickPath, pickShape, Projectile } from './FloatPop.jsx'
import StageBackdrop from './StageBackdrop.jsx'
import { useCountUp } from '../lib/useCountUp.js'

const EASTER_HP = {
  21: '21 🫡',
  67: 'six seven',
  69: 'nice.',
}

function roundShare(n) {
  return Math.round(n)
}

function downloadShareCard({ left, right, winner, winnerShare }) {
  const canvas = document.createElement('canvas')
  canvas.width = 1080
  canvas.height = 1080
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#7ad3ff'
  ctx.fillRect(0, 0, 1080, 1080)
  ctx.fillStyle = '#ffe14a'
  ctx.beginPath()
  ctx.arc(160, 140, 90, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#171717'
  ctx.font = '800 72px Impact, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('MEME ARENA', 540, 160)
  ctx.fillStyle = '#ff4b6e'
  ctx.font = '700 54px sans-serif'
  ctx.fillText(`${winner.name.toUpperCase()} WINS`, 540, 270)
  ctx.fillStyle = '#171717'
  ctx.font = '600 36px sans-serif'
  ctx.fillText(`${left.name}  vs  ${right.name}`, 540, 360)
  ctx.font = '700 48px sans-serif'
  ctx.fillText(`${roundShare(winnerShare)}% MEME DOMINANCE`, 540, 450)
  ctx.font = '400 28px sans-serif'
  ctx.fillText('HopHacks 2026 · Memetics', 540, 980)

  const link = document.createElement('a')
  link.download = `meme-arena-${winner.id}.png`
  link.href = canvas.toDataURL('image/png')
  link.click()
}

export default function Arena({ left, right, stats, onRematch, onBattleEnd }) {
  const { fx } = useFx()
  const [feed, setFeed] = useState([])
  const [frame, setFrame] = useState(null)
  const [result, setResult] = useState(null)
  const [flash, setFlash] = useState(null)
  const [easter, setEaster] = useState(null)
  const [hit, setHit] = useState(null)
  const [comboPops, setComboPops] = useState([])
  const [combos, setCombos] = useState({ left: 0, right: 0 })
  const [rain, setRain] = useState([])
  const [rates, setRates] = useState({ left: 0, right: 0 })
  const [shot, setShot] = useState(null)
  const [throwSide, setThrowSide] = useState(null)
  const [totals, setTotals] = useState(null)
  const seenEaster = useRef(new Set())
  const ended = useRef(false)
  const feedRef = useRef(null)
  const lastSide = useRef(null)
  const combosRef = useRef({ left: 0, right: 0 })
  const hitTimes = useRef({ left: [], right: [] })
  const particleId = useRef(0)
  const inflight = useRef(false)

  const leftMood = getMood(left, stats)
  const rightMood = getMood(right, stats)

  useEffect(() => {
    ended.current = false
    const stop = startBattle({
      left,
      right,
      onTick: (next) => {
        setFrame(next)
        setFeed((lines) => [next.event, ...lines].slice(0, 18))

        const now = performance.now()
        const attacker = next.event.side
        const defender = attacker === 'left' ? 'right' : 'left'
        const meme = attacker === 'left' ? left : right
        hitTimes.current[attacker].push(now)
        hitTimes.current.left = hitTimes.current.left.filter((time) => now - time < 5000)
        hitTimes.current.right = hitTimes.current.right.filter((time) => now - time < 5000)
        setRates({
          left: Math.round((hitTimes.current.left.length / 5) * 60),
          right: Math.round((hitTimes.current.right.length / 5) * 60),
        })

        const nextCombo = lastSide.current === attacker ? (combosRef.current[attacker] || 0) + 1 : 1
        lastSide.current = attacker
        combosRef.current = { ...combosRef.current, [attacker]: nextCombo, [defender]: 0 }
        setCombos({ ...combosRef.current })

        if (!inflight.current) {
          inflight.current = true
          const shape = pickShape()
          const shotId = particleId.current++
          setThrowSide(attacker)
          window.setTimeout(() => setThrowSide(null), 220)
          setShot({
            id: shotId,
            from: attacker,
            path: pickPath(),
            shape,
            color: meme.color,
          })
          setRain([
            {
              id: shotId,
              side: defender,
              text: memeGlyph(meme),
              x: 20 + Math.random() * 60,
            },
          ])

          window.setTimeout(() => {
            setShot(null)
            setHit(defender)
            setFlash(defender)
            setComboPops([
              {
                id: shotId,
                side: defender,
                shape,
                text: nextCombo > 1 ? `${nextCombo} HIT` : '+1',
                x: defender === 'left' ? '16%' : '74%',
                y: `${30 + Math.random() * 16}%`,
                rot: Math.round(-18 + Math.random() * 36),
                scale: 1,
                color: meme.color,
              },
            ])
            window.setTimeout(() => {
              setComboPops([])
              setHit(null)
              setFlash(null)
              setRain([])
              inflight.current = false
            }, 780)
          }, 720)
        }

        const leftHp = roundShare(next.left.share)
        const rightHp = roundShare(next.right.share)
        for (const hp of [leftHp, rightHp]) {
          if (EASTER_HP[hp] && !seenEaster.current.has(hp)) {
            seenEaster.current.add(hp)
            setEaster({ hp, text: EASTER_HP[hp] })
            window.setTimeout(() => setEaster(null), 1400)
          }
        }
      },
      onFinish: (finalResult) => {
        if (ended.current) return
        ended.current = true
        setFrame(finalResult)
        setResult(finalResult)
        onBattleEnd(finalResult)
      },
    })
    return () => {
      inflight.current = false
      stop()
    }
  }, [left, right, onBattleEnd])

  useEffect(() => {
    feedRef.current?.scrollTo({ top: 0 })
  }, [feed])

  useEffect(() => {
    setTotals(null)
    fetch('http://localhost:8000/api/battle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leftId: left.id, rightId: right.id }),
    })
      .then((res) => res.json())
      .then(setTotals)
      .catch((err) => console.error('Failed to fetch totals', err))
  }, [left, right])

  const animatedLeft = useCountUp(totals?.leftTotal, 6000)
  const animatedRight = useCountUp(totals?.rightTotal, 6000)

  const leftShare = frame?.left.share ?? 50
  const rightShare = frame?.right.share ?? 50
  const remaining = Math.ceil((frame?.remainingMs ?? 19000) / 1000)

  const breakdown = useMemo(() => {
    if (!frame) return []
    return ['reddit', 'x', 'tiktok', 'news'].map((source) => ({
      source,
      left: frame.left.sources[source],
      right: frame.right.sources[source],
    }))
  }, [frame])

  const winnerSide = result?.winnerSide
  const leftState =
    winnerSide === 'right'
      ? 'ko'
      : winnerSide === 'left'
        ? 'victory'
        : hit === 'left'
            ? 'hit'
            : 'fight'
  const rightState =
    winnerSide === 'left'
      ? 'ko'
      : winnerSide === 'right'
        ? 'victory'
        : hit === 'right'
            ? 'hit'
            : 'fight'

  return (
    <div className={`arena ${flash ? `arena--flash-${flash}` : ''} ${result ? 'arena--over' : ''}`}>
      {fx.combo && (
        <div className="float-layer">
          {comboPops.map((pop) => (
            <FloatPop key={pop.id} pop={pop} />
          ))}
        </div>
      )}
      <div className="arena__hud">
        <div className="nameplate nameplate--left">
          <strong>{left.name}</strong>
          <span>Mentions: {animatedLeft}</span>
          {fx.odometer && <span className="odometer">Searches/min {rates.left}</span>}
        </div>
        <div className="timer">{result ? 'KO' : remaining}</div>
        <div className="nameplate nameplate--right">
          <strong>{right.name}</strong>
          <span>Mentions: {animatedRight}</span>
          {fx.odometer && <span className="odometer">Searches/min {rates.right}</span>}
        </div>
      </div>

      <div className={`health ${flash ? `health--${flash}` : ''}`}>
        <div className="health__left" style={{ width: `${leftShare}%` }} />
        <div className="health__knob" style={{ left: `${leftShare}%` }}>
          VS
        </div>
      </div>

      <div className="arena__stage">
        <StageBackdrop mode="battle" />
        {shot && <Projectile shot={shot} />}
        <div
          className={`fighter-stage fighter-stage--left ${throwSide === 'left' ? 'is-throw' : ''} ${hit === 'left' ? 'is-flash' : ''}`}
          style={{ '--heat': Math.min(1, rates.left / 80) }}
        >
          {fx.rain &&
            rain
              .filter((item) => item.side === 'left')
              .map((item) => (
                <span key={item.id} className="rain-drop" style={{ left: `${item.x}%` }}>
                  {item.text}
                </span>
              ))}
          {fx.combo && combos.left > 0 && <div className="combo-meter">{combos.left} COMBO</div>}
          <FighterPortrait meme={left} mood={leftMood} state={leftState} />
          <b>{Math.round(leftShare)}%</b>
        </div>
        <div className="arena__impact" aria-hidden="true" />
        <div
          className={`fighter-stage fighter-stage--right ${throwSide === 'right' ? 'is-throw' : ''} ${hit === 'right' ? 'is-flash' : ''}`}
          style={{ '--heat': Math.min(1, rates.right / 80) }}
        >
          {fx.rain &&
            rain
              .filter((item) => item.side === 'right')
              .map((item) => (
                <span key={item.id} className="rain-drop rain-drop--right" style={{ left: `${item.x}%` }}>
                  {item.text}
                </span>
              ))}
          {fx.combo && combos.right > 0 && <div className="combo-meter">{combos.right} COMBO</div>}
          <FighterPortrait meme={right} mood={rightMood} state={rightState} />
          <b>{Math.round(rightShare)}%</b>
        </div>
      </div>

      <div className="arena__dock">
        <div className="ticker" ref={feedRef}>
          <h3>Found feed</h3>
          {feed.map((line) => (
            <p key={line.id} className={`ticker__line ticker__line--${line.side}`}>
              {line.text}
            </p>
          ))}
          {feed.length === 0 && <p className="ticker__line">Scanning the web for fresh mentions...</p>}
        </div>

        <section className="breakdown">
          <h3>Where the mentions came from</h3>
          <ul>
            {breakdown.map((row) => (
              <li key={row.source}>
                <span>{row.source}</span>
                <span>
                  {row.left} vs {row.right}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {easter && (
        <div className="easter" role="status">
          {easter.hp} HP · {easter.text}
        </div>
      )}

      {result && (
        <div className="winner">
          <p className="winner__kicker">FINAL</p>
          <h2>
            {result.winner.name.toUpperCase()} WINS — {Math.round(result.winnerShare)}% MEME DOMINANCE
          </h2>
          <p>
            {result.winner.name} landed {result.winnerSide === 'left' ? result.left.mentions : result.right.mentions}{' '}
            scored mentions vs {result.loser.name} at{' '}
            {result.winnerSide === 'left' ? result.right.mentions : result.left.mentions} in the last search window.
          </p>
          <div className="winner__actions">
            <button type="button" className="start-btn" onClick={onRematch}>
              REMATCH
            </button>
            <button
              type="button"
              className="ghost-btn"
              onClick={() =>
                downloadShareCard({
                  left,
                  right,
                  winner: result.winner,
                  winnerShare: result.winnerShare,
                })
              }
            >
              SHARE THIS BATTLE
            </button>
          </div>
        </div>
      )}
    </div>
  )
}