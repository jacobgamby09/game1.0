import { useState } from 'react'
import {
  Crown, Shirt, Layers, Swords, Shield, Gem, Circle, Zap,
} from 'lucide-react'
import { useGameStore, getEffectiveStats, RARITY_COLORS } from '../stores/useGameStore'
import type { Item, EquipSlot } from '../stores/useGameStore'
import { getStatDiff, DiffBadge, DiffBadgeF } from '../utils/statDiff'

// ─── Slot icon map ────────────────────────────────────────────────────────────

const SLOT_ICONS: Record<EquipSlot, React.ElementType> = {
  head:     Crown,
  chest:    Shirt,
  legs:     Layers,
  mainHand: Swords,
  offHand:  Shield,
  amulet:   Gem,
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

// ─── SlotButton ───────────────────────────────────────────────────────────────

interface SlotButtonProps {
  slotKey: EquipSlot
  item: Item | null
  isSelected: boolean
  onClick: () => void
}

function SlotButton({ slotKey, item, isSelected, onClick }: SlotButtonProps) {
  const Icon = SLOT_ICONS[slotKey]
  const filled = item !== null
  const ItemIcon = filled ? SLOT_ICONS[item.equipSlot] : null
  const rarityBorder = filled ? RARITY_COLORS[item.rarity].border : ''
  const rarityGlow   = filled ? RARITY_COLORS[item.rarity].glow   : ''

  return (
    <button
      onClick={filled ? onClick : undefined}
      title={filled ? item.name : SLOT_LABELS[slotKey]}
      className={`w-14 h-14 rounded-lg flex flex-col items-center justify-center gap-0.5 border-2 transition-all duration-150
        ${filled
          ? `bg-gray-700 ${rarityBorder} ${rarityGlow} text-amber-300 cursor-pointer`
          : 'bg-gray-800 border-dashed border-gray-600 text-gray-600 cursor-default'
        }
        ${isSelected ? 'ring-2 ring-amber-400' : ''}
      `}
    >
      {ItemIcon ? <ItemIcon size={20} /> : <Icon size={20} />}
      {filled && (
        <span className="text-[9px] leading-none text-amber-400/70 font-medium tracking-tight truncate w-12 text-center px-0.5">
          {item.name.split(' ')[0]}
        </span>
      )}
    </button>
  )
}

// ─── PaperDoll ────────────────────────────────────────────────────────────────

interface PaperDollProps {
  equipment: Record<EquipSlot, Item | null>
  selectedItem: Item | null
  onSelect: (item: Item, slotKey: EquipSlot) => void
}

function PaperDoll({ equipment, selectedItem, onSelect }: PaperDollProps) {
  function slotBtn(key: EquipSlot) {
    return (
      <SlotButton
        key={key}
        slotKey={key}
        item={equipment[key]}
        isSelected={selectedItem?.id === equipment[key]?.id}
        onClick={() => equipment[key] && onSelect(equipment[key]!, key)}
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
          const Icon = SLOT_ICONS[item.equipSlot]
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
  selectedFrom: 'backpack' | EquipSlot | null
  equipment: Record<EquipSlot, Item | null>
  onEquip: (item: Item) => void
  onUnequip: (slotKey: string) => void
  onClear: () => void
}

function ItemDetails({ selectedItem, selectedFrom, equipment, onEquip, onUnequip, onClear }: ItemDetailsProps) {
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
              const Icon = SLOT_ICONS[selectedItem.equipSlot]
              return <Icon className="text-amber-400 shrink-0" size={22} />
            })()}
            <div>
              <p className={`font-bold leading-tight ${RARITY_COLORS[selectedItem.rarity].text}`}>{selectedItem.name}</p>
              <p className="text-gray-500 text-xs">{SLOT_LABELS[selectedItem.equipSlot]}</p>
              <p className={`text-xs font-semibold uppercase tracking-widest ${RARITY_COLORS[selectedItem.rarity].text}`}>{selectedItem.rarity}</p>
            </div>
          </div>

          {/* Description */}
          <p className="text-gray-400 text-sm italic">{selectedItem.description}</p>

          {/* Stats */}
          <div className="flex flex-col gap-1">
            {selectedFrom === 'backpack' && !equipment[selectedItem.equipSlot] && (
              <p className="text-amber-400 text-xs font-bold uppercase tracking-wide">Slot: Empty</p>
            )}
            {selectedItem.stats.damage !== undefined && (
              <p className="text-red-400 text-sm font-semibold">
                +{selectedItem.stats.damage} Damage
                {selectedFrom === 'backpack' && (
                  <DiffBadge diff={getStatDiff(selectedItem, equipment[selectedItem.equipSlot]).damage} />
                )}
              </p>
            )}
            {selectedItem.stats.hp !== undefined && (
              <p className="text-green-400 text-sm font-semibold">
                +{selectedItem.stats.hp} Max HP
                {selectedFrom === 'backpack' && (
                  <DiffBadge diff={getStatDiff(selectedItem, equipment[selectedItem.equipSlot]).hp} />
                )}
              </p>
            )}
            {selectedItem.stats.attackSpeed !== undefined && (
              <p className="text-blue-400 text-sm font-semibold">
                +{selectedItem.stats.attackSpeed.toFixed(1)} Atk Speed
                {selectedFrom === 'backpack' && (
                  <DiffBadgeF diff={getStatDiff(selectedItem, equipment[selectedItem.equipSlot]).attackSpeed} />
                )}
              </p>
            )}
          </div>

          {/* Action button */}
          <div className="mt-auto pt-2 flex flex-col gap-2">
            {selectedFrom === 'backpack' ? (
              <button
                onClick={() => { onEquip(selectedItem); onClear() }}
                className="w-full border border-amber-500 text-amber-400 py-2 rounded-lg text-sm font-bold uppercase tracking-widest hover:bg-amber-500/10 transition-colors"
              >
                Equip
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
  const { backpack, equipment, equipItem, unequipItem, player, talents } = useGameStore()
  const eff = getEffectiveStats(player, equipment, talents)

  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const [selectedFrom, setSelectedFrom] = useState<'backpack' | EquipSlot | null>(null)

  function handleSelectFromBackpack(item: Item) {
    setSelectedItem(item)
    setSelectedFrom('backpack')
  }

  function handleSelectFromEquipment(item: Item, slotKey: EquipSlot) {
    setSelectedItem(item)
    setSelectedFrom(slotKey)
  }

  function clearSelection() {
    setSelectedItem(null)
    setSelectedFrom(null)
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4 p-4 w-full max-w-5xl mx-auto min-h-full sm:items-start">
      {/* Section 1: Paper Doll + Stats */}
      <div className="flex flex-col gap-3 w-full sm:w-auto">
        <PaperDoll
          equipment={equipment}
          selectedItem={selectedItem}
          onSelect={handleSelectFromEquipment}
        />
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 flex flex-col gap-1">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest mb-1">Stats</p>
          <p className="text-green-400 text-sm font-semibold">❤ {eff.maxHp} Max HP</p>
          <p className="text-red-400 text-sm font-semibold">⚔ {eff.damage} Damage</p>
          <p className="text-blue-400 text-sm font-semibold">⚡ {eff.attackSpeed.toFixed(2)} Atk Speed</p>
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
        equipment={equipment}
        onEquip={equipItem}
        onUnequip={unequipItem}
        onClear={clearSelection}
      />
    </div>
  )
}
