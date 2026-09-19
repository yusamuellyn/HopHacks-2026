const STORAGE_KEY = 'meme-arena-sfx-v1'

export const SFX_CATALOG = [
  { id: 'hitBlip', role: 'hit', label: 'Hit blip', hint: 'Short square pop' },
  { id: 'hitCoin', role: 'hit', label: 'Hit coin', hint: 'Addictive arcade ding' },
  { id: 'hitZap', role: 'hit', label: 'Hit zap', hint: 'Tiny laser zip' },
  { id: 'hitBoop', role: 'hit', label: 'Hit boop', hint: 'Low 8-bit thunk' },
  { id: 'hitChirp', role: 'hit', label: 'Hit chirp', hint: 'Rising score chirp' },
  { id: 'comboSplat', role: 'combo', label: 'Combo splat', hint: 'Wet smash on big combos' },
  { id: 'startBell', role: 'start', label: 'Round bell', hint: 'Boxing ding-ding' },
  { id: 'finishFanfare', role: 'finish', label: 'KO fanfare', hint: '8-bit you-win sting' },
  { id: 'pickPop', role: 'ui', label: 'Pick pop', hint: 'When you lock a fighter' },
  { id: 'pageFlip', role: 'ui', label: 'Page flip', hint: 'Recap next / back' },
]

export const SFX_DEFAULTS = Object.fromEntries(SFX_CATALOG.map((item) => [item.id, true]))

let ctx = null
let hitCursor = 0
const AUDIO_KEY = '__memeArenaAudio'

if (typeof window !== 'undefined' && window[AUDIO_KEY] && window[AUDIO_KEY] !== ctx) {
  window[AUDIO_KEY].close?.().catch?.(() => {})
  window[AUDIO_KEY] = null
}

export function getAudio({ resume = true } = {}) {
  const AC = window.AudioContext || window.webkitAudioContext
  if (!AC) return null
  if (!ctx || ctx.state === 'closed') {
    ctx = window[AUDIO_KEY] && window[AUDIO_KEY].state !== 'closed' ? window[AUDIO_KEY] : new AC()
    window[AUDIO_KEY] = ctx
  }
  if (resume && ctx.state === 'suspended' && !document.hidden) ctx.resume()
  return ctx
}

export async function suspendAudio() {
  if (ctx && ctx.state === 'running') {
    try {
      await ctx.suspend()
    } catch {
      /* ignore */
    }
  }
}

export async function closeAudio() {
  const current = ctx || window[AUDIO_KEY]
  ctx = null
  if (typeof window !== 'undefined') window[AUDIO_KEY] = null
  if (current && current.state !== 'closed') {
    try {
      await current.close()
    } catch {
      /* ignore */
    }
  }
}

function audio() {
  return getAudio()
}

function envGain(ac, start, duration, peak = 0.14) {
  const gain = ac.createGain()
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(peak, start + 0.012)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
  gain.connect(ac.destination)
  return gain
}

function tone({ freq, start, duration, type = 'square', peak = 0.12, slideTo }) {
  const ac = audio()
  if (!ac) return
  const osc = ac.createOscillator()
  osc.type = type
  osc.frequency.setValueAtTime(freq, start)
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(slideTo, 20), start + duration)
  osc.connect(envGain(ac, start, duration, peak))
  osc.start(start)
  osc.stop(start + duration + 0.02)
}

function noiseBurst({ start, duration = 0.22, peak = 0.28, from = 2200, to = 180 }) {
  const ac = audio()
  if (!ac) return
  const length = Math.max(1, Math.floor(ac.sampleRate * duration))
  const buffer = ac.createBuffer(1, length, ac.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < length; i += 1) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 1.6
  }
  const src = ac.createBufferSource()
  src.buffer = buffer
  const filter = ac.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(from, start)
  filter.frequency.exponentialRampToValueAtTime(to, start + duration)
  const gain = ac.createGain()
  gain.gain.setValueAtTime(peak, start)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
  src.connect(filter)
  filter.connect(gain)
  gain.connect(ac.destination)
  src.start(start)
  src.stop(start + duration + 0.02)
}

const PLAYERS = {
  hitBlip() {
    const t = audio()?.currentTime
    if (t == null) return
    tone({ freq: 880, start: t, duration: 0.07, type: 'square', peak: 0.11 })
    tone({ freq: 1320, start: t + 0.03, duration: 0.05, type: 'square', peak: 0.07 })
  },
  hitCoin() {
    const t = audio()?.currentTime
    if (t == null) return
    tone({ freq: 988, start: t, duration: 0.08, type: 'square', peak: 0.1 })
    tone({ freq: 1319, start: t + 0.07, duration: 0.16, type: 'square', peak: 0.12 })
  },
  hitZap() {
    const t = audio()?.currentTime
    if (t == null) return
    tone({ freq: 1480, start: t, duration: 0.1, type: 'sawtooth', peak: 0.08, slideTo: 240 })
  },
  hitBoop() {
    const t = audio()?.currentTime
    if (t == null) return
    tone({ freq: 196, start: t, duration: 0.09, type: 'square', peak: 0.14 })
    tone({ freq: 294, start: t + 0.04, duration: 0.07, type: 'triangle', peak: 0.08 })
  },
  hitChirp() {
    const t = audio()?.currentTime
    if (t == null) return
    tone({ freq: 520, start: t, duration: 0.11, type: 'square', peak: 0.1, slideTo: 1100 })
  },
  comboSplat() {
    const t = audio()?.currentTime
    if (t == null) return
    noiseBurst({ start: t, duration: 0.26, peak: 0.32, from: 2400, to: 140 })
    tone({ freq: 160, start: t, duration: 0.14, type: 'square', peak: 0.16, slideTo: 70 })
    tone({ freq: 90, start: t + 0.05, duration: 0.18, type: 'triangle', peak: 0.12 })
  },
  startBell() {
    const t = audio()?.currentTime
    if (t == null) return
    const ding = (when) => {
      tone({ freq: 988, start: when, duration: 0.55, type: 'sine', peak: 0.18 })
      tone({ freq: 1480, start: when, duration: 0.4, type: 'triangle', peak: 0.08 })
      tone({ freq: 1976, start: when, duration: 0.22, type: 'sine', peak: 0.04 })
    }
    ding(t)
    ding(t + 0.2)
  },
  finishFanfare() {
    const t = audio()?.currentTime
    if (t == null) return
    tone({ freq: 392, start: t, duration: 0.12, type: 'square', peak: 0.1 })
    tone({ freq: 494, start: t + 0.11, duration: 0.12, type: 'square', peak: 0.1 })
    tone({ freq: 587, start: t + 0.22, duration: 0.12, type: 'square', peak: 0.11 })
    tone({ freq: 784, start: t + 0.34, duration: 0.38, type: 'square', peak: 0.13 })
    tone({ freq: 988, start: t + 0.38, duration: 0.32, type: 'triangle', peak: 0.07 })
  },
  pickPop() {
    const t = audio()?.currentTime
    if (t == null) return
    tone({ freq: 740, start: t, duration: 0.06, type: 'square', peak: 0.09 })
    tone({ freq: 1175, start: t + 0.05, duration: 0.08, type: 'square', peak: 0.08 })
  },
  pageFlip() {
    const t = audio()?.currentTime
    if (t == null) return
    tone({ freq: 620, start: t, duration: 0.05, type: 'triangle', peak: 0.08, slideTo: 880 })
    tone({ freq: 440, start: t + 0.06, duration: 0.07, type: 'triangle', peak: 0.07 })
  },
}

export function loadSfxPrefs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...SFX_DEFAULTS }
    return { ...SFX_DEFAULTS, ...JSON.parse(raw) }
  } catch {
    return { ...SFX_DEFAULTS }
  }
}

export function saveSfxPrefs(enabled) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(enabled))
}

export function playSfx(id, enabled = SFX_DEFAULTS) {
  if (enabled[id] === false) return
  PLAYERS[id]?.()
}

export function previewSfx(id) {
  PLAYERS[id]?.()
}

export function playNextHit(enabled = SFX_DEFAULTS) {
  const hits = SFX_CATALOG.filter((item) => item.role === 'hit' && enabled[item.id] !== false)
  if (!hits.length) return
  const sound = hits[hitCursor % hits.length]
  hitCursor += 1
  PLAYERS[sound.id]?.()
}

export function playComboOrHit(combo, enabled = SFX_DEFAULTS) {
  if (combo >= 3 && enabled.comboSplat !== false) {
    PLAYERS.comboSplat()
    return
  }
  playNextHit(enabled)
}
