import { closeAudio, getAudio, suspendAudio } from './sfx.js'

const MUSIC_KEY = 'meme-arena-music-v1'
const TIMER_KEY = '__memeArenaMusicTimer'
const LOOKAHEAD = 0.12

let bus = null
let running = false
let trackName = null
let wantedTrack = 'title'
let step = 0
let nextTime = 0
let enabled = loadMusicPref()
let noiseBuffer = null
let listening = false
let armed = false
let raf = 0

if (typeof window !== 'undefined' && window[TIMER_KEY]) {
  window.clearInterval(window[TIMER_KEY])
  window.cancelAnimationFrame?.(window[TIMER_KEY])
  window[TIMER_KEY] = null
}

const TRACKS = {
  title: {
    bpm: 96,
    loop: 64,
    swing: 0.1,
    kick: [0, 8, 16, 24, 32, 40, 48, 56],
    snare: [4, 12, 20, 28, 36, 44, 52, 60],
    hat: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 46, 48, 50, 52, 54, 56, 58, 60, 62],
    openHat: [14, 30, 46, 62],
    bass: [
      [0, 33, 6],
      [8, 36, 6],
      [16, 29, 6],
      [24, 31, 6],
      [32, 36, 6],
      [40, 40, 6],
      [48, 31, 6],
      [56, 33, 6],
    ],
    pad: [
      [0, [45, 48, 52], 16],
      [16, [41, 45, 48], 16],
      [32, [36, 40, 43, 48], 16],
      [48, [43, 47, 50], 16],
    ],
    lead: [
      [2, 69, 4],
      [8, 72, 3],
      [12, 76, 3],
      [18, 74, 4],
      [24, 69, 3],
      [28, 67, 3],
      [34, 72, 4],
      [40, 76, 3],
      [44, 79, 4],
      [50, 76, 3],
      [54, 74, 3],
      [58, 72, 4],
    ],
    volumes: { kick: 0.22, snare: 0.12, hat: 0.03, bass: 0.1, pad: 0.035, lead: 0.07 },
  },
  recap: {
    bpm: 94,
    loop: 64,
    swing: 0.12,
    kick: [0, 8, 16, 26, 32, 40, 48, 58],
    snare: [4, 12, 20, 28, 36, 44, 52, 60],
    hat: [2, 6, 10, 14, 18, 22, 26, 30, 34, 38, 42, 46, 50, 54, 58, 62],
    openHat: [14, 46],
    bass: [
      [0, 33, 6],
      [8, 36, 6],
      [16, 29, 6],
      [24, 33, 6],
      [32, 36, 6],
      [40, 40, 6],
      [48, 31, 6],
      [56, 36, 6],
    ],
    pad: [
      [0, [45, 48, 52], 16],
      [16, [41, 45, 48], 16],
      [32, [36, 40, 43, 48], 16],
      [48, [43, 47, 52], 16],
    ],
    lead: [
      [0, 72, 4],
      [8, 76, 4],
      [16, 74, 4],
      [24, 69, 4],
      [32, 76, 4],
      [40, 79, 4],
      [48, 76, 3],
      [52, 74, 3],
      [56, 72, 6],
    ],
    volumes: { kick: 0.18, snare: 0.1, hat: 0.025, bass: 0.09, pad: 0.04, lead: 0.065 },
  },
  battle: {
    bpm: 136,
    loop: 32,
    swing: 0.02,
    kick: [0, 4, 8, 12, 16, 20, 24, 28],
    snare: [4, 12, 20, 28],
    hat: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31],
    openHat: [6, 14, 22, 30],
    bass: [
      [0, 33, 2],
      [2, 33, 2],
      [4, 36, 2],
      [6, 33, 2],
      [8, 38, 2],
      [10, 33, 2],
      [12, 36, 2],
      [14, 31, 2],
      [16, 33, 2],
      [18, 33, 2],
      [20, 40, 2],
      [22, 38, 2],
      [24, 36, 2],
      [26, 33, 2],
      [28, 31, 2],
      [30, 29, 2],
    ],
    pad: [
      [0, [45, 48, 52], 8],
      [8, [43, 47, 50], 8],
      [16, [45, 48, 52], 8],
      [24, [41, 45, 48], 8],
    ],
    lead: [
      [0, 69, 1],
      [2, 72, 1],
      [4, 76, 1],
      [6, 72, 1],
      [8, 79, 2],
      [12, 76, 1],
      [14, 74, 1],
      [16, 72, 1],
      [18, 76, 1],
      [20, 81, 2],
      [24, 79, 1],
      [26, 76, 1],
      [28, 74, 1],
      [30, 72, 1],
    ],
    volumes: { kick: 0.24, snare: 0.14, hat: 0.04, bass: 0.12, pad: 0.025, lead: 0.075 },
  },
  battleClimax: {
    bpm: 152,
    loop: 32,
    swing: 0,
    kick: [0, 2, 4, 8, 10, 12, 16, 18, 20, 24, 26, 28],
    snare: [4, 7, 12, 15, 20, 23, 28, 31],
    hat: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31],
    openHat: [3, 7, 11, 15, 19, 23, 27, 31],
    bass: [
      [0, 33, 1],
      [1, 33, 1],
      [2, 36, 1],
      [3, 33, 1],
      [4, 40, 1],
      [5, 38, 1],
      [6, 36, 1],
      [7, 33, 1],
      [8, 43, 1],
      [9, 40, 1],
      [10, 38, 1],
      [11, 36, 1],
      [12, 40, 1],
      [13, 38, 1],
      [14, 36, 1],
      [15, 31, 1],
      [16, 33, 1],
      [17, 33, 1],
      [18, 36, 1],
      [19, 33, 1],
      [20, 45, 1],
      [21, 43, 1],
      [22, 40, 1],
      [23, 38, 1],
      [24, 36, 1],
      [25, 40, 1],
      [26, 38, 1],
      [27, 36, 1],
      [28, 33, 1],
      [29, 31, 1],
      [30, 29, 1],
      [31, 31, 1],
    ],
    pad: [
      [0, [45, 48, 52, 57], 8],
      [8, [47, 50, 55], 8],
      [16, [45, 48, 52, 57], 8],
      [24, [43, 47, 50, 55], 8],
    ],
    lead: [
      [0, 81, 1],
      [1, 79, 1],
      [2, 76, 1],
      [3, 81, 1],
      [4, 84, 2],
      [6, 81, 1],
      [7, 79, 1],
      [8, 76, 1],
      [10, 81, 1],
      [12, 84, 2],
      [14, 86, 1],
      [15, 84, 1],
      [16, 81, 1],
      [18, 79, 1],
      [20, 84, 2],
      [22, 81, 1],
      [24, 88, 2],
      [26, 86, 1],
      [28, 84, 1],
      [30, 81, 1],
    ],
    volumes: { kick: 0.26, snare: 0.16, hat: 0.05, bass: 0.13, pad: 0.03, lead: 0.08 },
  },
}

function loadMusicPref() {
  try {
    const raw = localStorage.getItem(MUSIC_KEY)
    if (raw == null) return true
    return JSON.parse(raw) !== false
  } catch {
    return true
  }
}

export function isMusicOn() {
  return enabled
}

export function saveMusicPref(on) {
  enabled = on
  localStorage.setItem(MUSIC_KEY, JSON.stringify(on))
}

function midiToFreq(note) {
  return 440 * 2 ** ((note - 69) / 12)
}

function ensureBus(ac) {
  if (bus) return bus
  bus = ac.createGain()
  bus.gain.value = 0
  bus.connect(ac.destination)
  return bus
}

function ensureNoise(ac) {
  if (noiseBuffer) return noiseBuffer
  noiseBuffer = ac.createBuffer(1, ac.sampleRate, ac.sampleRate)
  const data = noiseBuffer.getChannelData(0)
  for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1
  return noiseBuffer
}

function playKick(ac, time, peak) {
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(140, time)
  osc.frequency.exponentialRampToValueAtTime(42, time + 0.12)
  gain.gain.setValueAtTime(peak, time)
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.18)
  osc.connect(gain)
  gain.connect(bus)
  osc.start(time)
  osc.stop(time + 0.2)
}

function playNoise(ac, time, { duration, peak, highpass, lowpass }) {
  const src = ac.createBufferSource()
  src.buffer = ensureNoise(ac)
  const hp = ac.createBiquadFilter()
  hp.type = 'highpass'
  hp.frequency.value = highpass
  const lp = ac.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = lowpass
  const gain = ac.createGain()
  gain.gain.setValueAtTime(peak, time)
  gain.gain.exponentialRampToValueAtTime(0.0001, time + duration)
  src.connect(hp)
  hp.connect(lp)
  lp.connect(gain)
  gain.connect(bus)
  src.start(time)
  src.stop(time + duration + 0.02)
}

function playTone(ac, time, { freq, duration, type, peak }) {
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, time)
  gain.gain.setValueAtTime(0.0001, time)
  gain.gain.exponentialRampToValueAtTime(peak, time + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, time + duration)
  osc.connect(gain)
  gain.connect(bus)
  osc.start(time)
  osc.stop(time + duration + 0.02)
}

function stepDuration(track, index) {
  const sixteenth = 60 / track.bpm / 4
  if (!track.swing || index % 2 === 0) return sixteenth
  return sixteenth * (1 + track.swing)
}

function scheduleStep(track, index, time) {
  const ac = getAudio()
  if (!ac || !bus) return
  const vols = track.volumes
  const stepIndex = index % track.loop

  if (track.kick.includes(stepIndex)) playKick(ac, time, vols.kick)
  if (track.snare.includes(stepIndex)) {
    playNoise(ac, time, { duration: 0.12, peak: vols.snare, highpass: 800, lowpass: 4200 })
    playTone(ac, time, { freq: 180, duration: 0.08, type: 'triangle', peak: vols.snare * 0.5 })
  }
  if (track.hat.includes(stepIndex)) {
    playNoise(ac, time, { duration: 0.035, peak: vols.hat, highpass: 6000, lowpass: 12000 })
  }
  if (track.openHat?.includes(stepIndex)) {
    playNoise(ac, time, { duration: 0.12, peak: vols.hat * 1.4, highpass: 5000, lowpass: 11000 })
  }

  for (const [at, note, dur] of track.bass) {
    if (at !== stepIndex) continue
    playTone(ac, time, {
      freq: midiToFreq(note),
      duration: dur * stepDuration(track, stepIndex) * 0.92,
      type: trackName?.startsWith('battle') ? 'sawtooth' : 'triangle',
      peak: vols.bass,
    })
  }

  for (const [at, notes, dur] of track.pad) {
    if (at !== stepIndex) continue
    const length = dur * stepDuration(track, stepIndex)
    for (const note of notes) {
      playTone(ac, time, {
        freq: midiToFreq(note),
        duration: length * 0.96,
        type: 'sine',
        peak: vols.pad,
      })
    }
  }

  for (const [at, note, dur] of track.lead) {
    if (at !== stepIndex) continue
    playTone(ac, time, {
      freq: midiToFreq(note),
      duration: dur * stepDuration(track, stepIndex) * 0.85,
      type: trackName === 'title' || trackName === 'recap' ? 'triangle' : 'square',
      peak: vols.lead,
    })
  }
}

function tick() {
  if (document.hidden) return
  const ac = getAudio({ resume: false })
  const track = TRACKS[trackName]
  if (!ac || ac.state !== 'running' || !enabled || !track) return
  while (nextTime < ac.currentTime + LOOKAHEAD) {
    scheduleStep(track, step, nextTime)
    nextTime += stepDuration(track, step)
    step += 1
  }
}

function loop() {
  if (!running) return
  tick()
  raf = window.requestAnimationFrame(loop)
  window[TIMER_KEY] = raf
}

function startScheduler() {
  const ac = getAudio({ resume: true })
  if (!ac || !enabled || document.hidden) return
  ensureBus(ac)
  if (running) return
  running = true
  nextTime = ac.currentTime + 0.05
  raf = window.requestAnimationFrame(loop)
  window[TIMER_KEY] = raf
}

function stopScheduler() {
  running = false
  if (raf) window.cancelAnimationFrame(raf)
  raf = 0
  if (typeof window !== 'undefined') {
    if (window[TIMER_KEY]) {
      window.cancelAnimationFrame(window[TIMER_KEY])
      window.clearInterval(window[TIMER_KEY])
      window[TIMER_KEY] = null
    }
  }
}

function fadeTo(value, seconds = 0.35) {
  const ac = getAudio({ resume: false })
  if (!ac || ac.state === 'closed' || !bus) return
  const now = ac.currentTime
  bus.gain.cancelScheduledValues(now)
  bus.gain.setValueAtTime(Math.max(bus.gain.value, 0.0001), now)
  bus.gain.exponentialRampToValueAtTime(Math.max(value, 0.0001), now + seconds)
}

export function pauseMusic() {
  stopScheduler()
  const ac = getAudio({ resume: false })
  if (bus && ac && ac.state !== 'closed') {
    bus.gain.cancelScheduledValues(ac.currentTime)
    bus.gain.setValueAtTime(0, ac.currentTime)
  }
  suspendAudio()
}

export function stopMusic() {
  stopScheduler()
  trackName = null
  bus = null
  noiseBuffer = null
  closeAudio()
}

function onVisibility() {
  if (document.hidden) {
    pauseMusic()
    return
  }
  if (enabled && wantedTrack) unlockMusic()
}

function watchPage() {
  if (listening || typeof window === 'undefined') return
  listening = true
  document.addEventListener('visibilitychange', onVisibility)
  window.addEventListener('pagehide', stopMusic)
  window.addEventListener('beforeunload', stopMusic)
  window.addEventListener('freeze', stopMusic)
}

watchPage()

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    stopMusic()
  })
}

export function setMusicEnabled(on) {
  saveMusicPref(on)
  if (!on) {
    pauseMusic()
    return
  }
  unlockMusic()
}

export function unlockMusic() {
  if (document.hidden || !enabled) return
  armed = true
  const ac = getAudio({ resume: true })
  if (!ac) return
  const start = () => {
    if (running && trackName) return
    if (enabled && wantedTrack) setMusicTrack(wantedTrack)
  }
  if (ac.state === 'suspended') {
    ac.resume().then(start).catch(() => {})
    return
  }
  start()
}

export function setMusicTrack(name) {
  wantedTrack = name
  if (!armed || !enabled || document.hidden) return
  const ac = getAudio({ resume: true })
  if (!ac) return
  if (ac.state === 'suspended') {
    ac.resume().then(() => setMusicTrack(name)).catch(() => {})
    return
  }
  if (name === trackName && running) return
  ensureBus(ac)
  const sameTrack = name === trackName
  trackName = name
  if (!sameTrack) {
    step = 0
    fadeTo(0.52, trackName === 'battleClimax' ? 0.18 : 0.4)
  }
  nextTime = ac.currentTime + 0.04
  startScheduler()
}
