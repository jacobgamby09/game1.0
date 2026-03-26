import { useGameStore } from '../stores/useGameStore'

export default function RunSummaryView() {
  const { runSummary, currentRunStats, currentFloor, ironScrap, voidDust, resetRun } = useGameStore()

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
