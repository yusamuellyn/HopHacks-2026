const STORAGE_KEY = 'meme-arena-stats-v2'

function todayKey() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

export function emptyStats() {
  return {
    battles: 0,
    fighters: {},
    lastChampionId: null,
    daily: { date: todayKey(), wins: {}, battles: 0 },
    window: { lastMonth: null, latest: null },
    recent: [],
    maxLastMonth: 0,
  }
}

export function formatCount(n) {
  if (n == null || Number.isNaN(Number(n))) return '—'
  return Math.round(Number(n)).toLocaleString()
}

export function formatDay(iso) {
  if (!iso) return null
  const [year, month, day] = iso.split('-').map(Number)
  if (!year || !month || !day) return iso
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

export function formatMonth(iso) {
  if (!iso) return null
  const [year, month] = iso.split('-').map(Number)
  if (!year || !month) return iso
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  })
}

function cacheStats(stats) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats))
  } catch {
    // ignore quota / private mode
  }
}

export function loadStats() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyStats()
    const parsed = JSON.parse(raw)
    return {
      ...emptyStats(),
      ...parsed,
      fighters: parsed.fighters || {},
      daily: parsed.daily || emptyStats().daily,
      recent: parsed.recent || [],
    }
  } catch {
    return emptyStats()
  }
}

export async function fetchStats() {
  const res = await fetch('/api/stats')
  if (!res.ok) throw new Error('Failed to load records')
  const stats = await res.json()
  cacheStats(stats)
  return stats
}

export async function recordBattle(result) {
  const res = await fetch('/api/record-battle', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      leftId: result.leftId,
      rightId: result.rightId,
      winnerId: result.winnerId,
      leftTotal: result.leftTotal,
      rightTotal: result.rightTotal,
      winnerShare: result.winnerShare,
    }),
  })
  if (!res.ok) throw new Error('Failed to save battle')
  const stats = await res.json()
  cacheStats(stats)
  return stats
}

export function getFighterRecord(stats, memeId) {
  const record = stats.fighters?.[memeId]
  if (!record) {
    return {
      wins: 0,
      losses: 0,
      lastShare: null,
      lastMonthMentions: 0,
      latestMentions: 0,
      totalMentions: 0,
    }
  }
  return {
    ...record,
    lastMonthMentions: record.lastMonthMentions ?? 0,
  }
}

export function isDeadMeme(stats, memeId) {
  const record = stats?.fighters?.[memeId]
  if (!record) return false
  return Number(record.lastMonthMentions ?? 0) <= 0
}

export function getDailyLeaderboard(stats, roster) {
  const day = todayKey()
  const dailyWins = stats.daily?.date === day ? stats.daily.wins || {} : {}
  return roster
    .map((meme) => {
      const record = getFighterRecord(stats, meme.id)
      return {
        ...meme,
        dayWins: dailyWins[meme.id] || 0,
        wins: record.wins || 0,
        losses: record.losses || 0,
        lastMonthMentions: record.lastMonthMentions ?? 0,
        totalMentions: record.totalMentions || 0,
      }
    })
    .sort(
      (a, b) =>
        b.dayWins - a.dayWins ||
        b.wins - a.wins ||
        b.lastMonthMentions - a.lastMonthMentions ||
        b.totalMentions - a.totalMentions,
    )
    .filter((row) => row.dayWins > 0 || row.wins > 0 || row.losses > 0)
    .slice(0, 8)
}
