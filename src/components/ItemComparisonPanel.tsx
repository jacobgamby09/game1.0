import { Crown, Shirt, Layers, Swords, Shield, Award, Circle, Zap, FlaskConical } from 'lucide-react'
import { useGameStore, RARITY_COLORS, SET_BONUSES, SET_BONUS_TEXT } from '../stores/useGameStore'
import type { Item, EquipSlot } from '../stores/useGameStore'
import { getStatDiff, DiffBadge, DiffBadgeF } from '../utils/statDiff'

// ─── Slot metadata ────────────────────────────────────────────────────────────

const SLOT_ICONS: Record<EquipSlot, React.ElementType> = {
  head: Crown, chest: Shirt, legs: Layers,
  mainHand: Swords, offHand: Shield,
  amulet: Award, ring1: Circle, ring2: Circle, spell: Zap,
}

const SLOT_LABELS: Record<EquipSlot, string> = {
  head: 'Head', chest: 'Chest', legs: 'Legs',
  mainHand: 'Main Hand', offHand: 'Off Hand',
  amulet: 'Amulet', ring1: 'Ring 1', ring2: 'Ring 2', spell: 'Spell',
}

// ─── StatRows ─────────────────────────────────────────────────────────────────

function StatRows({ item, equippedItem }: { item: Item; equippedItem: Item | null }) {
  const d = getStatDiff(item, equippedItem)
  return (
    <div className="flex flex-col gap-0.5 text-xs font-semibold">
      {!equippedItem && <p className="text-amber-400 text-[10px] font-bold uppercase tracking-wide">Slot: Empty</p>}
      {item.stats.damage          !== undefined && <p className="text-red-400">+{item.stats.damage} Damage<DiffBadge diff={d.damage} /></p>}
      {item.stats.hp              !== undefined && <p className="text-green-400">+{item.stats.hp} Max HP<DiffBadge diff={d.hp} /></p>}
      {item.stats.attackSpeed     !== undefined && <p className="text-blue-400">{item.stats.attackSpeed >= 0 ? '+' : ''}{item.stats.attackSpeed.toFixed(2)} Spd<DiffBadgeF diff={d.attackSpeed} decimals={2} /></p>}
      {item.stats.critChance      !== undefined && <p className="text-yellow-400">+{(item.stats.critChance * 100).toFixed(0)}% Crit<DiffBadge diff={Math.round(d.critChance * 100)} /></p>}
      {item.stats.dodgeChance     !== undefined && <p className="text-cyan-400">+{(item.stats.dodgeChance * 100).toFixed(0)}% Dodge<DiffBadge diff={Math.round(d.dodgeChance * 100)} /></p>}
      {item.stats.lifesteal       !== undefined && <p className="text-emerald-400">+{item.stats.lifesteal} Lifesteal<DiffBadge diff={d.lifesteal} /></p>}
      {item.stats.damageReduction !== undefined && <p className="text-orange-400">+{item.stats.damageReduction} DR<DiffBadge diff={d.damageReduction} /></p>}
      {equippedItem && <>
        {item.stats.hp              === undefined && (equippedItem.stats.hp              ?? 0) > 0   && <p className="text-green-400/50">Max HP <DiffBadge diff={d.hp} /></p>}
        {item.stats.damage          === undefined && (equippedItem.stats.damage          ?? 0) > 0   && <p className="text-red-400/50">Damage <DiffBadge diff={d.damage} /></p>}
        {item.stats.attackSpeed     === undefined && (equippedItem.stats.attackSpeed     ?? 0) !== 0 && <p className="text-blue-400/50">Spd <DiffBadgeF diff={d.attackSpeed} decimals={2} /></p>}
        {item.stats.critChance      === undefined && (equippedItem.stats.critChance      ?? 0) > 0   && <p className="text-yellow-400/50">Crit <DiffBadge diff={Math.round(d.critChance * 100)} /></p>}
        {item.stats.dodgeChance     === undefined && (equippedItem.stats.dodgeChance     ?? 0) > 0   && <p className="text-cyan-400/50">Dodge <DiffBadge diff={Math.round(d.dodgeChance * 100)} /></p>}
        {item.stats.lifesteal       === undefined && (equippedItem.stats.lifesteal       ?? 0) > 0   && <p className="text-emerald-400/50">Lifesteal <DiffBadge diff={d.lifesteal} /></p>}
        {item.stats.damageReduction === undefined && (equippedItem.stats.damageReduction ?? 0) > 0   && <p className="text-orange-400/50">DR <DiffBadge diff={d.damageReduction} /></p>}
      </>}
    </div>
  )
}

// ─── ItemComparisonPanel ──────────────────────────────────────────────────────

interface ItemComparisonPanelProps {
  item: Item
  onEquip?: (slot?: EquipSlot) => void  // if provided, equip buttons are shown; slot is set for dual-slot items
}

export default function ItemComparisonPanel({ item, onEquip }: ItemComparisonPanelProps) {
  const { equipment, potionBelt } = useGameStore()

  if (item.equipSlot === 'potion') {
    const rc       = RARITY_COLORS[item.rarity]
    const beltItem = potionBelt[0]?.item ?? null
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 pb-2">
          <FlaskConical size={20} className={rc.text} />
          <div>
            <p className={`font-bold leading-tight ${rc.text}`}>{item.name}</p>
            <p className="text-gray-500 text-xs">Potion Belt</p>
            <p className={`text-xs font-semibold uppercase tracking-widest ${rc.text}`}>{item.rarity}</p>
          </div>
        </div>
        <hr className="border-gray-700 mb-1" />
        <div className="border border-green-900/60 bg-green-950/20 rounded-lg p-2.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-green-400/70 mb-1">Effect</p>
          <p className="text-xs text-gray-300 leading-snug">{item.description}</p>
        </div>
        <div className="flex flex-col gap-2">
          {beltItem
            ? <p className="text-[10px] text-gray-500">In belt: <span className="text-gray-400">{beltItem.name}</span></p>
            : <p className="text-amber-400 text-[10px] font-bold uppercase tracking-wide">Belt: Empty</p>
          }
          {onEquip && (
            <button
              onClick={() => onEquip(undefined)}
              className="w-full py-2 rounded-lg border border-amber-500 bg-amber-500/10 text-amber-300 text-xs font-bold uppercase tracking-wider hover:bg-amber-500/20 cursor-pointer transition-colors"
            >
              Equip
            </button>
          )}
        </div>
      </div>
    )
  }

  const isDualRing       = item.equipSlot === 'ring1' || item.equipSlot === 'ring2'
  const isDual           = isDualRing
  const slotA: EquipSlot = isDualRing ? 'ring1' : item.equipSlot as EquipSlot
  const slotB: EquipSlot = 'ring2'  // only consumed when isDual (rings)

  const rc   = RARITY_COLORS[item.rarity]
  const Icon = item.icon ?? SLOT_ICONS[item.equipSlot as EquipSlot] ?? FlaskConical

  return (
    <div className="flex flex-col gap-3">
      {/* Item header */}
      <div className="flex items-center gap-2 pb-2">
        <Icon size={20} className={rc.text} />
        <div>
          <p className={`font-bold leading-tight ${rc.text}`}>{item.name}</p>
          <p className="text-gray-500 text-xs">{SLOT_LABELS[item.equipSlot as EquipSlot]}</p>
          <p className={`text-xs font-semibold uppercase tracking-widest ${rc.text}`}>{item.rarity}</p>
          {item.setName && (
            <div className="border border-lime-900/60 bg-lime-950/20 rounded p-1.5 flex flex-col gap-0.5 mt-0.5">
              <p className={`text-[10px] font-bold uppercase tracking-widest ${SET_BONUSES[item.setName].color}`}>
                Set: {SET_BONUSES[item.setName].name}
              </p>
              <p className="text-[10px] text-lime-300">2-Piece: {SET_BONUS_TEXT[item.setName][2]}</p>
              <p className="text-[10px] text-lime-300">4-Piece: {SET_BONUS_TEXT[item.setName][4]}</p>
            </div>
          )}
        </div>
      </div>
      <hr className="border-gray-700 mb-1" />

      {/* Ability */}
      {item.ability && (
        <div className="border border-orange-900/60 bg-orange-950/20 rounded-lg p-2.5 flex flex-col gap-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-orange-400/70">Ability</p>
          <p className="text-xs font-bold text-orange-300">
            {item.ability.name}
            <span className="text-gray-400 font-normal"> — {item.ability.value} Damage</span>
          </p>
          <p className="text-[10px] text-gray-400 leading-snug">{item.ability.description}</p>
        </div>
      )}

      {/* Comparison */}
      {isDual ? (
        <div className="grid grid-cols-2 gap-2">
          {([slotA, slotB] as EquipSlot[]).map((slot) => (
            <div key={slot} className="flex flex-col gap-2 border border-gray-700 rounded-lg p-2 bg-gray-800/40">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-gray-500">Vs. {SLOT_LABELS[slot]}</p>
                <p className="text-[10px] text-gray-400 truncate">{equipment[slot]?.name ?? '— Empty —'}</p>
              </div>
              {item.name === equipment[slot]?.name && (
                <span className="self-start text-[10px] font-bold uppercase tracking-widest
                                 text-violet-300 bg-violet-900/40 border border-violet-600/50
                                 px-2 py-0.5 rounded">
                  Already Equipped
                </span>
              )}
              <StatRows item={item} equippedItem={equipment[slot]} />
              {onEquip && (
                <button
                  onClick={() => onEquip(slot)}
                  className="w-full mt-auto py-1.5 rounded border border-amber-500 bg-amber-500/10 text-amber-300 text-[10px] font-bold uppercase tracking-wider hover:bg-amber-500/20 cursor-pointer transition-colors"
                >
                  Equip → {SLOT_LABELS[slot]}
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {equipment[slotA] && (
            <p className="text-[10px] text-gray-500">
              Equipped: <span className="text-gray-400">{equipment[slotA]!.name}</span>
            </p>
          )}
          {item.name === equipment[slotA]?.name && (
            <span className="self-start text-[10px] font-bold uppercase tracking-widest
                             text-violet-300 bg-violet-900/40 border border-violet-600/50
                             px-2 py-0.5 rounded">
              Already Equipped
            </span>
          )}
          <StatRows item={item} equippedItem={equipment[slotA]} />
          {onEquip && (
            <button
              onClick={() => onEquip(undefined)}
              className="w-full py-2 rounded-lg border border-amber-500 bg-amber-500/10 text-amber-300 text-xs font-bold uppercase tracking-wider hover:bg-amber-500/20 cursor-pointer transition-colors"
            >
              Equip
            </button>
          )}
        </div>
      )}
    </div>
  )
}
