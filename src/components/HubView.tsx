import { Hammer } from 'lucide-react'
import { useGameStore } from '../stores/useGameStore'

// ─── Town buildings ───────────────────────────────────────────────────────────

const TOWN_BUILDINGS: { id: string; name: string; img: string; view: string; desc: string }[] = [
  { id: 'apothecary', name: 'The Apothecary', img: '/images/apothecary.webp',    view: 'apothecary', desc: 'Brew powerful potions and unlock new alchemical secrets.' },
  { id: 'blacksmith', name: 'The Blacksmith',  img: '/images/blacksmith.webp',    view: 'blacksmith', desc: 'Forge permanent upgrades for your equipment slots.' },
  { id: 'voidRift',   name: 'The Void Rift',   img: '/images/the-void-rift.webp', view: 'voidRift',   desc: 'Tap into unstable void energies to mutate your gear.' },
  { id: 'tavern',     name: 'The Tavern',       img: '/images/tavern.webp',        view: 'tavern',     desc: 'Recruit new classes and change your playstyle.' },
  { id: 'bestiary',  name: "Hunter's Journal", img: '/images/bestiary.webp',      view: 'bestiary',   desc: 'Track every monster you have faced in battle.' },
]

// ─── HubView ──────────────────────────────────────────────────────────────────

export default function HubView() {
  const {
    ironScrap, voidDust,
    generateMap, hardResetGame, setActiveView,
  } = useGameStore()

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
                     hover:bg-amber-500/20 active:bg-amber-500/30 transition-colors cursor-pointer"
        >
          ⚔ Enter Dungeon
        </button>

        {/* Building banners */}
        {TOWN_BUILDINGS.map(b => (
          <button
            key={b.id}
            onClick={() => setActiveView(b.view as Parameters<typeof setActiveView>[0])}
            style={{ backgroundImage: `url(${b.img})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
            className="relative w-full h-32 rounded-xl overflow-hidden border-2 border-amber-600 cursor-pointer
                       transition-all shrink-0 text-left hover:ring-2 hover:ring-fuchsia-500/50 hover:-translate-y-1"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent flex items-end p-3">
              <p className="text-sm font-bold text-white drop-shadow">{b.name}</p>
            </div>
          </button>
        ))}

      </div>

      {/* Bottom bar: Oblivion + DEV button */}
      <div className="shrink-0 py-2 flex items-center justify-center gap-4">
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
        <span className="text-gray-800 text-[10px]">·</span>
        <button
          onClick={() => useGameStore.setState(s => ({ ironScrap: s.ironScrap + 1000, voidDust: s.voidDust + 1000 }))}
          className="text-[10px] text-yellow-600/50 hover:text-yellow-400 uppercase tracking-widest transition-colors cursor-pointer"
        >
          [DEV] +1000
        </button>
      </div>

    </div>
  )
}
