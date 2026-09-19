import { useEffect, useMemo, useRef, useState } from 'react'
import { startBattle } from '../lib/battleEngine.js'
import { useFx } from '../lib/fx.jsx'
import { useSfx } from '../lib/sfx.jsx'
import { setMusicTrack } from '../lib/music.js'
import { formatCount, formatDay } from '../lib/stats.js'
import { getMood } from './FighterSlot.jsx'
import FighterPortrait, { memeGlyph } from './FighterPortrait.jsx'
import FloatPop, { pickPath, pickShape, Projectile } from './FloatPop.jsx'
import StageBackdrop from './StageBackdrop.jsx'
import BattleRecap from './BattleRecap.jsx'


const EASTER_HP = {
  21: '21 🫡',
  67: 'six seven',
  69: 'nice.',
}
const FIGHT_MS = 19000

function roundShare(n) {
  return Math.round(n)
}

function fighterMotion(share, side, over = false) {
  const lead = (share - 50) / 50
  const extra = over ? Math.abs(lead) * 0.16 : 0
  const size = Math.max(0.52, 1 + lead * 0.55 + (share >= 50 ? extra : -extra))
  const lean = lead * 10
  return {
    '--size': size.toFixed(3),
    '--lean': `${side === 'left' ? lean : -lean}deg`,
  }
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
  const sfx = useSfx()
  const sfxRef = useRef(sfx)
  sfxRef.current = sfx
  const [feed, setFeed] = useState([])
  const [frame, setFrame] = useState(null)
  const [result, setResult] = useState(null)
  const [showRecap, setShowRecap] = useState(false)
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
  const [loadError, setLoadError] = useState(null)
  const seenEaster = useRef(new Set())
  const ended = useRef(false)
  const feedRef = useRef(null)
  const lastSide = useRef(null)
  const combosRef = useRef({ left: 0, right: 0 })
  const maxCombosRef = useRef({ left: 0, right: 0 })
  const [maxCombos, setMaxCombos] = useState({ left: 0, right: 0 })
  const particleId = useRef(0)
  const inflight = useRef(false)
  const announcedStart = useRef(false)

  const leftMood = getMood(left, stats)
  const rightMood = getMood(right, stats)

  useEffect(() => {
    if (!result) {
      setShowRecap(false)
      return
    }
    const timer = setTimeout(() => setShowRecap(true), 1500)
    return () => clearTimeout(timer)
  }, [result])

  useEffect(() => {
    let cancelled = false
    setTotals(null)
    setLoadError(null)
    setFrame(null)
    setFeed([])
    setResult(null)
    fetch('/api/battle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leftId: left.id, rightId: right.id }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('Battle lookup failed')
        return res.json()
      })
      .then((data) => {
        if (!cancelled) setTotals(data)
      })
      .catch((err) => {
        console.error('Failed to fetch totals', err)
        if (!cancelled) setLoadError('Could not load live mention counts.')
      })
    return () => {
      cancelled = true
    }
  }, [left, right])

  useEffect(() => {
    if (!totals) return undefined

    ended.current = false
    announcedStart.current = false
    maxCombosRef.current = { left: 0, right: 0 }
    combosRef.current = { left: 0, right: 0 }
    lastSide.current = null
    setMaxCombos({ left: 0, right: 0 })
    setCombos({ left: 0, right: 0 })
    setFeed([])
    setRates({
      left: Math.round((totals.leftTotal / (FIGHT_MS / 1000)) * 60),
      right: Math.round((totals.rightTotal / (FIGHT_MS / 1000)) * 60),
    })

    if (!announcedStart.current) {
      announcedStart.current = true
      sfxRef.current.play('startBell')
      fetch('/api/announce-start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leftName: left.name, rightName: right.name }),
      })
        .then((res) => res.blob())
        .then((blob) => new Audio(URL.createObjectURL(blob)).play())
        .catch((err) => console.error('Announcer intro failed', err))
    }

    const stop = startBattle({
      left,
      right,
      leftTotal: totals.leftTotal,
      rightTotal: totals.rightTotal,
      leftYesterday: totals.leftYesterday,
      rightYesterday: totals.rightYesterday,
      leftLatest: totals.leftLatest,
      rightLatest: totals.rightLatest,
      durationMs: FIGHT_MS,
      onTick: (next) => {
        setFrame(next)
        if (!next.event) return

        setFeed((lines) => [next.event, ...lines].slice(0, 18))

        const attacker = next.event.side
        const defender = attacker === 'left' ? 'right' : 'left'
        const meme = attacker === 'left' ? left : right
        const nextCombo = lastSide.current === attacker ? (combosRef.current[attacker] || 0) + 1 : 1
        lastSide.current = attacker
        combosRef.current = { ...combosRef.current, [attacker]: nextCombo, [defender]: 0 }
        if (nextCombo > (maxCombosRef.current[attacker] || 0)) {
          maxCombosRef.current = { ...maxCombosRef.current, [attacker]: nextCombo }
        }
        setCombos({ ...combosRef.current })

        if (!inflight.current) {
          inflight.current = true
          const shape = pickShape()
          const shotId = particleId.current++
          setThrowSide(attacker)
          window.setTimeout(() => setThrowSide(null), 180)
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
            sfxRef.current.playImpact(nextCombo)
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
            }, 520)
          }, 480)
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
        const payload = {
          ...finalResult,
          leftId: left.id,
          rightId: right.id,
        }
        setFrame(payload)
        setResult(payload)
        setMaxCombos({ ...maxCombosRef.current })
        onBattleEnd(payload)
        sfxRef.current.play('finishFanfare')

        fetch('/api/announce-winner', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            winnerName: finalResult.winner.name,
            pct: Math.round(finalResult.winnerShare),
          }),
        })
          .then((res) => res.blob())
          .then((blob) => new Audio(URL.createObjectURL(blob)).play())
          .catch((err) => console.error('Winner announcement failed', err))
      },
    })
    return () => {
      inflight.current = false
      stop()
    }
  }, [left, right, totals, onBattleEnd])

  useEffect(() => {
    feedRef.current?.scrollTo({ top: 0 })
  }, [feed])

  const leftShare = frame?.left.share ?? 50
  const rightShare = frame?.right.share ?? 50
  const remaining = Math.ceil((frame?.remainingMs ?? FIGHT_MS) / 1000)
  const leftMentions = frame?.left.mentions ?? 0
  const rightMentions = frame?.right.mentions ?? 0

  useEffect(() => {
    if (result) {
      setMusicTrack('recap')
      return
    }
    if (!totals) return
    setMusicTrack(remaining <= 5 ? 'battleClimax' : 'battle')
  }, [remaining, result, totals])

  const breakdown = useMemo(() => {
    if (!totals) return []
    return [
      { source: 'Yesterday', left: totals.leftYesterday, right: totals.rightYesterday },
      { source: 'Latest day', left: totals.leftLatest, right: totals.rightLatest },
      { source: 'All posts', left: totals.leftTotal, right: totals.rightTotal },
    ]
  }, [totals])

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
          <span>Mentions: {formatCount(leftMentions)}</span>
          {fx.odometer && <span className="odometer">Yday {formatCount(totals?.leftYesterday)}</span>}
        </div>
        <div className="timer">
          {loadError ? '??' : result ? 'KO' : totals ? remaining : '...'}
        </div>
        <div className="nameplate nameplate--right">
          <strong>{right.name}</strong>
          <span>Mentions: {formatCount(rightMentions)}</span>
          {fx.odometer && <span className="odometer">Yday {formatCount(totals?.rightYesterday)}</span>}
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
          className={`fighter-stage fighter-stage--left ${throwSide === 'left' ? 'is-throw' : ''} ${hit === 'left' ? 'is-flash' : ''} ${combos.left >= 3 ? 'is-combo' : ''}`}
          style={{ '--heat': Math.min(1, rates.left / 80), ...fighterMotion(leftShare, 'left', Boolean(result)) }}
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
          <div className="fighter-scale">
            <FighterPortrait meme={left} mood={leftMood} state={leftState} />
          </div>
          <b>{Math.round(leftShare)}%</b>
        </div>
        <strong className="arena__vs" aria-hidden="true">
          VS
        </strong>
        <div
          className={`fighter-stage fighter-stage--right ${throwSide === 'right' ? 'is-throw' : ''} ${hit === 'right' ? 'is-flash' : ''} ${combos.right >= 3 ? 'is-combo' : ''}`}
          style={{ '--heat': Math.min(1, rates.right / 80), ...fighterMotion(rightShare, 'right', Boolean(result)) }}
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
          <div className="fighter-scale">
            <FighterPortrait meme={right} mood={rightMood} state={rightState} />
          </div>
          <b>{Math.round(rightShare)}%</b>
        </div>
      </div>

      <div className="arena__dock">
        <div className="ticker" ref={feedRef}>
          <h3>Fight commentary</h3>
          {loadError && <p className="ticker__line">{loadError}</p>}
          {!loadError && !totals && <p className="ticker__line">Pulling live mention counts from the timeline...</p>}
          {feed.map((line) => (
            <p key={line.id} className={`ticker__line ticker__line--${line.side}`}>
              {line.text}
            </p>
          ))}
          {totals && feed.length === 0 && !loadError && (
            <p className="ticker__line">The bell is about to ring...</p>
          )}
        </div>

        <section className="breakdown">
          <h3>Search pressure</h3>
          <p className="breakdown__window">
            {formatDay(totals?.window?.yesterday) || 'Yesterday'} vs {formatDay(totals?.window?.latest) || 'latest day'}
          </p>
          <ul>
            {breakdown.map((row) => (
              <li key={row.source}>
                <span>{row.source}</span>
                <span>
                  {formatCount(row.left)} vs {formatCount(row.right)}
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

      {showRecap && (
        <BattleRecap
          left={left}
          right={right}
          result={result}
          stats={stats}
          totals={totals}
          maxCombos={maxCombos}
          onRematch={onRematch}
          onShare={() =>
            downloadShareCard({
              left,
              right,
              winner: result.winner,
              winnerShare: result.winnerShare,
            })
          }
        />
      )}
    </div>
  )
}
