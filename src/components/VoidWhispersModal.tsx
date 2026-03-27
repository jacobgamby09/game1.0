import { BOONS } from '../data/constants'
import { useGameStore } from '../stores/useGameStore'

export default function VoidWhispersModal() {
  const selectBoon = useGameStore((s) => s.selectBoon)

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 p-6 gap-8">
      {/* Title */}
      <div className="flex flex-col items-center gap-2">
        <p className="text-xs font-bold tracking-[0.3em] uppercase text-violet-400 opacity-70">
          A new run begins
        </p>
        <h1 className="text-2xl font-black tracking-wide text-center text-fuchsia-300
                       drop-shadow-[0_0_16px_rgb(217_70_239)]">
          The Void whispers...
        </h1>
        <p className="text-sm text-gray-400 text-center">Choose your pact.</p>
      </div>

      {/* Boon cards */}
      <div className="flex flex-col gap-4 w-full max-w-sm">
        {BOONS.map((boon) => (
          <button
            key={boon.id}
            onClick={() => selectBoon(boon.id)}
            className="flex items-start gap-4 p-4 rounded-lg border border-gray-700
                       bg-gray-900 hover:bg-gray-800 hover:border-violet-500
                       hover:shadow-lg hover:shadow-violet-900/40
                       transition-all duration-150 text-left"
          >
            {boon.iconUrl ? (
              <img
                src={boon.iconUrl}
                alt={boon.name}
                className="w-12 h-12 rounded border border-gray-600 object-cover flex-shrink-0"
              />
            ) : boon.icon ? (
              <span className="text-2xl flex-shrink-0 mt-0.5">{boon.icon}</span>
            ) : null}
            <div className="flex flex-col gap-1">
              <span className="font-bold text-white tracking-wide">{boon.name}</span>
              <span className="text-sm text-gray-400">{boon.description}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
