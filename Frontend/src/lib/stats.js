const STORAGE_KEY = 'meme-arena-stats-v1'

export function loadStats() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : { battles: 0, fighters: {}, lastChampionId: 'tung-tung-tung-sahur' }
  } catch {
    return { battles: 0, fighters: {}, lastChampionId: 'tung-tung-tung-sahur' }
  }
}

export function recordBattle(stats, { winnerId, loserId, winnerShare, leftId, rightId }) {
  const next = {
    battles: stats.battles + 1,
    lastChampionId: winnerId,
    fighters: { ...stats.fighters },
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
