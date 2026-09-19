const STORAGE_KEY = 'meme-arena-stats-v1'

function todayKey() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

function emptyStats() {
  return {
    battles: 0,
    fighters: {},
    lastChampionId: 'tung-tung-tung-sahur',
    daily: { date: todayKey(), wins: {}, battles: 0 },
  }
}

export function loadStats() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : emptyStats()
    if (!parsed.daily || parsed.daily.date !== todayKey()) {
      parsed.daily = { date: todayKey(), wins: {}, battles: 0 }
    }
    return parsed
  } catch {
    return emptyStats()
  }
}

export function recordBattle(stats, { winnerId, loserId, winnerShare, leftId, rightId }) {
  const day = todayKey()
  const daily =
    stats.daily?.date === day
      ? { ...stats.daily, wins: { ...stats.daily.wins } }
      : { date: day, wins: {}, battles: 0 }

  const next = {
    battles: stats.battles + 1,
    lastChampionId: winnerId,
    fighters: { ...stats.fighters },
    daily: {
      ...daily,
      battles: (daily.battles || 0) + 1,
      wins: { ...daily.wins, [winnerId]: (daily.wins[winnerId] || 0) + 1 },
    },
  }

  for (const id of [leftId, rightId]) {
    if (!next.fighters[id]) {
      next.fighters[id] = { wins: 0, losses: 0, lastShare: 50 }
    }
  }

  next.fighters[winnerId] = {
    ...next.fighters[winnerId],
    wins: next.fighters[winnerId].wins + 1,
    lastShare: winnerShare,
  }
  next.fighters[loserId] = {
    ...next.fighters[loserId],
    losses: next.fighters[loserId].losses + 1,
    lastShare: 100 - winnerShare,
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  return next
}

export function getFighterRecord(stats, memeId) {
  return stats.fighters[memeId] ?? { wins: 0, losses: 0, lastShare: null }
}

export function getDailyLeaderboard(stats, roster) {
  const day = todayKey()
  const dailyWins = stats.daily?.date === day ? stats.daily.wins || {} : {}
  return roster
    .map((meme) => {
      const record = stats.fighters[meme.id] ?? { wins: 0, losses: 0 }
      return {
        ...meme,
        dayWins: dailyWins[meme.id] || 0,
        wins: record.wins || 0,
        losses: record.losses || 0,
      }
    })
    .sort((a, b) => b.dayWins - a.dayWins || b.wins - a.wins || b.yesterdayPopularity - a.yesterdayPopularity)
    .filter((row) => row.dayWins > 0 || row.wins > 0 || row.losses > 0)
    .slice(0, 8)
}
