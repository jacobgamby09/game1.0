import type { Boon } from '../stores/useGameStore'

interface Props { boon: Boon; onClose: () => void }

export default function BoonDetailsModal({ boon, onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 border-2 border-gray-600 rounded-lg p-5 max-w-xs w-full flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          {boon.iconUrl && (
            <img
              src={boon.iconUrl}
              alt={boon.name}
              className="w-14 h-14 rounded-md border-2 border-gray-600 object-cover flex-shrink-0"
            />
          )}
          <div className="flex flex-col gap-1">
            <h2 className="font-bold text-fuchsia-400 text-lg tracking-wide">{boon.name}</h2>
            <p className="text-sm text-gray-300 leading-snug">{boon.description}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="self-center text-gray-400 border border-gray-600 rounded-md px-4 py-1.5 text-sm
                     hover:text-white hover:border-gray-400 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  )
}
