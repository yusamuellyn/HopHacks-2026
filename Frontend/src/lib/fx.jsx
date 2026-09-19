import { createContext, useContext, useMemo, useState } from 'react'

export const FX_OPTIONS = [
  { id: 'combo', label: 'Combo pops' },
  { id: 'rain', label: 'Meme rain' },
  { id: 'odometer', label: 'Search odometer' },
]

const DEFAULTS = Object.fromEntries(FX_OPTIONS.map((item) => [item.id, true]))

const FxContext = createContext({
  fx: DEFAULTS,
  toggle: () => {},
})

export function FxProvider({ children }) {
  const [fx, setFx] = useState(DEFAULTS)
  const value = useMemo(
    () => ({
      fx,
      toggle: (id) => setFx((current) => ({ ...current, [id]: !current[id] })),
    }),
    [fx],
  )
  return <FxContext.Provider value={value}>{children}</FxContext.Provider>
}

export function useFx() {
  return useContext(FxContext)
}
