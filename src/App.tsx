import { useGameStore } from './stores/useGameStore'
import NavBar from './components/NavBar'
import CombatView from './components/CombatView'
import InventoryView from './components/InventoryView'
import HubView from './components/HubView'
import BlacksmithView from './components/BlacksmithView'
import ApothecaryView from './components/ApothecaryView'
import TalentTreeView from './components/TalentTreeView'
import RunSummaryView from './components/RunSummaryView'
import VoidRiftView from './components/VoidRiftView'
import BestiaryView from './components/BestiaryView'

const views = {
  battle:      <CombatView />,
  inventory:   <InventoryView />,
  hub:         <HubView />,
  blacksmith:  <BlacksmithView />,
  apothecary:  <ApothecaryView />,
  talents:     <TalentTreeView />,
  voidRift:    <VoidRiftView />,
  bestiary:    <BestiaryView />,
}

export default function App() {
  const activeView = useGameStore((s) => s.activeView)

  return (
    <div className="flex flex-col h-[100dvh] bg-gray-950 text-white overflow-hidden">
      <main className="flex-1 overflow-y-auto flex flex-col items-center w-full pt-[env(safe-area-inset-top,0px)]">
        {views[activeView]}
      </main>
      <NavBar />
      <RunSummaryView />
    </div>
  )
}
