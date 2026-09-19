import { useEffect, useMemo, useRef, useState } from 'react'
import { searchMemes } from '../data/memes.js'

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

  useEffect(() => {
    setQuery(value?.name ?? '')
  }, [value])

  const matches = useMemo(() => {
    return searchMemes(query).filter((meme) => meme.id !== excludeId).slice(0, 60)
  }, [query, excludeId])

  useEffect(() => {
    function onDocClick(event) {
      if (!boxRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])
  function announcePick(memeName){
    fetch('http://localhost:8000/api/announce-pick', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ memeName }),
  })
    .then((res) => res.blob())
    .then((blob) => new Audio(URL.createObjectURL(blob)).play())
    .then((err) => console.error('Announcer pick failed', err))
  }

  function choose(meme) {
    onSelect(meme)
    setQuery(meme.name)
    setOpen(false)
    announcePick(meme.name)
  }

  function onKeyDown(event) {
    if (!open && (event.key === 'ArrowDown' || event.key === 'Enter')) {
      setOpen(true)
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
        <input
          value={query}
          placeholder="Type a meme..."
          autoComplete="off"
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value)
            setOpen(true)
            setActive(0)
            if (value) onSelect(null)
          }}
          onKeyDown={onKeyDown}
        />
      </label>
      {open && (
        <ul className="meme-search__list" role="listbox">
          {matches.length === 0 && <li className="meme-search__empty">No fighter in the roster</li>}
          {matches.map((meme, index) => (
            <li key={meme.id}>
              <button
                type="button"
                className={index === active ? 'is-active' : ''}
                onMouseEnter={() => setActive(index)}
                onClick={() => choose(meme)}
              >
                <span className="dot" style={{ background: meme.color }} />
                <span>{meme.name}</span>
                <small>{meme.origin}</small>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
