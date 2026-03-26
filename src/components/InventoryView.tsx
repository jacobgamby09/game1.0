import { useState } from 'react'
import {
  Crown, Shirt, Layers, Swords, Shield, Award, Circle, Zap, Coins, FlaskConical,
} from 'lucide-react'
import { useGameStore, getEffectiveStats, getItemSellValue, RARITY_COLORS, MAX_POTION_SLOTS, SLOT_TIER_COLORS, SLOT_TIER_BONUSES } from '../stores/useGameStore'
import type { Item, EquipSlot, ItemSlot, EquipmentSlotName, EquipmentSlotUpgrades, SlotRarityLevel } from '../stores/useGameStore'
import ItemComparisonPanel from './ItemComparisonPanel'

// ─── Slot icon map ────────────────────────────────────────────────────────────

const SLOT_ICONS: Record<EquipSlot, React.ElementType> = {
  head:     Crown,
  chest:    Shirt,
  legs:     Layers,
  mainHand: Swords,
  offHand:  Shield,
  amulet:   Award,
  ring1:    Circle,
  ring2:    Circle,
  spell:    Zap,
}

const SLOT_LABELS: Record<EquipSlot, string> = {
  head: 'Head', chest: 'Chest', legs: 'Legs',
  mainHand: 'Main Hand', offHand: 'Off Hand',
  amulet: 'Amulet', ring1: 'Ring 1', ring2: 'Ring 2',
  spell: 'Spell',
}

function getSlotIcon(slot: ItemSlot): React.ElementType {
  if (slot === 'potion') return FlaskConical
  return SLOT_ICONS[slot]
}

function getSlotLabel(slot: ItemSlot): string {
  if (slot === 'potion') return 'Potion'
  return SLOT_LABELS[slot]
}

// ─── SlotButton ───────────────────────────────────────────────────────────────

interface SlotButtonProps {
  slotKey: EquipSlot
  item: Item | null
  isSelected: boolean
  onClick: () => void
  slotTier: SlotRarityLevel
}

function SlotButton({ slotKey, item, isSelected, onClick, slotTier }: SlotButtonProps) {
  const Icon         = SLOT_ICONS[slotKey]
  const filled       = item !== null
  const ItemIcon     = filled ? getSlotIcon(item.equipSlot) : null
  const rarityBorder = filled ? RARITY_COLORS[item.rarity].border : 'border-dashed border-gray-600'
  const rarityGlow   = filled ? RARITY_COLORS[item.rarity].glow   : ''
  const dotClass     = slotTier > 0 ? SLOT_TIER_COLORS[slotTier].dot : ''

  return (
    <button
      onClick={filled ? onClick : undefined}
      title={filled ? item.name : SLOT_LABELS[slotKey]}
      className={`relative w-14 h-14 rounded-lg flex flex-col items-center justify-center gap-0.5 border-2 transition-all duration-150
        ${filled
          ? `bg-gray-700 ${rarityBorder} ${rarityGlow} text-amber-300 cursor-pointer`
          : `bg-gray-800 ${rarityBorder} text-gray-600 cursor-default`
        }
        ${isSelected ? 'ring-2 ring-white/40' : ''}
      `}
    >
      {ItemIcon ? <ItemIcon size={20} /> : <Icon size={20} />}
      {filled && (
        <span className="text-[9px] leading-none text-amber-400/70 font-medium tracking-tight truncate w-12 text-center px-0.5">
          {item.name.split(' ')[0]}
        </span>
      )}
      {slotTier > 0 && (
        <span className={`absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full ring-1 ring-white/10 ${dotClass}`} />
      )}
    </button>
  )
}

// ─── PaperDoll ────────────────────────────────────────────────────────────────

interface PaperDollProps {
  equipment: Record<EquipSlot, Item | null>
  selectedItem: Item | null
  slotUpgrades: EquipmentSlotUpgrades
  onSelect: (item: Item, slotKey: EquipSlot) => void
}

function PaperDoll({ equipment, selectedItem, slotUpgrades, onSelect }: PaperDollProps) {
  function slotBtn(key: EquipSlot) {
    const tier: SlotRarityLevel = key === 'spell' ? 0 : (slotUpgrades[key as EquipmentSlotName] ?? 0) as SlotRarityLevel
    return (
      <SlotButton
        key={key}
        slotKey={key}
        item={equipment[key]}
        isSelected={selectedItem?.id === equipment[key]?.id}
        onClick={() => equipment[key] && onSelect(equipment[key]!, key)}
        slotTier={tier}
      />
    )
  }

  const spacer = <div className="w-14 h-14" />

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 flex flex-col gap-2">
      <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest mb-1">
        Equipped
      </p>

      {/* HEAD */}
      <div className="flex justify-center">{slotBtn('head')}</div>

      {/* MH · CHEST · OH */}
      <div className="flex justify-center gap-2">
        {slotBtn('mainHand')}
        {slotBtn('chest')}
        {slotBtn('offHand')}
      </div>

      {/* AMULET */}
      <div className="flex justify-center">{slotBtn('amulet')}</div>

      {/* LEGS */}
      <div className="flex justify-center">{slotBtn('legs')}</div>

      {/* RING1 · spacer · RING2 */}
      <div className="flex justify-center gap-2">
        {slotBtn('ring1')}
        {spacer}
        {slotBtn('ring2')}
      </div>

      {/* SPELL */}
      <div className="flex justify-center">{slotBtn('spell')}</div>
    </div>
  )
}

// ─── PotionBelt ───────────────────────────────────────────────────────────────

interface PotionBeltProps {
  potionBelt: { item: Item; count: number }[]
  maxSlots: number
  selectedBeltIndex: number | null
  onSelect: (index: number) => void
}

function PotionBelt({ potionBelt, maxSlots, selectedBeltIndex, onSelect }: PotionBeltProps) {
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 flex flex-col gap-2">
      <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest mb-1">
        Potion Belt
      </p>
      <div className="flex gap-2 justify-center">
        {Array.from({ length: maxSlots }).map((_, i) => {
          const slot = potionBelt[i]
          return slot ? (
            <button
              key={i}
              onClick={() => onSelect(i)}
              title={slot.item.name}
              className={`relative w-14 h-14 rounded-lg bg-gray-700 border-2 flex flex-col items-center
                          justify-center gap-0.5 text-amber-300 transition-all duration-150 cursor-pointer
                          ${RARITY_COLORS[slot.item.rarity].border} ${RARITY_COLORS[slot.item.rarity].glow}
                          ${selectedBeltIndex === i ? 'ring-2 ring-amber-400' : ''}`}
            >
              <FlaskConical size={20} />
              <span className="text-[9px] leading-none text-amber-400/70 font-medium tracking-tight truncate w-12 text-center px-0.5">
                {slot.item.name.split(' ')[0]}
              </span>
              <span className="absolute top-0.5 right-1 text-[9px] font-bold text-amber-300">
                ×{slot.count}
              </span>
            </button>
          ) : (
            <div
              key={i}
              className="w-14 h-14 rounded-lg bg-gray-800 border-2 border-dashed border-gray-600 flex items-center justify-center"
            >
              <FlaskConical size={18} className="text-gray-700" />
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── BackpackGrid ─────────────────────────────────────────────────────────────

const GRID_SIZE = 16

interface BackpackGridProps {
  backpack: Item[]
  selectedItem: Item | null
  onSelect: (item: Item) => void
}

function BackpackGrid({ backpack, selectedItem, onSelect }: BackpackGridProps) {
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 flex-1 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest">Backpack</p>
        <span className="text-xs text-gray-600">{backpack.length} / {GRID_SIZE}</span>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: GRID_SIZE }).map((_, i) => {
          const item = backpack[i]
          if (!item) {
            return (
              <div
                key={i}
                className="w-14 h-14 rounded-lg bg-gray-800 border border-gray-700"
              />
            )
          }
          const Icon = getSlotIcon(item.equipSlot)
          const isSelected = selectedItem?.id === item.id
          const rarityBorder = RARITY_COLORS[item.rarity].border
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item)}
              title={item.name}
              className={`w-14 h-14 rounded-lg bg-gray-700 border flex flex-col items-center justify-center gap-0.5 text-amber-300 transition-all duration-150 hover:border-amber-500
                ${isSelected
                  ? 'border-amber-400 ring-2 ring-amber-400'
                  : rarityBorder
                }`}
            >
              <Icon size={20} />
              <span className="text-[9px] leading-none text-amber-400/70 font-medium tracking-tight truncate w-12 text-center px-0.5">
                {item.name.split(' ')[0]}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── ItemDetails ──────────────────────────────────────────────────────────────

interface ItemDetailsProps {
  selectedItem: Item | null
  selectedFrom: 'backpack' | EquipSlot | 'belt' | null
  beltIndex: number | null
  equipment: Record<EquipSlot, Item | null>
  slotUpgrades: EquipmentSlotUpgrades
  onEquip: (item: Item) => void
  onEquipToSlot: (item: Item, slot: EquipSlot) => void
  onEquipPotion: (item: Item) => void
  onUnequip: (slotKey: string) => void
  onUnequipBelt: (index: number) => void
  onSell: () => void
  sellValue: number
  onClear: () => void
}

function ItemDetails({
  selectedItem, selectedFrom, beltIndex, equipment, slotUpgrades,
  onEquip, onEquipToSlot, onEquipPotion, onUnequip, onUnequipBelt,
  onSell, sellValue, onClear,
}: ItemDetailsProps) {
  const isEmpty = selectedItem === null

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 sm:w-64 flex flex-col gap-3">
      <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest">Item Details</p>

      {isEmpty ? (
        <div className="flex-1 flex items-center justify-center py-8">
          <p className="text-gray-600 text-sm italic text-center">
            Select an item to view details
          </p>
        </div>
      ) : (
        <>
          {/* Name + icon */}
          <div className="flex items-center gap-2 border-b border-gray-700 pb-3">
            {(() => {
              const Icon = getSlotIcon(selectedItem.equipSlot)
              return <Icon className="text-amber-400 shrink-0" size={22} />
            })()}
            <div>
              <p className={`font-bold leading-tight ${RARITY_COLORS[selectedItem.rarity].text}`}>{selectedItem.name}</p>
              <p className="text-gray-500 text-xs">{getSlotLabel(selectedItem.equipSlot)}</p>
              <p className={`text-xs font-semibold uppercase tracking-widest ${RARITY_COLORS[selectedItem.rarity].text}`}>{selectedItem.rarity}</p>
            </div>
          </div>

          {/* Description */}
          <p className="text-gray-400 text-sm italic">{selectedItem.description}</p>

          {/* Comparison panel for backpack items */}
          {selectedFrom === 'backpack' && (
            <ItemComparisonPanel
              item={selectedItem}
              onEquip={(slot) => {
                if (selectedItem.equipSlot === 'potion') {
                  onEquipPotion(selectedItem)
                } else if (slot) {
                  onEquipToSlot(selectedItem, slot)
                } else {
                  onEquip(selectedItem)
                }
                onClear()
              }}
            />
          )}

          {/* Stats for equipped/belt items and potions */}
          {(selectedFrom !== 'backpack' || selectedItem.equipSlot === 'potion') && selectedItem.equipSlot !== 'potion' && (() => {
            const slotName = selectedItem.equipSlot as EquipmentSlotName
            const slotTier = slotName !== 'spell' ? (slotUpgrades[slotName] ?? 0) : 0
            const slotBonus = slotTier > 0 && slotName !== 'spell'
              ? SLOT_TIER_BONUSES[slotName]?.[slotTier as 1 | 2 | 3 | 4]
              : null
            return (
              <div className="flex flex-col gap-1">
                {selectedItem.stats.damage          !== undefined && (
                  <><p className="text-red-400 text-sm font-semibold">+{selectedItem.stats.damage} Damage</p>
                  {slotBonus?.damage ? <p className="text-red-400/40 text-xs pl-2">+{slotBonus.damage} from {SLOT_LABELS[selectedItem.equipSlot as EquipSlot]} slot</p> : null}</>
                )}
                {selectedItem.stats.hp              !== undefined && (
                  <><p className="text-green-400 text-sm font-semibold">+{selectedItem.stats.hp} Max HP</p>
                  {slotBonus?.hp ? <p className="text-green-400/40 text-xs pl-2">+{slotBonus.hp} from {SLOT_LABELS[selectedItem.equipSlot as EquipSlot]} slot</p> : null}</>
                )}
                {selectedItem.stats.attackSpeed     !== undefined && (
                  <><p className="text-blue-400 text-sm font-semibold">{selectedItem.stats.attackSpeed >= 0 ? '+' : ''}{selectedItem.stats.attackSpeed.toFixed(2)} Atk Speed</p>
                  {slotBonus?.attackSpeed ? <p className="text-blue-400/40 text-xs pl-2">+{slotBonus.attackSpeed.toFixed(2)} from {SLOT_LABELS[selectedItem.equipSlot as EquipSlot]} slot</p> : null}</>
                )}
                {selectedItem.stats.critChance      !== undefined && (
                  <><p className="text-yellow-400 text-sm font-semibold">+{(selectedItem.stats.critChance * 100).toFixed(0)}% Crit</p>
                  {slotBonus?.critChance ? <p className="text-yellow-400/40 text-xs pl-2">+{(slotBonus.critChance * 100).toFixed(0)}% from {SLOT_LABELS[selectedItem.equipSlot as EquipSlot]} slot</p> : null}</>
                )}
                {selectedItem.stats.dodgeChance     !== undefined && (
                  <><p className="text-cyan-400 text-sm font-semibold">+{(selectedItem.stats.dodgeChance * 100).toFixed(0)}% Dodge</p>
                  {slotBonus?.dodgeChance ? <p className="text-cyan-400/40 text-xs pl-2">+{(slotBonus.dodgeChance * 100).toFixed(0)}% from {SLOT_LABELS[selectedItem.equipSlot as EquipSlot]} slot</p> : null}</>
                )}
                {selectedItem.stats.lifesteal       !== undefined && (
                  <><p className="text-emerald-400 text-sm font-semibold">+{selectedItem.stats.lifesteal} Lifesteal</p>
                  {slotBonus?.lifesteal ? <p className="text-emerald-400/40 text-xs pl-2">+{slotBonus.lifesteal} from {SLOT_LABELS[selectedItem.equipSlot as EquipSlot]} slot</p> : null}</>
                )}
                {selectedItem.stats.damageReduction !== undefined && (
                  <><p className="text-orange-400 text-sm font-semibold">+{selectedItem.stats.damageReduction} DR</p>
                  {slotBonus?.damageReduction ? <p className="text-orange-400/40 text-xs pl-2">+{slotBonus.damageReduction} DR from {SLOT_LABELS[selectedItem.equipSlot as EquipSlot]} slot</p> : null}</>
                )}
              </div>
            )
          })()}

          {/* Ability */}
          {selectedItem.ability && selectedFrom !== 'backpack' && (
            <div className="border border-orange-900/60 bg-orange-950/20 rounded-lg p-2.5 flex flex-col gap-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-orange-400/70">Ability</p>
              <p className="text-xs font-bold text-orange-300">
                {selectedItem.ability.name}
                <span className="text-gray-400 font-normal"> — {selectedItem.ability.value} Damage</span>
              </p>
              <p className="text-[10px] text-gray-400 leading-snug">{selectedItem.ability.description}</p>
              <p className="text-[10px] text-gray-500">Cooldown: {(selectedItem.ability.cooldown / 1000).toFixed(1)}s</p>
            </div>
          )}

          {/* Action button */}
          <div className="mt-auto pt-2 flex flex-col gap-2">
            {selectedFrom === 'backpack' ? (
              <>
                {selectedItem.equipSlot === 'potion' && (
                  <button
                    onClick={() => { onEquipPotion(selectedItem); onClear() }}
                    className="w-full border border-amber-500 text-amber-400 py-2 rounded-lg text-sm font-bold uppercase tracking-widest hover:bg-amber-500/10 transition-colors"
                  >
                    Equip to Belt
                  </button>
                )}
                <button
                  onClick={() => { onSell(); onClear() }}
                  className="w-full border border-yellow-700 text-yellow-500 py-2 rounded-lg text-sm font-bold uppercase tracking-widest hover:bg-yellow-900/20 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Coins size={13} />
                  Sell for {sellValue}g
                </button>
              </>
            ) : selectedFrom === 'belt' ? (
              <button
                onClick={() => { onUnequipBelt(beltIndex!); onClear() }}
                className="w-full border border-red-800 text-red-400 py-2 rounded-lg text-sm font-bold uppercase tracking-widest hover:bg-red-900/20 transition-colors"
              >
                Unequip
              </button>
            ) : (
              <button
                onClick={() => { onUnequip(selectedFrom!); onClear() }}
                className="w-full border border-red-800 text-red-400 py-2 rounded-lg text-sm font-bold uppercase tracking-widest hover:bg-red-900/20 transition-colors"
              >
                Unequip
              </button>
            )}
            <button
              onClick={onClear}
              className="w-full text-gray-600 text-xs hover:text-gray-400 transition-colors"
            >
              Deselect
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// ─── InventoryView ────────────────────────────────────────────────────────────

export default function InventoryView() {
  const {
    backpack, equipment, equipItem, equipItemToSlot, unequipItem, sellItem, player, talents, slotUpgrades,
    potionBelt, equipPotion, unequipPotion,
  } = useGameStore()
  const eff = getEffectiveStats(player, equipment, talents, slotUpgrades)

  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const [selectedFrom, setSelectedFrom] = useState<'backpack' | EquipSlot | 'belt' | null>(null)
  const [selectedBeltIndex, setSelectedBeltIndex] = useState<number | null>(null)

  const sellValue = selectedItem ? getItemSellValue(selectedItem.rarity) : 0

  function handleSelectFromBackpack(item: Item) {
    setSelectedItem(item)
    setSelectedFrom('backpack')
    setSelectedBeltIndex(null)
  }

  function handleSelectFromEquipment(item: Item, slotKey: EquipSlot) {
    setSelectedItem(item)
    setSelectedFrom(slotKey)
    setSelectedBeltIndex(null)
  }

  function handleSelectFromBelt(index: number) {
    setSelectedItem(potionBelt[index].item)
    setSelectedFrom('belt')
    setSelectedBeltIndex(index)
  }

  function clearSelection() {
    setSelectedItem(null)
    setSelectedFrom(null)
    setSelectedBeltIndex(null)
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4 p-4 w-full max-w-5xl mx-auto min-h-full sm:items-start">
      {/* Section 1: Paper Doll + Potion Belt + Stats */}
      <div className="flex flex-col gap-3 w-full sm:w-auto">
        <PaperDoll
          equipment={equipment}
          selectedItem={selectedItem}
          slotUpgrades={slotUpgrades}
          onSelect={handleSelectFromEquipment}
        />
        <PotionBelt
          potionBelt={potionBelt}
          maxSlots={MAX_POTION_SLOTS}
          selectedBeltIndex={selectedBeltIndex}
          onSelect={handleSelectFromBelt}
        />
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 flex flex-col gap-1">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest mb-1">Stats</p>
          <p className="text-green-400 text-sm font-semibold">❤ {eff.maxHp} Max HP</p>
          <p className="text-red-400 text-sm font-semibold">⚔ {eff.damage} Damage</p>
          <p className="text-blue-400 text-sm font-semibold">⚡ {eff.attackSpeed.toFixed(2)} Atk Speed</p>
          {eff.critChance      > 0 && <p className="text-yellow-400 text-sm font-semibold">🎯 {(eff.critChance * 100).toFixed(0)}% Crit</p>}
          {eff.dodgeChance     > 0 && <p className="text-cyan-400 text-sm font-semibold">💨 {(eff.dodgeChance * 100).toFixed(0)}% Dodge</p>}
          {eff.lifesteal       > 0 && <p className="text-emerald-400 text-sm font-semibold">🩸 {eff.lifesteal} Lifesteal</p>}
          {eff.damageReduction > 0 && <p className="text-orange-400 text-sm font-semibold">🛡 {eff.damageReduction} DR</p>}
        </div>
      </div>

      {/* Section 2: Backpack */}
      <BackpackGrid
        backpack={backpack}
        selectedItem={selectedItem}
        onSelect={handleSelectFromBackpack}
      />

      {/* Section 3: Item Details */}
      <ItemDetails
        selectedItem={selectedItem}
        selectedFrom={selectedFrom}
        beltIndex={selectedBeltIndex}
        equipment={equipment}
        slotUpgrades={slotUpgrades}
        onEquip={equipItem}
        onEquipToSlot={equipItemToSlot}
        onEquipPotion={equipPotion}
        onUnequip={unequipItem}
        onUnequipBelt={unequipPotion}
        onSell={() => { sellItem(selectedItem!.id); clearSelection() }}
        sellValue={sellValue}
        onClear={clearSelection}
      />
    </div>
  )
}
