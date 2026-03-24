import { useGameStore } from './stores/useGameStore'
import NavBar from './components/NavBar'
import CombatView from './components/CombatView'
import InventoryView from './components/InventoryView'
import HubView from './components/HubView'
import RunSummaryView from './components/RunSummaryView'

const views = {
  battle:    <CombatView />,
  inventory: <InventoryView />,
  hub:       <HubView />,
}

export default function App() {
  const activeView = useGameStore((s) => s.activeView)

  return (
    <div className="flex flex-col h-[100dvh] bg-gray-950 text-white overflow-hidden">
      <main className="flex-1 overflow-y-auto pt-[env(safe-area-inset-top,0px)]">
        {views[activeView]}
      </main>
      <NavBar />
      <RunSummaryView />
    </div>
  )
}
