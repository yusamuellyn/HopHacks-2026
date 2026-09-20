export function sharesFromCounts(
  leftMentions,
  rightMentions,
  leftTotal = leftMentions,
  rightTotal = rightMentions,
) {
  const left = Math.max(0, leftMentions)
  const right = Math.max(0, rightMentions)
  const leftAlive = Math.max(0, leftTotal) > 0
  const rightAlive = Math.max(0, rightTotal) > 0

  if (!leftAlive && !rightAlive) return { leftShare: 50, rightShare: 50 }
  if (!leftAlive) return { leftShare: 0, rightShare: 100 }
  if (!rightAlive) return { leftShare: 100, rightShare: 0 }

  const total = left + right
  if (total <= 0) return { leftShare: 50, rightShare: 50 }

  const leftShare = Math.min(99, Math.max(1, (left / total) * 100))
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

function pickAttacker(leftPower, rightPower, leftDead, rightDead) {
  if (leftDead && !rightDead) return 'right'
  if (rightDead && !leftDead) return 'left'
  const total = leftPower + rightPower
  if (total <= 0) return Math.random() < 0.5 ? 'left' : 'right'
  return Math.random() < leftPower / total ? 'left' : 'right'
}

function buildMentionPath(leftTotal, rightTotal, durationMs) {
  const leftTarget = Math.max(0, Math.round(leftTotal))
  const rightTarget = Math.max(0, Math.round(rightTotal))
  const path = [{ t: 0, left: 0, right: 0 }]
  if (leftTarget === 0 && rightTarget === 0) {
    path.push({ t: durationMs, left: 0, right: 0 })
    return path
  }

  let leftShown = 0
  let rightShown = 0
  let t = 80 + Math.random() * 70

  while (t < durationMs - 140 && (leftShown < leftTarget || rightShown < rightTarget)) {
    const leftRem = leftTarget - leftShown
    const rightRem = rightTarget - rightShown
    const beatsLeft = Math.max(1, Math.round((durationMs - t) / 210))
    const pickLeft =
      leftRem > 0 && (rightRem <= 0 || Math.random() < leftRem / (leftRem + rightRem))
    const rem = pickLeft ? leftRem : rightRem
    const cap = Math.max(1, Math.round((pickLeft ? leftTarget : rightTarget) * 0.09))
    const gain = Math.min(rem, cap, Math.max(1, Math.round((rem / beatsLeft) * (0.7 + Math.random() * 0.55))))

    if (pickLeft) leftShown += gain
    else rightShown += gain

    const otherRem = pickLeft ? rightTarget - rightShown : leftTarget - leftShown
    if (otherRem > 0 && Math.random() < 0.38) {
      const otherGain = Math.min(
        otherRem,
        Math.max(1, Math.round(otherRem / (beatsLeft * (2.4 + Math.random())))),
      )
      if (pickLeft) rightShown += otherGain
      else leftShown += otherGain
    }

    path.push({ t, left: leftShown, right: rightShown })
    t += 150 + Math.random() * 140
  }

  path.push({ t: durationMs, left: leftTarget, right: rightTarget })
  return path
}

function countsAt(elapsed, path) {
  const t = Math.max(0, elapsed)
  let point = path[0]
  for (let i = 0; i < path.length; i += 1) {
    if (path[i].t <= t) point = path[i]
    else break
  }
  return { leftMentions: point.left, rightMentions: point.right }
}

export function startBattle({
  left,
  right,
  leftTotal = 0,
  rightTotal = 0,
  leftLastMonth = 0,
  rightLastMonth = 0,
  leftLatest = 0,
  rightLatest = 0,
  durationMs = 19000,
  attackMs = 320,
  onTick,
  onFinish,
}) {
  const started = performance.now()
  const leftDead = leftTotal <= 0
  const rightDead = rightTotal <= 0
  const leftPower = leftDead ? 0 : Math.max(0.35, leftTotal + leftLastMonth * 0.35)
  const rightPower = rightDead ? 0 : Math.max(0.35, rightTotal + rightLastMonth * 0.35)
  const trueShares = sharesFromCounts(leftTotal, rightTotal)
  const mentionPath = buildMentionPath(leftTotal, rightTotal, durationMs)
  let lastAttack = started - attackMs + 220
  let lastEmit = 0
  let lastSide = null
  let combo = 0
  const sideCombo = { left: 0, right: 0 }
  let cancelled = false
  let finished = false
  let frameId = 0
  let markedLeft = 0
  let markedRight = 0

  const liveShares = (leftMentions, rightMentions) =>
    sharesFromCounts(leftMentions, rightMentions, leftTotal, rightTotal)

  const snapshot = (elapsed, event = null) => {
    const { leftMentions, rightMentions } = countsAt(elapsed, mentionPath)
    const shares = liveShares(leftMentions, rightMentions)
    return {
      elapsed,
      remainingMs: Math.max(0, durationMs - elapsed),
      left: {
        mentions: leftMentions,
        share: shares.leftShare,
        sources: {
          lastMonth: leftLastMonth,
          latest: leftLatest,
          total: leftTotal,
        },
      },
      right: {
        mentions: rightMentions,
        share: shares.rightShare,
        sources: {
          lastMonth: rightLastMonth,
          latest: rightLatest,
          total: rightTotal,
        },
      },
      event,
    }
  }

  const finish = (winnerSide = leftTotal >= rightTotal ? 'left' : 'right', elapsed = durationMs) => {
    if (finished || cancelled) return
    finished = true
    cancelAnimationFrame(frameId)
    const shares =
      leftDead || rightDead
        ? winnerSide === 'left'
          ? { leftShare: 100, rightShare: 0 }
          : { leftShare: 0, rightShare: 100 }
        : trueShares
    const leftWins = winnerSide === 'left'
    onFinish({
      ...snapshot(elapsed),
      remainingMs: 0,
      left: {
        mentions: leftTotal,
        share: shares.leftShare,
        sources: { lastMonth: leftLastMonth, latest: leftLatest, total: leftTotal },
      },
      right: {
        mentions: rightTotal,
        share: shares.rightShare,
        sources: { lastMonth: rightLastMonth, latest: rightLatest, total: rightTotal },
      },
      leftId: left.id,
      rightId: right.id,
      winnerSide,
      winner: leftWins ? left : right,
      loser: leftWins ? right : left,
      winnerShare: leftWins ? shares.leftShare : shares.rightShare,
    })
  }

  const emitAttack = (now, elapsed, side, defenderDead, { primary = true } = {}) => {
    if (primary) {
      combo = lastSide === side ? combo + 1 : 1
      lastSide = side
      lastAttack = now
    }
    sideCombo[side] = primary ? combo : (sideCombo[side] || 0) + 1
    const attacker = side === 'left' ? left : right
    const defender = side === 'left' ? right : left
    const lead = side === 'left' ? leftPower >= rightPower : rightPower >= leftPower
    const hits = primary ? combo : sideCombo[side]
    return {
      id: `${Math.round(elapsed)}-${side}-${hits}-${primary ? 'atk' : 'line'}`,
      side,
      combo: hits,
      ko: defenderDead,
      silent: !primary,
      text: defenderDead
        ? `${attacker.name} one-taps ${defender.name}! Dead meme.`
        : commentaryFor({ attacker, defender, combo: hits, lead }),
    }
  }

  const tick = (now) => {
    if (cancelled || finished) return
    const elapsed = now - started
    let event = null
    let emitted = false
    const { leftMentions, rightMentions } = countsAt(elapsed, mentionPath)

    if (elapsed < durationMs && now - lastAttack >= attackMs) {
      if (leftDead || rightDead) {
        const side = pickAttacker(leftPower, rightPower, leftDead, rightDead)
        const defenderDead = side === 'left' ? rightDead : leftDead
        event = emitAttack(now, elapsed, side, defenderDead)
        markedLeft = leftMentions
        markedRight = rightMentions
        lastEmit = now
        onTick(snapshot(elapsed, event))
        emitted = true
        if (defenderDead) {
          finish(side, elapsed)
          return
        }
      } else {
        const leftGain = leftMentions - markedLeft
        const rightGain = rightMentions - markedRight
        if (leftGain > 0 || rightGain > 0) {
          markedLeft = leftMentions
          markedRight = rightMentions
          const primary =
            leftGain > rightGain ? 'left' : rightGain > leftGain ? 'right' : pickAttacker(leftPower, rightPower, false, false)
          event = emitAttack(now, elapsed, primary, false)
          lastEmit = now
          onTick(snapshot(elapsed, event))
          emitted = true
          const other = primary === 'left' ? 'right' : 'left'
          const otherGain = other === 'left' ? leftGain : rightGain
          if (otherGain > 0) {
            const echo = emitAttack(now, elapsed, other, false, { primary: false })
            onTick(snapshot(elapsed, echo))
          }
        }
      }
    }

    if (!emitted && (now - lastEmit > 50 || elapsed >= durationMs)) {
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
