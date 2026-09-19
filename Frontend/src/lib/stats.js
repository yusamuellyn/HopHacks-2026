import { getStats, saveBattleRecord } from './api.js'

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
    window: { yesterday: null, latest: null },
    recent: [],
    maxYesterday: 0,
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
  const stats = await getStats()
  cacheStats(stats)
  return stats
}

export async function recordBattle(result) {
  const stats = await saveBattleRecord({
    leftId: result.leftId,
    rightId: result.rightId,
    winnerId: result.winnerId,
    leftTotal: result.leftTotal,
    rightTotal: result.rightTotal,
    winnerShare: result.winnerShare,
  })
  cacheStats(stats)
  return stats
}

export function getFighterRecord(stats, memeId) {
  return (
    stats.fighters?.[memeId] ?? {
      wins: 0,
      losses: 0,
      lastShare: null,
      yesterdayMentions: 0,
      latestMentions: 0,
      totalMentions: 0,
    }
  )
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
        yesterdayMentions: record.yesterdayMentions || 0,
        totalMentions: record.totalMentions || 0,
      }
    })
    .sort(
      (a, b) =>
        b.dayWins - a.dayWins ||
        b.wins - a.wins ||
        b.yesterdayMentions - a.yesterdayMentions ||
        b.totalMentions - a.totalMentions,
    )
    .filter((row) => row.dayWins > 0 || row.wins > 0 || row.losses > 0)
    .slice(0, 8)
}
