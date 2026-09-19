import { useCallback, useEffect, useState } from 'react'
import Arena from './components/Arena.jsx'
import CharacterSelect from './components/CharacterSelect.jsx'
import StageBackdrop from './components/StageBackdrop.jsx'
import { FxProvider } from './lib/fx.jsx'
import { loadStats, recordBattle } from './lib/stats.js'
import './App.css'

export default function App() {
  return (
    <FxProvider>
      <AppShell />
    </FxProvider>
  )
}

function AppShell() {
  const [screen, setScreen] = useState('select')
  const [left, setLeft] = useState(null)
  const [right, setRight] = useState(null)
  const [stats, setStats] = useState(loadStats)
  const [metric, setMetric] = useState('mentions')

  const onBattleEnd = useCallback((result) => {
    setStats((current) =>
      recordBattle(current, {
        winnerId: result.winner.id,
        loserId: result.loser.id,
        winnerShare: result.winnerShare,
        leftId: result.winnerSide === 'left' ? result.winner.id : result.loser.id,
        rightId: result.winnerSide === 'right' ? result.winner.id : result.loser.id,
      }),
    )
  }, [])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [screen])

  return (
    <div className={`app-shell app-shell--${screen}`}>
      {screen === 'select' ? (
        <>
          <StageBackdrop mode="select" />
          <CharacterSelect
            left={left}
            right={right}
            stats={stats}
            onSelectLeft={setLeft}
            onSelectRight={setRight}
            onStart={(chosenMetric) => {
              setMetric(chosenMetric || 'mentions')
              setScreen('battle')
            }}
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
          }}
        />
      )}
    </div>
  )
}
