import { useState } from 'react'

export default function InfoDot({ memeId }) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState(null)
  const [loading, setLoading] = useState(false)

  function handleEnter() {
    setOpen(true)
    if (text) return
    setLoading(true)
    fetch('/api/meme-history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memeId }),
    })
      .then((res) => res.json())
      .then((data) => setText(data.text))
      .catch(() => setText('Could not load history right now.'))
      .finally(() => setLoading(false))
  }

  function handleLeave() {
    setOpen(false)
  }

    return (
      <span
        className="info-dot"
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
      >
        <button type="button" className="info-dot__btn" aria-label="Meme history" tabIndex={0}>
          i
        </button>
        {open && (
          <div className="info-dot__popover">
            {loading ? 'Loading...' : text}
          </div>
        )}
      </span>
    )
}