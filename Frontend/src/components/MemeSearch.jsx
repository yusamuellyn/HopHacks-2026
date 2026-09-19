import { useEffect, useMemo, useRef, useState } from 'react'
import { searchMemes } from '../data/memes.js'
import { useSfx } from '../lib/sfx.jsx'

export default function MemeSearch({
  label,
  value,
  excludeId,
  onSelect,
  side,
}) {
  const [query, setQuery] = useState(value?.name ?? '')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const boxRef = useRef(null)
  const sfx = useSfx()

  useEffect(() => {
    if (value) setQuery(value.name)
  }, [value])

  const browsingRoster = !query.trim() || Boolean(value && query.trim() === value.name)

  const matches = useMemo(() => {
    const list = browsingRoster ? searchMemes('') : searchMemes(query)
    return list.filter((meme) => meme.id !== excludeId).slice(0, 60)
  }, [query, excludeId, browsingRoster])

  useEffect(() => {
    function onDocClick(event) {
      if (!boxRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [])

  function announcePick(memeName) {
    fetch('/api/announce-pick', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memeName }),
    })
      .then((res) => res.blob())
      .then((blob) => new Audio(URL.createObjectURL(blob)).play())
      .catch((err) => console.error('Announcer pick failed', err))
  }

  function clearPick() {
    onSelect(null)
    setQuery('')
    setOpen(true)
    setActive(0)
  }

  function choose(meme) {
    if (value?.id === meme.id) {
      clearPick()
      return
    }
    onSelect(meme)
    setQuery(meme.name)
    setOpen(false)
    sfx.play('pickPop')
    announcePick(meme.name)
  }

  function onKeyDown(event) {
    if (!open && (event.key === 'ArrowDown' || event.key === 'Enter')) {
      setOpen(true)
      return
    }
    if (event.key === 'Backspace' && value && query === value.name) {
      event.preventDefault()
      clearPick()
      return
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActive((i) => Math.min(i + 1, matches.length - 1))
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((i) => Math.max(i - 1, 0))
    }
    if (event.key === 'Enter' && matches[active]) {
      event.preventDefault()
      choose(matches[active])
    }
    if (event.key === 'Escape') setOpen(false)
  }

  return (
    <div className={`meme-search meme-search--${side}`} ref={boxRef}>
      <label>
        {label}
        <div className="meme-search__field">
          <input
            value={query}
            placeholder="Type a meme..."
            autoComplete="off"
            onFocus={() => {
              setOpen(true)
              const selectedIndex = matches.findIndex((meme) => meme.id === value?.id)
              setActive(selectedIndex >= 0 ? selectedIndex : 0)
            }}
            onClick={() => setOpen(true)}
            onChange={(event) => {
              setQuery(event.target.value)
              setOpen(true)
              setActive(0)
              if (value) onSelect(null)
            }}
            onKeyDown={onKeyDown}
          />
          {value && (
            <button
              type="button"
              className="meme-search__clear"
              aria-label={`Clear ${value.name}`}
              onClick={clearPick}
            >
              ×
            </button>
          )}
        </div>
      </label>
      {open && (
        <ul className="meme-search__list" role="listbox">
          {matches.length === 0 && <li className="meme-search__empty">No fighter in the roster</li>}
          {matches.map((meme, index) => (
            <li key={meme.id}>
              <button
                type="button"
                className={`${index === active ? 'is-active' : ''} ${meme.id === value?.id ? 'is-picked' : ''}`.trim()}
                onMouseEnter={() => setActive(index)}
                onClick={() => choose(meme)}
              >
                <span className="dot" style={{ background: meme.color }} />
                <span>{meme.name}</span>
                <small>{meme.id === value?.id ? 'click to unselect' : meme.origin}</small>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
