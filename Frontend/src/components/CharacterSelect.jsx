import FighterSlot from './FighterSlot.jsx'
import MemeSearch from './MemeSearch.jsx'

export default function CharacterSelect({ left, right, stats, onSelectLeft, onSelectRight, onStart }) {
  const ready = Boolean(left && right)

  return (
    <div className="select-screen">
      <header className="hero-mark">
        <p className="eyebrow">HopHacks 2026 · Memetics</p>
        <h1 className="hero-title">MEME ARENA</h1>
        <p className="tagline">Two memes enter. The timeline decides.</p>
      </header>

      <div className="select-row">
        <FighterSlot meme={left} stats={stats} side="left" emptyLabel="Fighter 1" />

        <div className="vs-mark">
          <span className="vs-mark__bolt" aria-hidden="true" />
          <strong>VS</strong>
          <span className="vs-mark__bolt vs-mark__bolt--flip" aria-hidden="true" />
        </div>

        <FighterSlot meme={right} stats={stats} side="right" emptyLabel="Fighter 2" />
      </div>

      <div className="select-controls">
        <MemeSearch
          side="left"
          label="Choose Fighter 1"
          value={left}
          excludeId={right?.id}
          onSelect={onSelectLeft}
        />
        <MemeSearch
          side="right"
          label="Choose Fighter 2"
          value={right}
          excludeId={left?.id}
          onSelect={onSelectRight}
        />
      </div>

      <button type="button" className="start-btn" disabled={!ready} onClick={() => onStart()}>
        {ready ? 'START BATTLE' : 'PICK TWO FIGHTERS'}
      </button>
    </div>
  )
}
