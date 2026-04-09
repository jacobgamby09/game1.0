import { useState } from 'react'
import { useGameStore } from '../stores/useGameStore'
import { BESTIARY_MASTER, type BestiaryEntry } from '../utils/storeHelpers'

export default function BestiaryView() {
  const { encounteredMobs, killCounters, setActiveView } = useGameStore()
  const [selected, setSelected] = useState<BestiaryEntry | null>(null)

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
        <div className="grid grid-cols-3 gap-3">
          {BESTIARY_MASTER.map(entry => {
            const discovered = encounteredMobs.includes(entry.id)

            if (!discovered) {
              return (
                <div
                  key={entry.id}
                  className="rounded-xl border border-gray-800 bg-gray-900 overflow-hidden flex flex-col"
                >
                  <div className="relative aspect-square bg-gray-900 overflow-hidden">
                    <img
                      src={entry.portraitUrl}
                      alt="???"
                      className="w-full h-full object-cover"
                      style={{ filter: 'brightness(0)', opacity: 0.12 }}
                    />
                  </div>
                  <div className="px-2 py-2">
                    <p className="text-xs font-bold text-gray-700 tracking-widest text-center">???</p>
                  </div>
                </div>
              )
            }

            return (
              <button
                key={entry.id}
                onClick={() => setSelected(entry)}
                className={`rounded-xl border overflow-hidden flex flex-col text-left transition-all duration-150
                  hover:scale-[1.03] hover:brightness-110 active:scale-[0.98]
                  ${entry.isBoss
                    ? 'border-amber-600/50 bg-amber-950/20 hover:ring-1 hover:ring-amber-500/40'
                    : entry.isElite
                      ? 'border-red-700/50 bg-red-950/20 hover:ring-1 hover:ring-red-500/40'
                      : 'border-gray-700/60 bg-gray-900/80 hover:ring-1 hover:ring-gray-500/40'
                  }`}
              >
                <div className="relative aspect-square overflow-hidden">
                  <img
                    src={entry.portraitUrl}
                    alt={entry.name}
                    className="w-full h-full object-cover"
                  />
                  {entry.isBoss && (
                    <span className="absolute top-1 right-1 text-[8px] font-bold uppercase tracking-widest px-1 py-0.5 rounded bg-amber-900/90 text-amber-300 border border-amber-600/40">
                      BOSS
                    </span>
                  )}
                  {entry.isElite && (
                    <span className="absolute top-1 right-1 text-[8px] font-bold uppercase tracking-widest px-1 py-0.5 rounded bg-red-900/90 text-red-300 border border-red-700/40">
                      ELITE
                    </span>
                  )}
                </div>
                <div className="px-2 py-2">
                  <p className={`text-[11px] font-bold leading-tight text-center truncate
                    ${entry.isBoss ? 'text-amber-300' : entry.isElite ? 'text-red-300' : 'text-gray-200'}`}>
                    {entry.name}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Detail Modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 px-4 pb-4 sm:pb-0"
          onClick={() => setSelected(null)}
        >
          <div
            className={`relative w-full max-w-sm bg-gray-900 rounded-2xl overflow-hidden max-h-[90vh] flex flex-col border
              ${selected.isBoss ? 'border-amber-700/50' : selected.isElite ? 'border-red-700/50' : 'border-gray-700/60'}`}
            onClick={e => e.stopPropagation()}
          >
            {/* Portrait — uncropped, object-contain */}
            <div className={`relative bg-gray-950 flex items-center justify-center border-b
              ${selected.isBoss ? 'border-amber-700/40' : selected.isElite ? 'border-red-800/40' : 'border-gray-800'}`}
              style={{ maxHeight: '240px', minHeight: '180px' }}
            >
              <img
                src={selected.portraitUrl}
                alt={selected.name}
                className="w-full object-contain"
                style={{ maxHeight: '240px' }}
              />
              {selected.isBoss && (
                <span className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded bg-amber-900/90 text-amber-300 border border-amber-600/40">
                  BOSS
                </span>
              )}
              {selected.isElite && (
                <span className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded bg-red-900/90 text-red-300 border border-red-700/40">
                  ELITE
                </span>
              )}
              <button
                onClick={() => setSelected(null)}
                className="absolute top-3 left-3 text-[10px] text-gray-400 hover:text-white uppercase tracking-widest bg-black/60 px-2 py-1 rounded cursor-pointer transition-colors"
              >
                ✕ Close
              </button>
            </div>

            {/* Scrollable content */}
            <div className="overflow-y-auto flex-1 px-5 py-4 flex flex-col gap-4">

              {/* Name + kills */}
              <div className="flex items-start justify-between gap-3">
                <h2 className={`text-xl font-bold leading-tight ${selected.isBoss ? 'text-amber-300' : selected.isElite ? 'text-red-300' : 'text-white'}`}>
                  {selected.name}
                </h2>
                <div className="shrink-0 text-right">
                  <p className="text-[9px] uppercase tracking-widest text-gray-600">Total Kills</p>
                  <p className="text-lg font-bold text-yellow-500">{killCounters[selected.id] ?? 0}</p>
                </div>
              </div>

              {/* Stats */}
              <div className="flex flex-col gap-0 rounded-xl border border-gray-800 overflow-hidden">
                <StatRow label="Max HP"       value={String(selected.maxHp)} />
                <StatRow label="Base Damage"  value={String(selected.baseDamage)} border />
                <StatRow label="Attack Speed" value={`${selected.attackSpeed}/s`} border />
                <StatRow
                  label="Dodge Chance"
                  value={selected.dodgeChance ? `${(selected.dodgeChance * 100).toFixed(0)}%` : '—'}
                  border
                />
              </div>

              {/* Traits */}
              {selected.traits && selected.traits.length > 0 && (
                <div className="flex flex-col gap-2">
                  <p className="text-[10px] uppercase tracking-widest text-gray-600">Traits</p>
                  {selected.traits.map(trait => (
                    <div key={trait.id} className="flex items-start gap-3 bg-gray-800/50 rounded-xl px-3 py-3 border border-gray-700/40">
                      <span className="text-xl leading-none mt-0.5">{trait.icon}</span>
                      <div className="flex flex-col gap-0.5">
                        <p className="text-sm font-bold text-red-300/90">{trait.name}</p>
                        <p className="text-xs text-gray-400 leading-snug">{trait.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  )
}

function StatRow({ label, value, border }: { label: string; value: string; border?: boolean }) {
  return (
    <div className={`flex items-center justify-between px-4 py-2.5 ${border ? 'border-t border-gray-800' : ''}`}>
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-sm font-semibold text-gray-200">{value}</span>
    </div>
  )
}
