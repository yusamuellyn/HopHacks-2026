const SOURCE_WEIGHT = {
  reddit: 1.15,
  x: 0.9,
  tiktok: 1.35,
  news: 1.6,
}

const SOURCE_BASE_RATE = {
  reddit: 1,
  x: 1.4,
  tiktok: 2.1,
  news: 0.45,
}

const LAMBDA = 0.045
const KP = 0.45
const KI = 0.25
const KD = 0.3

export function recencyWeight(ageMinutes, lambda = LAMBDA) {
  return Math.exp(-lambda * ageMinutes)
}

export function engagementWeight(engagement) {
  return Math.log1p(Math.max(0, engagement)) / Math.log1p(800)
}

export function scoreMention(mention) {
  const decay = recencyWeight(mention.ageMinutes)
  const source = SOURCE_WEIGHT[mention.source] ?? 1
  const engagement = engagementWeight(mention.engagement)
  const normalized = 1 / (SOURCE_BASE_RATE[mention.source] ?? 1)
  return decay * source * (0.35 + 0.65 * engagement) * normalized
}

export function pidScore({ current, accumulated, velocity }) {
  return KP * current + KI * accumulated + KD * velocity
}

export function sharesFromPid(leftPid, rightPid) {
  const floor = 0.08
  const l = Math.max(floor, leftPid)
  const r = Math.max(floor, rightPid)
  const total = l + r
  const leftShare = (l / total) * 100
  return {
    leftShare,
    rightShare: 100 - leftShare,
  }
}

export { SOURCE_WEIGHT, SOURCE_BASE_RATE }
