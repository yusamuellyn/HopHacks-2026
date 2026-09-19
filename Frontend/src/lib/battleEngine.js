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
  let lastAttack = started - attackMs + 220
  let lastEmit = 0
  let lastSide = null
  let combo = 0
  let cancelled = false
  let finished = false
  let frameId = 0

  const snapshot = (elapsed, event = null) => {
    const progress = Math.min(1, elapsed / durationMs)
    const leftExact = leftTotal * progress
    const rightExact = rightTotal * progress
    const shares = sharesFromCounts(leftExact, rightExact)
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
    const shares = sharesFromCounts(leftTotal, rightTotal)
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
    let event = null

    if (elapsed < durationMs && now - lastAttack >= attackMs) {
      lastAttack = now
      const side = pickAttacker(leftPower, rightPower)
      combo = lastSide === side ? combo + 1 : 1
      lastSide = side
      const attacker = side === 'left' ? left : right
      const defender = side === 'left' ? right : left
      const lead = side === 'left' ? leftPower >= rightPower : rightPower >= leftPower
      event = {
        id: `${Math.round(elapsed)}-${side}-${combo}`,
        side,
        combo,
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
