import { useCallback, useEffect, useState } from 'react'
import Arena from './components/Arena.jsx'
import CharacterSelect from './components/CharacterSelect.jsx'
import StageBackdrop from './components/StageBackdrop.jsx'
import { FxProvider } from './lib/fx.jsx'
import { SfxProvider } from './lib/sfx.jsx'
import SfxLab from './components/SfxLab.jsx'
import { setMusicTrack, unlockMusic, stopMusic } from './lib/music.js'
import { fetchStats, loadStats, recordBattle } from './lib/stats.js'
import './App.css'

export default function App() {
  return (
    <FxProvider>
      <SfxProvider>
        <AppShell />
      </SfxProvider>
    </FxProvider>
  )
}

function AppShell() {
  const [screen, setScreen] = useState('select')
  const [left, setLeft] = useState(null)
  const [right, setRight] = useState(null)
  const [stats, setStats] = useState(loadStats)

  const onBattleEnd = useCallback((result) => {
    recordBattle({
      leftId: result.leftId,
      rightId: result.rightId,
      winnerId: result.winner.id,
      leftTotal: result.left.mentions,
      rightTotal: result.right.mentions,
      winnerShare: result.winnerShare,
    })
      .then(setStats)
      .catch((err) => console.error('Failed to save record', err))
  }, [])

  useEffect(() => {
    fetchStats().then(setStats).catch((err) => console.error('Failed to load records', err))
  }, [])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [screen])

  useEffect(() => {
    if (screen === 'select') setMusicTrack('title')
  }, [screen])

  useEffect(() => {
    return () => stopMusic()
  }, [])

  return (
    <div
      className={`app-shell app-shell--${screen}`}
      onPointerDown={unlockMusic}
    >
      {screen === 'select' ? (
        <>
          <StageBackdrop mode="select" />
          <CharacterSelect
            left={left}
            right={right}
            stats={stats}
            onSelectLeft={setLeft}
            onSelectRight={setRight}
            onStart={() => setScreen('battle')}
          />
        </>
      ) : (
        <Arena
          left={left}
          right={right}
          stats={stats}
          onBattleEnd={onBattleEnd}
          onRematch={() => {
            setLeft(null)
            setRight(null)
            setScreen('select')
            fetchStats().then(setStats).catch(() => {})
          }}
        />
      )}
      <SfxLab />
    </div>
  )
}
