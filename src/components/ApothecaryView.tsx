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
  const levelText = isMaxed
    ? 'Level 8 — Fully Upgraded'
    : `Level ${level} — Upgrade to unlock new effects`

  return (
    <div className="flex flex-col h-full w-full max-w-lg bg-gray-950">

      {/* Hero header — image fades into solid bg-gray-950 */}
      <div className="relative shrink-0 h-52 w-full overflow-hidden">
        <img
          src="/images/apothecary.webp"
          alt="Apothecary"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/70 to-transparent" />

        {/* Nav row */}
        <div className="absolute inset-x-0 top-0 flex items-center justify-between px-4 pt-4">
          <button
            onClick={() => setActiveView('hub')}
            className="text-xs text-gray-400 hover:text-gray-200 uppercase tracking-widest transition-colors cursor-pointer"
          >
            ← Back
          </button>
          <p className="text-base font-bold text-fuchsia-300 tracking-widest uppercase">The Apothecary</p>
          <span className="text-sm font-semibold text-gray-300">⚙ <span className="text-white">{ironScrap}</span></span>
        </div>

        {/* Level text */}
        <div className="absolute inset-x-0 bottom-0 px-4 pb-3">
          <p className="text-sm font-bold text-white drop-shadow">{levelText}</p>
        </div>
      </div>

      {/* Solid content area */}
      <div className="flex-1 min-h-0 overflow-y-auto bg-gray-950 px-4 pb-4 flex flex-col gap-2">

        {UPGRADE_TRACK.map(({ level: tier, bonus }) => {
          const isUnlocked = level >= tier
          const isCurrent  = level === tier
          const isFuture   = tier > level
          return (
            <div
              key={tier}
              className={`rounded-lg px-3 py-2.5 flex items-center gap-3 border
                ${isCurrent  ? 'bg-gray-900 border-fuchsia-600/60 ring-1 ring-fuchsia-500/20' : ''}
                ${isUnlocked && !isCurrent ? 'bg-gray-900 border-gray-700' : ''}
                ${isFuture   ? 'bg-gray-900/60 border-gray-800 opacity-50' : ''}
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
                ${isUnlocked ? 'text-gray-300' : 'text-gray-600'}`}
              >
                {bonus}
              </p>

              {/* State marker */}
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
  )
}
