import { useGameStore } from '../stores/useGameStore'

// ─── Upgrade definitions ──────────────────────────────────────────────────────

interface VoidUpgrade {
  id:          string
  name:        string
  description: string
  cost:        number
  purchased:   (upgrades: ReturnType<typeof useGameStore.getState>['upgrades']) => boolean
  canPurchase: (upgrades: ReturnType<typeof useGameStore.getState>['upgrades']) => boolean
  action:      () => void
}

// ─── VoidRiftView ─────────────────────────────────────────────────────────────

export default function VoidRiftView() {
  const { voidDust, upgrades, setActiveView, purchaseVoidRiftMutation } = useGameStore()

  const UPGRADES: VoidUpgrade[] = [
    {
      id:          'anomaly',
      name:        'The Anomaly',
      description: 'Common, Uncommon, and Rare items have a 25% chance to mutate with tactical variants — each carrying trade-off modifiers like Heavy, Swift, Reckless, or Gilded.',
      cost:        25,
      purchased:   (u) => u.voidRiftMutations,
      canPurchase: (u) => !u.voidRiftMutations && voidDust >= 25,
      action:      purchaseVoidRiftMutation,
    },
  ]

  return (
    <div
      className="flex flex-col h-full w-full max-w-lg"
      style={{ backgroundImage: 'url(/images/the-void-rift.webp)', backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/75 pointer-events-none" />

      {/* Content */}
      <div className="relative flex flex-col h-full w-full max-w-lg">

        {/* Header */}
        <div className="flex items-center justify-between shrink-0 px-4 pt-4 pb-3">
          <button
            onClick={() => setActiveView('hub')}
            className="text-xs text-gray-400 hover:text-gray-200 uppercase tracking-widest transition-colors cursor-pointer"
          >
            ← Back
          </button>
          <p className="text-base font-bold text-purple-300 tracking-widest uppercase">The Void Rift</p>
          <span className="text-sm font-semibold text-purple-300">✦ <span className="text-white">{voidDust}</span></span>
        </div>

        {/* Subtitle */}
        <div className="px-4 pb-3">
          <p className="text-[11px] text-purple-400/60 leading-relaxed text-center">
            Channel unstable void energies into permanent enhancements.
          </p>
        </div>

        {/* Divider */}
        <div className="shrink-0 mx-4 h-px bg-purple-700/30 mb-3" />

        {/* Upgrades list */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-6 flex flex-col gap-3">
          {UPGRADES.map(u => {
            const isPurchased  = u.purchased(upgrades)
            const canAfford    = u.canPurchase(upgrades)
            const shortfall    = u.cost - voidDust

            return (
              <div
                key={u.id}
                className={`rounded-xl border p-4 flex flex-col gap-3 transition-colors
                  ${isPurchased
                    ? 'border-purple-500/40 bg-purple-900/20'
                    : 'border-gray-700/60 bg-black/40'
                  }`}
              >
                {/* Title row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-0.5">
                    <p className="text-sm font-bold text-gray-100">{u.name}</p>
                    <p className="text-[11px] text-gray-400 leading-relaxed">{u.description}</p>
                  </div>
                  {isPurchased && (
                    <span className="shrink-0 text-[10px] font-bold uppercase tracking-widest text-purple-400 border border-purple-500/40 rounded px-1.5 py-0.5">
                      Unlocked
                    </span>
                  )}
                </div>

                {/* Variant preview chips */}
                {u.id === 'anomaly' && (
                  <div className="flex flex-wrap gap-1">
                    {['Heavy', 'Swift', 'Reckless', 'Reinforced', 'Vital', 'Lightweight', 'Gilded', 'Dull'].map(v => (
                      <span key={v} className="text-[9px] font-bold px-1.5 py-0.5 rounded border border-purple-600/30 bg-purple-900/30 text-purple-300/70">
                        {v}
                      </span>
                    ))}
                  </div>
                )}

                {/* Purchase button */}
                {!isPurchased && (
                  <button
                    onClick={u.action}
                    disabled={!canAfford}
                    className={`w-full py-2.5 rounded-lg border text-xs font-bold uppercase tracking-wider transition-colors
                      ${canAfford
                        ? 'border-purple-500 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 cursor-pointer'
                        : 'border-gray-700 bg-gray-800/50 text-gray-600 cursor-default'
                      }`}
                  >
                    Unlock — {u.cost} ✦ Void Dust
                    {!canAfford && (
                      <span className="text-red-900/70 ml-1">(need {shortfall} more)</span>
                    )}
                  </button>
                )}
              </div>
            )
          })}
        </div>

      </div>
    </div>
  )
}
