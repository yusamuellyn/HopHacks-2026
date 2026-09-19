import { pidScore, scoreMention, sharesFromPid } from './scoring.js'

const SOURCES = ['reddit', 'x', 'tiktok', 'news']
const REDDITS = ['r/memes', 'r/okbuddyretard', 'r/brainrot', 'r/OutOfTheLoop', 'r/tiktokcringe']
const X_BITS = ['quote tweet', 'reply chain', 'ratio attempt', 'community note']
const TIKTOKS = ['stitch', 'sound clip', 'duet', 'POV video']
const NEWS = ['Teen Vogue', 'Polygon', 'NYT Styles', 'KnowYourMeme', 'BBC Culture']

function pick(list) {
  return list[Math.floor(Math.random() * list.length)]
}

function weightedSide(leftPower, rightPower) {
  const jitter = 0.15 + Math.random() * 0.2
  const l = leftPower * (0.7 + Math.random() * 0.6)
  const r = rightPower * (0.7 + Math.random() * 0.6)
  if (Math.random() < jitter) return Math.random() < 0.5 ? 'left' : 'right'
  return l >= r ? 'left' : 'right'
}

function generateMention(meme) {
  const source = pick(SOURCES)
  const ageMinutes = source === 'news' ? 6 + Math.random() * 40 : Math.random() ** 2.6 * 22
  const engagement =
    source === 'news'
      ? 80 + Math.random() * 400
      : Math.floor(Math.random() ** 2.2 * 2500)

  let detail = ''
  if (source === 'reddit') detail = pick(REDDITS)
  if (source === 'x') detail = pick(X_BITS)
  if (source === 'tiktok') detail = pick(TIKTOKS)
  if (source === 'news') detail = pick(NEWS)

  const ageLabel =
    ageMinutes < 1
      ? `${Math.max(1, Math.round(ageMinutes * 60))} sec ago`
      : `${Math.max(1, Math.round(ageMinutes))} min ago`

  const verb =
    source === 'reddit'
      ? `mentioned in ${detail}`
      : source === 'x'
        ? `X ${detail}`
        : source === 'tiktok'
          ? `TikTok ${detail}`
          : `${detail} article`

  return {
    source,
    ageMinutes,
    engagement,
    text: `Found: '${meme.name}' ${verb} (${ageLabel})...`,
  }
}

function blankSide() {
  return {
    mentions: 0,
    current: 0,
    accumulated: 0,
    velocity: 0,
    pid: 0,
    sources: { reddit: 0, x: 0, tiktok: 0, news: 0 },
    history: [],
  }
}

export function startBattle({
  left,
  right,
  durationMs = 19000,
  intervalMs = 480,
  onTick,
  onFinish,
}) {
  const leftState = blankSide()
  const rightState = blankSide()
  const started = performance.now()
  let last = started
  let spikeSide = null
  let spikeLeft = 0

  const leftPower = 12 + left.yesterdayPopularity
  const rightPower = 12 + right.yesterdayPopularity

  const apply = (side, meme) => {
    const mention = generateMention(meme)
    const points = scoreMention(mention)
    const now = performance.now()
    const dt = Math.max(0.2, (now - last) / 1000)
    side.mentions += 1
    side.sources[mention.source] += 1
    side.current = points
    side.accumulated += points
    side.history.push(points)
    if (side.history.length > 8) side.history.shift()
    const windowSum = side.history.reduce((a, b) => a + b, 0)
    side.velocity = windowSum / (dt * side.history.length)
    side.pid = pidScore({
      current: side.current,
      accumulated: side.accumulated,
      velocity: side.velocity,
    })
    return mention
  }

  const snapshot = (elapsed) => {
    const shares = sharesFromPid(leftState.pid, rightState.pid)
    return {
      elapsed,
      remainingMs: Math.max(0, durationMs - elapsed),
      left: { ...leftState, sources: { ...leftState.sources }, share: shares.leftShare },
      right: { ...rightState, sources: { ...rightState.sources }, share: shares.rightShare },
    }
  }

  const tick = () => {
    const now = performance.now()
    const elapsed = now - started
    if (spikeLeft <= 0 && Math.random() < 0.18) {
      spikeSide = weightedSide(leftPower, rightPower)
      spikeLeft = 2 + Math.floor(Math.random() * 3)
    }

    const side =
      spikeLeft > 0
        ? spikeSide
        : weightedSide(leftPower, rightPower)
    if (spikeLeft > 0) spikeLeft -= 1

    const mention =
      side === 'left' ? apply(leftState, left) : apply(rightState, right)
    last = now

    const frame = snapshot(elapsed)
    onTick({
      ...frame,
      event: { ...mention, side, id: `${elapsed}-${side}-${frame.left.mentions}-${frame.right.mentions}` },
    })

    if (elapsed >= durationMs) {
      finished = true
      window.clearInterval(timer)
      const finalFrame = snapshot(durationMs)
      const leftWins = finalFrame.left.share >= finalFrame.right.share
      onFinish({
        ...finalFrame,
        winnerSide: leftWins ? 'left' : 'right',
        winner: leftWins ? left : right,
        loser: leftWins ? right : left,
        winnerShare: leftWins ? finalFrame.left.share : finalFrame.right.share,
      })
    }
  }

  let cancelled = false
  let finished = false
  const wrappedTick = () => {
    if (!cancelled && !finished) tick()
  }
  const timer = window.setInterval(wrappedTick, intervalMs)
  const kickoff = window.setTimeout(wrappedTick, 180)

  return () => {
    cancelled = true
    window.clearInterval(timer)
    window.clearTimeout(kickoff)
  }
}
