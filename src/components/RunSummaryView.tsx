import { useEffect, useState } from 'react'
import { useGameStore, computePlayerLevel } from '../stores/useGameStore'

export default function RunSummaryView() {
  const { runSummary, currentRunStats, playerXp, currentFloor, ironScrap, voidDust, resetRun } = useGameStore()

  const prevXp   = runSummary?.previousTotalXp ?? 0
  const xpGained = playerXp
  const levelUps = Math.floor((prevXp + xpGained) / 100) - Math.floor(prevXp / 100)
  const startFill = prevXp % 100
  const endFill   = (prevXp + xpGained) % 100
  const newLevel  = computePlayerLevel(prevXp + xpGained)

  const [barWidth, setBarWidth]       = useState(startFill)
  const [showLevelUp, setShowLevelUp] = useState(false)

  useEffect(() => {
    if (!runSummary?.active) return
    setBarWidth(startFill)
    setShowLevelUp(false)
    const t1 = setTimeout(() => setBarWidth(levelUps > 0 ? 100 : endFill), 300)
    const t2 = setTimeout(() => {
      if (levelUps > 0) { setShowLevelUp(true); setBarWidth(endFill) }
    }, 1400)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [runSummary?.active])

  if (!runSummary?.active) return null

  const isDead = runSummary.status === 'dead'

  return (
    <div className="fixed inset-0 z-50 bg-gray-950/[0.97] flex flex-col items-center justify-center p-6 gap-5">

      {/* Header */}
      <div className="text-center">
        <p className={`text-5xl font-black tracking-widest uppercase animate-pulse ${isDead ? 'text-red-500' : 'text-amber-400'}`}>
          {isDead ? '💀 YOU DIED' : '⚔ VICTORY'}
        </p>
        <p className="text-gray-500 text-sm mt-2 uppercase tracking-widest">Run Summary</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
        {[
          { label: 'Floors Cleared', value: String(Math.max(0, currentFloor - 1)) },
          { label: 'Monsters Slain', value: String(currentRunStats.monstersKilled) },
          { label: 'Gold Lost',      value: `${runSummary.goldAtDeath}g` },
        ].map(({ label, value }) => (
          <div key={label} className="bg-gray-900 border border-gray-700 rounded-xl p-3 text-center flex flex-col gap-1">
            <p className="text-[8px] text-gray-500 uppercase tracking-widest leading-tight">{label}</p>
            <p className="text-white font-bold text-xl">{value}</p>
          </div>
        ))}
      </div>

      {/* Resources Secured */}
      <div className="w-full max-w-xs rounded-xl border border-emerald-900/40 bg-emerald-900/10 px-4 py-3 flex flex-col gap-1.5">
        <p className="text-[10px] text-emerald-500/60 uppercase tracking-widest font-semibold">Resources Secured</p>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">⚙ Iron Scrap</span>
          <span className="text-emerald-300 font-bold">
            +{currentRunStats.ironScrapGathered}
            <span className="text-gray-600 font-normal text-xs"> ({ironScrap + currentRunStats.ironScrapGathered} total)</span>
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">✦ Void Dust</span>
          <span className="text-emerald-300 font-bold">
            +{currentRunStats.voidDustGathered}
            <span className="text-gray-600 font-normal text-xs"> ({voidDust + currentRunStats.voidDustGathered} total)</span>
          </span>
        </div>
      </div>

      {/* XP / Level progress */}
      <div className="w-full max-w-xs bg-gray-900 border border-gray-700 rounded-xl p-4 flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <p className="text-[10px] uppercase tracking-widest text-amber-400/60">XP Gained</p>
          <p className="text-amber-300 font-bold text-sm">+{xpGained} XP</p>
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-[10px] text-gray-500">
            <span>Lv {computePlayerLevel(prevXp)} Fighter</span>
            <span>Lv {newLevel} Fighter</span>
          </div>
          <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${barWidth}%` }}
            />
          </div>
          {showLevelUp && levelUps > 0 && (
            <p className="text-center text-amber-300 text-xs font-bold animate-pulse">
              ✨ {levelUps} Talent Point{levelUps > 1 ? 's' : ''} Earned!
            </p>
          )}
        </div>
      </div>

      {/* Return to Hub */}
      <button
        onClick={resetRun}
        className="w-full max-w-xs py-4 rounded-xl border-2 border-red-800 bg-red-900/20
                   text-red-300 text-base font-bold uppercase tracking-widest
                   hover:bg-red-900/40 active:bg-red-900/60 transition-colors"
      >
        Return to Hub
      </button>

    </div>
  )
}
