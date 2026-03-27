import { useState } from 'react'
import { Hammer } from 'lucide-react'
import {
  useGameStore,
  type BuildingId,
} from '../stores/useGameStore'

// ─── Town buildings ───────────────────────────────────────────────────────────

const TOWN_BUILDINGS: { id: BuildingId; name: string; img: string; cost: number; desc: string }[] = [
  { id: 'apothecary', name: 'The Apothecary', img: '/images/apothecary.webp', cost: 10, desc: 'Brew powerful potions and unlock new alchemical secrets.' },
  { id: 'blacksmith', name: 'The Blacksmith',  img: '/images/blacksmith.webp',  cost: 10, desc: 'Forge permanent upgrades for your equipment slots.' },
  { id: 'tavern',     name: 'The Tavern',      img: '/images/tavern.webp',      cost: 10, desc: 'Recruit new classes and change your playstyle.' },
]

// ─── HubView ──────────────────────────────────────────────────────────────────

export default function HubView() {
  const {
    ironScrap, voidDust, buildings,
    constructBuilding, generateMap, hardResetGame, setActiveView,
  } = useGameStore()

  const [selectedBuildingId, setSelectedBuildingId] = useState<BuildingId | null>(null)

  return (
    <div className="flex flex-col h-full w-full max-w-lg">

      {/* Header */}
      <div className="text-center shrink-0 pt-4 pb-3 px-4">
        <p className="text-[10px] text-amber-400/40 uppercase tracking-widest mb-0.5">Base Camp</p>
        <h1 className="text-2xl font-bold tracking-widest uppercase text-white">The HUB</h1>
        <div className="flex items-center justify-center gap-3 mt-2">
          <div className="flex flex-col items-center gap-0.5 border border-amber-500/30 bg-amber-500/5 rounded-lg px-3 py-1.5 min-w-[72px]">
            <span className="text-[9px] font-bold uppercase tracking-widest text-amber-500/60">Iron Scrap</span>
            <span className="text-base font-bold text-amber-300 font-mono flex items-center gap-1"><Hammer size={14} /> {ironScrap}</span>
          </div>
          <div className="flex flex-col items-center gap-0.5 border border-purple-500/30 bg-purple-500/5 rounded-lg px-3 py-1.5 min-w-[72px]">
            <span className="text-[9px] font-bold uppercase tracking-widest text-purple-400/60">Void Dust</span>
            <span className="text-base font-bold text-purple-300 font-mono">✦ {voidDust}</span>
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 min-h-0 overflow-y-auto bg-gray-900 border-t border-gray-800 rounded-t-2xl px-4 py-4 flex flex-col gap-3">

        {/* Enter Dungeon */}
        <button
          onClick={generateMap}
          className="w-full py-4 rounded-xl border-2 border-amber-500 bg-amber-500/10
                     text-amber-300 text-base font-bold uppercase tracking-widest shrink-0
                     hover:bg-amber-500/20 active:bg-amber-500/30 transition-colors"
        >
          ⚔ Enter Dungeon
        </button>

        {/* Building banners */}
        {TOWN_BUILDINGS.map(b => {
          const lvl        = buildings[b.id]
          const isRuin     = lvl === 0
          const isSelected = selectedBuildingId === b.id
          return (
            <button
              key={b.id}
              onClick={() => setSelectedBuildingId(isSelected ? null : b.id)}
              style={{ backgroundImage: `url(${b.img})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
              className={`relative w-full h-32 rounded-xl overflow-hidden border-2 cursor-pointer transition-all shrink-0 text-left
                ${isRuin ? 'border-gray-700 grayscale brightness-[0.4]' : 'border-amber-600'}
                ${isSelected ? 'ring-2 ring-white/30' : 'hover:brightness-110'}`}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent flex items-end p-3">
                <p className="text-sm font-bold text-white drop-shadow">
                  {isRuin ? `Ruined — ${b.name}` : b.name}
                </p>
              </div>
            </button>
          )
        })}

        {/* Building inspect panel */}
        {selectedBuildingId && (() => {
          const b         = TOWN_BUILDINGS.find(x => x.id === selectedBuildingId)!
          const lvl       = buildings[selectedBuildingId]
          const canAfford = ironScrap >= b.cost
          return (
            <div className="rounded-xl border border-gray-700 bg-gray-800/60 p-4 flex flex-col gap-3">
              <div>
                <p className="text-sm font-bold text-gray-200">{b.name}</p>
                <p className="text-xs text-gray-400 leading-relaxed mt-1">{b.desc}</p>
              </div>
              {lvl === 0 ? (
                <>
                  <div className="flex items-center justify-between text-[11px] text-gray-500">
                    <span>Status</span>
                    <span className="text-gray-600 font-bold">Ruined</span>
                  </div>
                  <button
                    onClick={() => constructBuilding(selectedBuildingId)}
                    disabled={!canAfford}
                    className={`w-full py-2 rounded-lg border text-xs font-bold uppercase tracking-wider transition-colors
                      ${canAfford
                        ? 'border-amber-500 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 cursor-pointer'
                        : 'border-gray-700 bg-gray-800 text-gray-600 cursor-default'
                      }`}
                  >
                    Rebuild — {b.cost} ⚙ Iron Scrap
                    {!canAfford && <span className="text-red-900/80 ml-1">(need {b.cost - ironScrap} more)</span>}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    if (b.id === 'blacksmith') setActiveView('blacksmith')
                    else if (b.id === 'apothecary') setActiveView('apothecary')
                  }}
                  className="w-full py-2 rounded-lg border border-amber-500 bg-amber-500/10
                             text-amber-300 text-xs font-bold uppercase tracking-wider
                             hover:bg-amber-500/20 cursor-pointer transition-colors"
                >
                  Enter {b.name}
                </button>
              )}
            </div>
          )
        })()}

      </div>

      {/* Oblivion — subtle text link */}
      <div className="shrink-0 py-2 text-center">
        <button
          onClick={() => {
            if (window.confirm('WARNING: This will permanently delete your save file, including all Buildings and Upgrades. Are you sure?')) {
              hardResetGame()
            }
          }}
          className="text-[10px] text-red-900/50 hover:text-red-700 uppercase tracking-widest transition-colors cursor-pointer"
        >
          Oblivion · Wipe Save
        </button>
      </div>

    </div>
  )
}
