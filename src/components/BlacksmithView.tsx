import { useState } from 'react'
import { Crown, Shirt, Layers, Swords, Shield, Award, Circle } from 'lucide-react'
import {
  useGameStore,
  SLOT_TIER_COLORS,
  SLOT_TIER_BONUSES,
  SLOT_UPGRADE_COSTS,
  type EquipmentSlotName,
  type SlotRarityLevel,
} from '../stores/useGameStore'

// ─── Slot config ──────────────────────────────────────────────────────────────

const SLOT_META: { key: EquipmentSlotName; label: string; Icon: React.ElementType }[] = [
  { key: 'head',     label: 'Head',      Icon: Crown   },
  { key: 'chest',    label: 'Chest',     Icon: Shirt   },
  { key: 'legs',     label: 'Legs',      Icon: Layers  },
  { key: 'mainHand', label: 'Main Hand', Icon: Swords  },
  { key: 'offHand',  label: 'Off Hand',  Icon: Shield  },
  { key: 'amulet',   label: 'Amulet',    Icon: Award   },
  { key: 'ring1',    label: 'Ring 1',    Icon: Circle  },
  { key: 'ring2',    label: 'Ring 2',    Icon: Circle  },
]

// ─── Stat label helpers ───────────────────────────────────────────────────────

function formatBonus(key: string, val: number): string {
  if (key === 'attackSpeed')    return `+${val.toFixed(2)} Atk Speed`
  if (key === 'critChance')     return `+${(val * 100).toFixed(0)}% Crit`
  if (key === 'dodgeChance')    return `+${(val * 100).toFixed(0)}% Dodge`
  if (key === 'damageReduction') return `+${val} DR`
  if (key === 'lifesteal')      return `+${val} Lifesteal`
  if (key === 'damage')         return `+${val} Damage`
  if (key === 'hp')             return `+${val} Max HP`
  return `+${val} ${key}`
}

const STAT_COLOR: Record<string, string> = {
  hp:              'text-green-400',
  damage:          'text-red-400',
  attackSpeed:     'text-blue-400',
  damageReduction: 'text-orange-400',
  critChance:      'text-yellow-400',
  dodgeChance:     'text-cyan-400',
  lifesteal:       'text-emerald-400',
}

// ─── SlotSquare ───────────────────────────────────────────────────────────────

interface SlotSquareProps {
  slotKey: EquipmentSlotName
  label: string
  Icon: React.ElementType
  tier: SlotRarityLevel
  isSelected: boolean
  onSelect: (key: EquipmentSlotName) => void
}

function SlotSquare({ slotKey, label, Icon, tier, isSelected, onSelect }: SlotSquareProps) {
  const tierColors = SLOT_TIER_COLORS[tier]
  return (
    <button
      onClick={() => onSelect(slotKey)}
      className={`w-14 h-14 rounded-lg border-2 flex flex-col items-center justify-center gap-0.5 transition-all duration-150 cursor-pointer
        bg-gray-900/80 ${tierColors.border}
        ${isSelected ? 'ring-2 ring-white/30' : 'hover:brightness-125'}`}
    >
      <Icon size={20} className={tierColors.text} />
      <span className={`text-[9px] font-bold leading-none ${tierColors.text}`}>{label}</span>
    </button>
  )
}

// ─── BlacksmithView ───────────────────────────────────────────────────────────

export default function BlacksmithView() {
  const { ironScrap, slotUpgrades, upgradeEquipmentSlot, setActiveView } = useGameStore()

  const [selectedSlot, setSelectedSlot] = useState<EquipmentSlotName | null>(null)

  return (
    <div
      className="flex flex-col h-full w-full max-w-lg"
      style={{ backgroundImage: 'url(/images/blacksmith.webp)', backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/70 pointer-events-none" />

      {/* Content (above overlay) */}
      <div className="relative flex flex-col h-full w-full max-w-lg">

        {/* Header */}
        <div className="flex items-center justify-between shrink-0 px-4 pt-4 pb-3">
          <button
            onClick={() => setActiveView('hub')}
            className="text-xs text-gray-400 hover:text-gray-200 uppercase tracking-widest transition-colors cursor-pointer"
          >
            ← Back
          </button>
          <p className="text-base font-bold text-amber-300 tracking-widest uppercase">The Blacksmith</p>
          <span className="text-sm font-semibold text-gray-300">⚙ <span className="text-white">{ironScrap}</span></span>
        </div>

        {/* Paper doll */}
        <div className="shrink-0 flex flex-col items-center gap-2 py-2">
          {/* Head */}
          <div className="flex justify-center">
            {SLOT_META.filter(s => s.key === 'head').map(s => (
              <SlotSquare key={s.key} slotKey={s.key} label={s.label} Icon={s.Icon}
                tier={slotUpgrades[s.key]} isSelected={selectedSlot === s.key} onSelect={setSelectedSlot} />
            ))}
          </div>
          {/* MH / Chest / OH */}
          <div className="flex items-center gap-2">
            {(['mainHand', 'chest', 'offHand'] as EquipmentSlotName[]).map(key => {
              const meta = SLOT_META.find(s => s.key === key)!
              return <SlotSquare key={key} slotKey={key} label={meta.label} Icon={meta.Icon}
                tier={slotUpgrades[key]} isSelected={selectedSlot === key} onSelect={setSelectedSlot} />
            })}
          </div>
          {/* Amulet */}
          <div className="flex justify-center">
            {SLOT_META.filter(s => s.key === 'amulet').map(s => (
              <SlotSquare key={s.key} slotKey={s.key} label={s.label} Icon={s.Icon}
                tier={slotUpgrades[s.key]} isSelected={selectedSlot === s.key} onSelect={setSelectedSlot} />
            ))}
          </div>
          {/* Legs */}
          <div className="flex justify-center">
            {SLOT_META.filter(s => s.key === 'legs').map(s => (
              <SlotSquare key={s.key} slotKey={s.key} label={s.label} Icon={s.Icon}
                tier={slotUpgrades[s.key]} isSelected={selectedSlot === s.key} onSelect={setSelectedSlot} />
            ))}
          </div>
          {/* Ring1 / spacer / Ring2 */}
          <div className="flex items-center gap-2">
            {SLOT_META.filter(s => s.key === 'ring1').map(s => (
              <SlotSquare key={s.key} slotKey={s.key} label={s.label} Icon={s.Icon}
                tier={slotUpgrades[s.key]} isSelected={selectedSlot === s.key} onSelect={setSelectedSlot} />
            ))}
            <div className="w-14 h-14" />
            {SLOT_META.filter(s => s.key === 'ring2').map(s => (
              <SlotSquare key={s.key} slotKey={s.key} label={s.label} Icon={s.Icon}
                tier={slotUpgrades[s.key]} isSelected={selectedSlot === s.key} onSelect={setSelectedSlot} />
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="shrink-0 mx-4 h-px bg-gray-700/50 my-2" />

        {/* Inspect panel */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4">
          {(() => {
            if (!selectedSlot) return (
              <div className="rounded-xl border border-gray-800 bg-black/40 p-5 flex items-center justify-center min-h-[100px]">
                <p className="text-[11px] text-gray-600 text-center">Select a slot above to view upgrade details.</p>
              </div>
            )

            const meta        = SLOT_META.find(s => s.key === selectedSlot)!
            const currentTier = slotUpgrades[selectedSlot] as SlotRarityLevel
            const tierColors  = SLOT_TIER_COLORS[currentTier]
            const isMaxed     = currentTier >= 4
            const nextTier    = (currentTier + 1) as 1 | 2 | 3 | 4
            const cost        = isMaxed ? 0 : SLOT_UPGRADE_COSTS[nextTier]
            const canAfford   = !isMaxed && ironScrap >= cost
            const currentBonus = currentTier > 0 ? SLOT_TIER_BONUSES[selectedSlot]?.[currentTier as 1 | 2 | 3 | 4] : null

            return (
              <div className="rounded-xl border border-gray-700 bg-black/60 p-4 flex flex-col gap-3">
                {/* Slot name + tier */}
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-gray-200">{meta.label}</p>
                  <span className={`text-xs font-bold uppercase tracking-widest ${tierColors.text}`}>
                    {tierColors.label}{currentTier > 0 ? ` (Tier ${currentTier})` : ''}
                  </span>
                </div>

                {/* Current bonuses */}
                {currentBonus && Object.entries(currentBonus).length > 0 ? (
                  <div className="flex flex-col gap-0.5">
                    <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-0.5">Current Bonuses</p>
                    {Object.entries(currentBonus).map(([k, v]) => v ? (
                      <p key={k} className={`text-sm font-semibold ${STAT_COLOR[k] ?? 'text-gray-300'}`}>
                        {formatBonus(k, v)}
                      </p>
                    ) : null)}
                  </div>
                ) : (
                  <p className="text-xs text-gray-600 italic">No bonuses at Base tier.</p>
                )}

                {/* Upgrade Path */}
                <div className="flex flex-col gap-1 border-t border-gray-800 pt-3">
                  <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-1">Upgrade Path</p>
                  {([1, 2, 3, 4] as const).map(t => {
                    const tierBonus  = SLOT_TIER_BONUSES[selectedSlot]?.[t]
                    const tierColors = SLOT_TIER_COLORS[t]
                    const isCurrent  = t === currentTier
                    const isFuture   = t > currentTier
                    return (
                      <div
                        key={t}
                        className={`rounded-lg px-2.5 py-1.5 flex flex-col gap-0.5
                          ${isCurrent ? 'bg-white/5 ring-1 ring-white/10' : ''}
                          ${isFuture ? 'opacity-40' : ''}
                        `}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] font-bold uppercase tracking-widest ${tierColors.text}`}>
                            {tierColors.label}
                          </span>
                          {isCurrent && (
                            <span className="text-[9px] font-bold uppercase tracking-widest text-white/30 ml-auto">Active</span>
                          )}
                        </div>
                        {tierBonus && Object.entries(tierBonus).map(([k, v]) => v ? (
                          <p key={k} className={`text-xs font-semibold ${STAT_COLOR[k] ?? 'text-gray-300'}`}>
                            {formatBonus(k, v)}
                          </p>
                        ) : null)}
                      </div>
                    )
                  })}
                </div>

                {/* Upgrade button */}
                {isMaxed ? (
                  <div className="w-full py-2 rounded-lg border border-purple-600/40 bg-purple-900/10 text-center">
                    <p className="text-xs font-bold text-purple-400 uppercase tracking-widest">Max Tier — Epic</p>
                  </div>
                ) : (
                  <button
                    onClick={() => upgradeEquipmentSlot(selectedSlot)}
                    disabled={!canAfford}
                    className={`w-full py-2.5 rounded-lg border text-xs font-bold uppercase tracking-wider transition-colors
                      ${canAfford
                        ? 'border-amber-500 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 cursor-pointer'
                        : 'border-gray-700 bg-gray-800/50 text-gray-600 cursor-default'
                      }`}
                  >
                    Upgrade to {SLOT_TIER_COLORS[nextTier].label} — {cost} ⚙ Iron Scrap
                    {!canAfford && <span className="text-red-900/70 ml-1">(need {cost - ironScrap} more)</span>}
                  </button>
                )}
              </div>
            )
          })()}
        </div>

      </div>
    </div>
  )
}
