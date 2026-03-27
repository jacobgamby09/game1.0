import { useGameStore } from '../stores/useGameStore'

// ─── Upgrade track ────────────────────────────────────────────────────────────

const UPGRADE_TRACK: { level: number; bonus: string }[] = [
  { level: 1, bonus: '+10% Heal Potion effectiveness' },
  { level: 2, bonus: '+1s Glacial Flask duration' },
  { level: 3, bonus: "+1s Berserker's Brew duration" },
  { level: 4, bonus: "+1 Vampire's Draught charge" },
  { level: 5, bonus: 'Midas Elixir grants 4× Gold (up from 3×)' },
  { level: 6, bonus: '+1 Potion Belt slot' },
  { level: 7, bonus: '— Future upgrade —' },
  { level: 8, bonus: '— Future upgrade —' },
]

// ─── ApothecaryView ───────────────────────────────────────────────────────────

export default function ApothecaryView() {
  const { ironScrap, buildings, upgradeBuilding, setActiveView } = useGameStore()

  const level     = buildings.apothecary
  const isMaxed   = level >= 8
  const nextLevel = level + 1
  const cost      = isMaxed ? 0 : nextLevel * 15
  const canAfford = !isMaxed && ironScrap >= cost

  return (
    <div
      className="flex flex-col h-full w-full max-w-lg"
      style={{ backgroundImage: 'url(/images/apothecary.webp)', backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/70 pointer-events-none" />

      {/* Content */}
      <div className="relative flex flex-col h-full w-full max-w-lg">

        {/* Header */}
        <div className="flex items-center justify-between shrink-0 px-4 pt-4 pb-3">
          <button
            onClick={() => setActiveView('hub')}
            className="text-xs text-gray-400 hover:text-gray-200 uppercase tracking-widest transition-colors cursor-pointer"
          >
            ← Back
          </button>
          <p className="text-base font-bold text-fuchsia-300 tracking-widest uppercase">The Apothecary</p>
          <span className="text-sm font-semibold text-gray-300">⚙ <span className="text-white">{ironScrap}</span></span>
        </div>

        {/* Hero image with level badge */}
        <div className="shrink-0 mx-4 mb-3 relative rounded-xl overflow-hidden h-36">
          <img
            src="/images/apothecary.webp"
            alt="Apothecary"
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent flex items-end p-3">
            <p className="text-sm font-bold text-white drop-shadow">
              {isMaxed
                ? 'Level 8 — Fully Upgraded'
                : `Level ${level} — Upgrade to unlock new effects`}
            </p>
          </div>
        </div>

        {/* Upgrade track */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4 flex flex-col gap-2">
          {UPGRADE_TRACK.map(({ level: tier, bonus }) => {
            const isUnlocked = level >= tier
            const isCurrent  = level === tier
            const isFuture   = tier > level
            return (
              <div
                key={tier}
                className={`rounded-lg px-3 py-2 flex items-center gap-3 border transition-all
                  ${isCurrent  ? 'border-fuchsia-600/60 bg-fuchsia-950/30 ring-1 ring-fuchsia-500/20' : ''}
                  ${isUnlocked && !isCurrent ? 'border-gray-700 bg-gray-800/40' : ''}
                  ${isFuture   ? 'border-gray-800 bg-gray-900/20 opacity-40' : ''}
                `}
              >
                {/* Level badge */}
                <span className={`text-[10px] font-bold uppercase tracking-widest shrink-0 w-14 text-center
                  rounded px-1.5 py-0.5
                  ${isUnlocked ? 'bg-fuchsia-900/50 text-fuchsia-300' : 'bg-gray-800 text-gray-600'}`}
                >
                  Lv {tier}
                </span>

                {/* Bonus text */}
                <p className={`text-xs font-semibold flex-1
                  ${isUnlocked ? 'text-gray-200' : 'text-gray-600'}`}
                >
                  {bonus}
                </p>

                {/* Active marker */}
                {isCurrent && (
                  <span className="text-[9px] font-bold uppercase tracking-widest text-fuchsia-400/60 shrink-0">
                    Active
                  </span>
                )}
                {isUnlocked && !isCurrent && (
                  <span className="text-[9px] font-bold uppercase tracking-widest text-green-600/60 shrink-0">
                    ✓
                  </span>
                )}
              </div>
            )
          })}

          {/* Upgrade button */}
          <div className="mt-2">
            {isMaxed ? (
              <div className="w-full py-2 rounded-lg border border-fuchsia-600/40 bg-fuchsia-900/10 text-center">
                <p className="text-xs font-bold text-fuchsia-400 uppercase tracking-widest">Fully Upgraded</p>
              </div>
            ) : (
              <button
                onClick={() => upgradeBuilding('apothecary')}
                disabled={!canAfford}
                className={`w-full py-2.5 rounded-lg border text-xs font-bold uppercase tracking-wider transition-colors
                  ${canAfford
                    ? 'border-fuchsia-500 bg-fuchsia-500/10 text-fuchsia-300 hover:bg-fuchsia-500/20 cursor-pointer'
                    : 'border-gray-700 bg-gray-800/50 text-gray-600 cursor-default'
                  }`}
              >
                Upgrade to Level {nextLevel} — {cost} ⚙ Iron Scrap
                {!canAfford && <span className="text-red-900/70 ml-1">(need {cost - ironScrap} more)</span>}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
