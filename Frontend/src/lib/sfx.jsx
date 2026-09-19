import { createContext, useContext, useMemo, useState } from 'react'
import {
  SFX_CATALOG,
  loadSfxPrefs,
  playComboOrHit,
  playNextHit,
  playSfx,
  previewSfx,
  saveSfxPrefs,
} from './sfx.js'
import { isMusicOn, setMusicEnabled, unlockMusic } from './music.js'

const SfxContext = createContext({
  enabled: {},
  toggle: () => {},
  play: () => {},
  preview: () => {},
  playHit: () => {},
  playImpact: () => {},
  musicOn: true,
  toggleMusic: () => {},
})

export function SfxProvider({ children }) {
  const [enabled, setEnabled] = useState(loadSfxPrefs)
  const [musicOn, setMusicOn] = useState(isMusicOn)
  const value = useMemo(
    () => ({
      catalog: SFX_CATALOG,
      enabled,
      musicOn,
      toggle: (id) => {
        setEnabled((current) => {
          const next = { ...current, [id]: !current[id] }
          saveSfxPrefs(next)
          return next
        })
      },
      toggleMusic: () => {
        setMusicOn((current) => {
          const next = !current
          setMusicEnabled(next)
          if (next) unlockMusic()
          return next
        })
      },
      play: (id) => playSfx(id, enabled),
      preview: previewSfx,
      playHit: () => playNextHit(enabled),
      playImpact: (combo) => playComboOrHit(combo, enabled),
    }),
    [enabled, musicOn],
  )
  return <SfxContext.Provider value={value}>{children}</SfxContext.Provider>
}

export function useSfx() {
  return useContext(SfxContext)
}
