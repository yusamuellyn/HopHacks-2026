let generation = 0
let current = null
let objectUrl = null

function clearCurrent() {
  if (current) {
    current.onended = null
    current.onerror = null
    current.pause()
    current.removeAttribute('src')
    current.load()
    current = null
  }
  if (objectUrl) {
    URL.revokeObjectURL(objectUrl)
    objectUrl = null
  }
}

export function stopAnnouncer() {
  generation += 1
  clearCurrent()
}

export async function playAnnouncement(path, body) {
  const token = generation + 1
  generation = token
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Announcement failed: ${path}`)
  const blob = await res.blob()
  if (token !== generation) return

  clearCurrent()
  const url = URL.createObjectURL(blob)
  const audio = new Audio(url)
  objectUrl = url
  current = audio
  const done = () => {
    if (current !== audio) return
    clearCurrent()
  }
  audio.onended = done
  audio.onerror = done
  try {
    await audio.play()
  } catch {
    done()
  }
}
