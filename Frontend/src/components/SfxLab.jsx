import { useState } from 'react'
import { useSfx } from '../lib/sfx.jsx'

export default function SfxLab() {
  const [open, setOpen] = useState(false)
  const { catalog, enabled, toggle, preview, musicOn, toggleMusic } = useSfx()

  return (
    <div className={`sfx-lab ${open ? 'is-open' : ''}`}>
      {open && (
        <div className="sfx-lab__panel">
          <div className="sfx-lab__head">
            <strong>SFX LAB</strong>
            <span>Preview, then keep the ones you like</span>
          </div>
          <div className="sfx-lab__music">
            <div>
              <b>Background music</b>
              <small>Title, battle, and recap beds</small>
            </div>
            <button
              type="button"
              className={`sfx-lab__like ${musicOn ? 'is-on' : ''}`}
              onClick={toggleMusic}
            >
              {musicOn ? 'ON' : 'MUTE'}
            </button>
          </div>
          <ul>
            {catalog.map((item) => {
              const liked = enabled[item.id] !== false
              return (
                <li key={item.id}>
                  <div>
                    <b>{item.label}</b>
                    <small>{item.hint}</small>
                  </div>
                  <button type="button" className="sfx-lab__play" onClick={() => preview(item.id)}>
                    PLAY
                  </button>
                  <button
                    type="button"
                    className={`sfx-lab__like ${liked ? 'is-on' : ''}`}
                    onClick={() => toggle(item.id)}
                  >
                    {liked ? 'LIKE' : 'MUTE'}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
      <button type="button" className="sfx-lab__toggle" onClick={() => setOpen((value) => !value)}>
        {open ? 'CLOSE SFX' : 'SFX LAB'}
      </button>
    </div>
  )
}
