// All backend calls live here. Paths mirror the Backend route modules:
// battle_routes.py (/api/stats, /api/battle, /api/record-battle) and
// announcer_routes.py (/api/announce-*).

function postJson(path, body) {
  return fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export async function getStats() {
  const res = await fetch('/api/stats')
  if (!res.ok) throw new Error('Failed to load records')
  return res.json()
}

export async function fetchBattleTotals(leftId, rightId) {
  const res = await postJson('/api/battle', { leftId, rightId })
  if (!res.ok) throw new Error('Battle lookup failed')
  return res.json()
}

export async function saveBattleRecord(payload) {
  const res = await postJson('/api/record-battle', payload)
  if (!res.ok) throw new Error('Failed to save battle')
  return res.json()
}

function playAnnouncement(path, body, errorLabel) {
  postJson(path, body)
    .then((res) => res.blob())
    .then((blob) => new Audio(URL.createObjectURL(blob)).play())
    .catch((err) => console.error(errorLabel, err))
}

export function announcePick(memeName) {
  playAnnouncement('/api/announce-pick', { memeName }, 'Announcer pick failed')
}

export function announceStart(leftName, rightName) {
  playAnnouncement('/api/announce-start', { leftName, rightName }, 'Announcer intro failed')
}

export function announceWinner(winnerName, pct) {
  playAnnouncement('/api/announce-winner', { winnerName, pct }, 'Winner announcement failed')
}
