import { useGameStore } from '../stores/useGameStore'
import { BESTIARY_MASTER } from '../utils/storeHelpers'

export default function BestiaryView() {
  const { encounteredMobs, killCounters, setActiveView } = useGameStore()

  return (
    <div className="flex flex-col h-full w-full max-w-lg bg-gray-950">

      {/* Header */}
      <div className="flex items-center justify-between shrink-0 px-4 pt-4 pb-3">
        <button
          onClick={() => setActiveView('hub')}
          className="text-xs text-gray-400 hover:text-gray-200 uppercase tracking-widest transition-colors cursor-pointer"
        >
          ← Back
        </button>
        <p className="text-base font-bold text-amber-300 tracking-widest uppercase">Hunter's Journal</p>
        <span className="text-xs text-gray-500">
          {encounteredMobs.length}<span className="text-gray-700"> / {BESTIARY_MASTER.length}</span>
        </span>
      </div>

      {/* Subtitle */}
      <div className="px-4 pb-3">
        <p className="text-[11px] text-gray-500 leading-relaxed text-center">
          Discover monsters by fighting them in battle.
        </p>
      </div>

      {/* Divider */}
      <div className="shrink-0 mx-4 h-px bg-gray-800 mb-4" />

      {/* Grid */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-6">
        <div className="grid grid-cols-2 gap-3">
          {BESTIARY_MASTER.map(entry => {
            const discovered = encounteredMobs.includes(entry.id)

            if (!discovered) {
              return (
                <div
                  key={entry.id}
                  className="rounded-xl border border-gray-800 bg-gray-900 overflow-hidden flex flex-col"
                >
                  {/* Silhouette portrait */}
                  <div className="relative h-28 bg-gray-900 overflow-hidden">
                    <img
                      src={entry.portraitUrl}
                      alt="???"
                      className="w-full h-full object-cover"
                      style={{ filter: 'brightness(0)', opacity: 0.15 }}
                    />
                  </div>
                  {/* Locked info */}
                  <div className="p-3 flex flex-col gap-1">
                    <p className="text-sm font-bold text-gray-700 tracking-widest">???</p>
                    <p className="text-[10px] text-gray-800 uppercase tracking-wider">Undiscovered</p>
                  </div>
                </div>
              )
            }

            return (
              <div
                key={entry.id}
                className={`rounded-xl border overflow-hidden flex flex-col
                  ${entry.isBoss
                    ? 'border-amber-600/50 bg-amber-950/20'
                    : 'border-gray-700/60 bg-gray-900/80'
                  }`}
              >
                {/* Portrait */}
                <div className="relative h-28 overflow-hidden">
                  <img
                    src={entry.elitePortraitUrl ?? entry.portraitUrl}
                    alt={entry.name}
                    className="w-full h-full object-cover"
                  />
                  {/* Boss badge */}
                  {entry.isBoss && (
                    <span className="absolute top-1.5 right-1.5 text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-amber-900/80 text-amber-300 border border-amber-600/40">
                      BOSS
                    </span>
                  )}
                </div>

                {/* Details */}
                <div className="p-3 flex flex-col gap-2">
                  <p className={`text-sm font-bold leading-tight ${entry.isBoss ? 'text-amber-300' : 'text-gray-100'}`}>
                    {entry.name}
                  </p>

                  {/* Stat rows */}
                  <div className="flex flex-col gap-0.5">
                    <StatRow label="HP"        value={String(entry.maxHp)} />
                    <StatRow label="DMG"       value={String(entry.baseDamage)} />
                    <StatRow label="SPD"       value={`${entry.attackSpeed}/s`} />
                    <StatRow
                      label="DODGE"
                      value={entry.dodgeChance ? `${(entry.dodgeChance * 100).toFixed(0)}%` : '—'}
                    />
                  </div>

                  {/* Possible traits */}
                  {entry.possibleTraits && entry.possibleTraits.length > 0 && (
                    <div className="mt-1 flex flex-col gap-1.5 border-t border-gray-700/40 pt-2">
                      <p className="text-[9px] uppercase tracking-widest text-gray-600">Elite Traits</p>
                      {entry.possibleTraits.map(trait => (
                        <div key={trait.id} className="flex items-start gap-1.5">
                          <span className="text-sm leading-none mt-px">{trait.icon}</span>
                          <div>
                            <p className="text-[10px] font-semibold text-red-300/80">{trait.name}</p>
                            <p className="text-[9px] text-gray-500 leading-snug">{trait.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Kill counter */}
                  <div className="flex items-center justify-between border-t border-gray-700/30 pt-2 mt-1">
                    <span className="text-[9px] uppercase tracking-widest text-gray-600">Total Kills</span>
                    <span className="text-[11px] font-bold text-yellow-500/70">{killCounters[entry.id] ?? 0}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

    </div>
  )
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[9px] uppercase tracking-widest text-gray-600">{label}</span>
      <span className="text-[11px] font-semibold text-gray-300">{value}</span>
    </div>
  )
}
