import { Package } from 'lucide-react'

export default function InventoryView() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 p-6">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-10 flex flex-col items-center gap-4 w-full max-w-2xl">
        <Package className="text-amber-400" size={48} />
        <h1 className="text-3xl font-bold tracking-widest uppercase text-white">
          Inventory
        </h1>
        <p className="text-gray-500 text-sm">Gear &amp; items coming soon…</p>
      </div>
    </div>
  )
}
