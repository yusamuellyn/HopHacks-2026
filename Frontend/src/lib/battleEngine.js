export function sharesFromCounts(leftMentions, rightMentions) {
  const left = Math.max(0, leftMentions)
  const right = Math.max(0, rightMentions)
  const total = left + right
  if (total <= 0) {
    return { leftShare: 50, rightShare: 50 }
  }
  const leftShare = (left / total) * 100
  return { leftShare, rightShare: 100 - leftShare }
}

function clamp(n, lo, hi) {
  return Math.min(hi, Math.max(lo, n))
}

function pick(list) {
  return list[Math.floor(Math.random() * list.length)]
}

const LEAD_LINES = [
  (a, d) => `${a} floods the timeline and shoves ${d} aside!`,
  (a, d) => `${a} is everywhere — ${d} is getting buried!`,
  (a) => `Keyword spike! ${a} takes another chunk of the feed!`,
  (a, d) => `The crowd chants ${a.toUpperCase()}! ${d} can't breathe!`,
  (a) => `${a} steals the search results again!`,
  (a, d) => `${a} lands a heavy mention wave on ${d}!`,
]

const CHASE_LINES = [
  (a, d) => `${a} tries to clap back at ${d}!`,
  (a) => `${a} scrapes a handful of posts...`,
  (a, d) => `${a} refuses to disappear while ${d} runs the feed!`,
  (a) => `A small bounce for ${a}!`,
]

const COMBO_LINES = [
  (a, n) => `COMBO x${n}! ${a} will not let up!`,
  (a, n) => `${a} strings together a ${n}-hit search streak!`,
  (a, n) => `${n} in a row! ${a} is taking over the comments!`,
]

function commentaryFor({ attacker, defender, combo, lead }) {
  if (combo >= 3) return pick(COMBO_LINES)(attacker.name, combo)
  if (lead) return pick(LEAD_LINES)(attacker.name, defender.name)
  return pick(CHASE_LINES)(attacker.name, defender.name)
}

function pickAttacker(leftPower, rightPower) {
  const total = leftPower + rightPower
  if (total <= 0) return Math.random() < 0.5 ? 'left' : 'right'
  // Tiny jitter so the underdog still throws, but a big lead owns the animations.
  const jitter = 0.06
  if (Math.random() < jitter) return Math.random() < 0.5 ? 'left' : 'right'
  return Math.random() < leftPower / total ? 'left' : 'right'
}

function hitSwing(combo, attackerPower, defenderPower) {
  const total = attackerPower + defenderPower
  const strength = total > 0 ? attackerPower / total : 0.5
  const comboBoost = Math.min(combo, 7) * 1.75
  return (3.8 + comboBoost) * (0.52 + strength * 0.9) * (0.86 + Math.random() * 0.28)
}

function settleAmount(progress) {
  const p = clamp(progress, 0, 1)
  // Keep most of the fight on hit/combo swings, then lock to the real mention share.
  if (p < 0.7) return p * 0.22
  return 0.154 + Math.pow((p - 0.7) / 0.3, 1.15) * 0.846
}

export function startBattle({
  left,
  right,
  leftTotal = 0,
  rightTotal = 0,
  leftYesterday = 0,
  rightYesterday = 0,
  leftLatest = 0,
  rightLatest = 0,
  durationMs = 19000,
  attackMs = 680,
  onTick,
  onFinish,
}) {
  const started = performance.now()
  const leftPower = Math.max(0.35, leftTotal + leftYesterday * 0.35)
  const rightPower = Math.max(0.35, rightTotal + rightYesterday * 0.35)
  const trueShares = sharesFromCounts(leftTotal, rightTotal)
  let lastAttack = started - attackMs + 220
  let lastEmit = 0
  let lastSide = null
  let combo = 0
  let cancelled = false
  let finished = false
  let frameId = 0
  let lastTime = started
  let momentum = 50
  let pulse = 0

  const liveShares = (elapsed) => {
    const progress = Math.min(1, elapsed / durationMs)
    const settle = settleAmount(progress)
    const mixed = momentum * (1 - settle) + trueShares.leftShare * settle
    const leftShare = clamp(mixed + pulse * (1 - settle), 4, 96)
    return { leftShare, rightShare: 100 - leftShare }
  }

  const snapshot = (elapsed, event = null) => {
    const progress = Math.min(1, elapsed / durationMs)
    const leftExact = leftTotal * progress
    const rightExact = rightTotal * progress
    const shares = liveShares(elapsed)
    return {
      elapsed,
      remainingMs: Math.max(0, durationMs - elapsed),
      left: {
        mentions: Math.round(leftExact),
        share: shares.leftShare,
        sources: {
          yesterday: leftYesterday,
          latest: leftLatest,
          total: leftTotal,
        },
      },
      right: {
        mentions: Math.round(rightExact),
        share: shares.rightShare,
        sources: {
          yesterday: rightYesterday,
          latest: rightLatest,
          total: rightTotal,
        },
      },
      event,
    }
  }

  const finish = () => {
    if (finished || cancelled) return
    finished = true
    cancelAnimationFrame(frameId)
    const shares = trueShares
    const leftWins = leftTotal >= rightTotal
    onFinish({
      ...snapshot(durationMs),
      left: {
        mentions: leftTotal,
        share: shares.leftShare,
        sources: { yesterday: leftYesterday, latest: leftLatest, total: leftTotal },
      },
      right: {
        mentions: rightTotal,
        share: shares.rightShare,
        sources: { yesterday: rightYesterday, latest: rightLatest, total: rightTotal },
      },
      leftId: left.id,
      rightId: right.id,
      winnerSide: leftWins ? 'left' : 'right',
      winner: leftWins ? left : right,
      loser: leftWins ? right : left,
      winnerShare: leftWins ? shares.leftShare : shares.rightShare,
    })
  }

  const tick = (now) => {
    if (cancelled || finished) return
    const elapsed = now - started
    const dt = Math.max(0, (now - lastTime) / 1000)
    lastTime = now
    pulse *= Math.exp(-dt * 3.4)
    let event = null

    if (elapsed < durationMs && now - lastAttack >= attackMs) {
      lastAttack = now
      const side = pickAttacker(leftPower, rightPower)
      combo = lastSide === side ? combo + 1 : 1
      lastSide = side
      const attacker = side === 'left' ? left : right
      const defender = side === 'left' ? right : left
      const lead = side === 'left' ? leftPower >= rightPower : rightPower >= leftPower
      const attackerPower = side === 'left' ? leftPower : rightPower
      const defenderPower = side === 'left' ? rightPower : leftPower
      const delta = hitSwing(combo, attackerPower, defenderPower)
      const signed = side === 'left' ? delta : -delta
      momentum = clamp(momentum + signed, 8, 92)
      pulse = signed * 0.55
      event = {
        id: `${Math.round(elapsed)}-${side}-${combo}`,
        side,
        combo,
        delta,
        text: commentaryFor({ attacker, defender, combo, lead }),
      }
    }

    if (event || now - lastEmit > 50 || elapsed >= durationMs) {
      lastEmit = now
      onTick(snapshot(elapsed, event))
    }

    if (elapsed >= durationMs) {
      finish()
      return
    }
    frameId = requestAnimationFrame(tick)
  }

  frameId = requestAnimationFrame(tick)

  return () => {
    cancelled = true
    cancelAnimationFrame(frameId)
  }
}
