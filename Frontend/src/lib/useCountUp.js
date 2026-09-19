import { useEffect, useState } from 'react'

export function useCountUp(target, durationMs = 4000) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (target == null) return
    setValue(0)
    const start = performance.now()

    let frameId
    function step(now) {
      const elapsed = now - start
      const progress = Math.min(1, elapsed / durationMs)
      const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
      setValue(Math.round(target * eased))
      if (progress < 1) {
        frameId = requestAnimationFrame(step)
      }
    }

    frameId = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frameId)
  }, [target, durationMs])

  return value
}