import { Swords, Package, Shield } from 'lucide-react'
import { useGameStore, type View } from '../stores/useGameStore'

const tabs: { view: View; label: string; Icon: React.ElementType }[] = [
  { view: 'battle',    label: 'Battle',    Icon: Swords  },
  { view: 'inventory', label: 'Inventory', Icon: Package },
  { view: 'hub',       label: 'Hub',       Icon: Shield  },
]

export default function NavBar() {
  const { activeView, setActiveView } = useGameStore()

  return (
    <nav className="bg-gray-900 border-t border-gray-800 flex items-stretch h-16 shrink-0">
      {tabs.map(({ view, label, Icon }) => {
        const isActive = activeView === view
        return (
          <button
            key={view}
            onClick={() => setActiveView(view)}
            className={`flex flex-col items-center justify-center flex-1 gap-1 text-xs font-semibold tracking-widest uppercase transition-colors
              ${isActive
                ? 'text-amber-400 border-t-2 border-amber-400 -mt-px'
                : 'text-gray-500 hover:text-gray-300 border-t-2 border-transparent -mt-px'
              }`}
          >
            <Icon size={20} />
            {label}
          </button>
        )
      })}
    </nav>
  )
}
