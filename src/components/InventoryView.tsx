import { useState } from 'react'
import {
  Crown, Shirt, Layers, Swords, Shield, Award, Circle, Zap, Coins, FlaskConical,
} from 'lucide-react'
import { useGameStore, getEffectiveStats, getItemSellValue, RARITY_COLORS, MAX_POTION_SLOTS } from '../stores/useGameStore'
import type { Item, EquipSlot, ItemSlot } from '../stores/useGameStore'
import { getStatDiff, DiffBadge, DiffBadgeF } from '../utils/statDiff'

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
}

function SlotButton({ slotKey, item, isSelected, onClick }: SlotButtonProps) {
  const Icon = SLOT_ICONS[slotKey]
  const filled = item !== null
  const ItemIcon = filled ? getSlotIcon(item.equipSlot) : null
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
  onEquip: (item: Item) => void
  onEquipPotion: (item: Item) => void
  onUnequip: (slotKey: string) => void
  onUnequipBelt: (index: number) => void
  onSell: () => void
  sellValue: number
  onClear: () => void
}

function ItemDetails({
  selectedItem, selectedFrom, beltIndex, equipment,
  onEquip, onEquipPotion, onUnequip, onUnequipBelt,
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

          {/* Stats */}
          <div className="flex flex-col gap-1">
            {selectedItem.equipSlot !== 'potion' && selectedFrom === 'backpack' && !equipment[selectedItem.equipSlot as EquipSlot] && (
              <p className="text-amber-400 text-xs font-bold uppercase tracking-wide">Slot: Empty</p>
            )}
            {(() => {
              const d = selectedFrom === 'backpack' && selectedItem.equipSlot !== 'potion'
                ? getStatDiff(selectedItem, equipment[selectedItem.equipSlot as EquipSlot])
                : null
              return (
                <>
                  {selectedItem.stats.damage !== undefined && (
                    <p className="text-red-400 text-sm font-semibold">+{selectedItem.stats.damage} Damage{d && <DiffBadge diff={d.damage} />}</p>
                  )}
                  {selectedItem.stats.hp !== undefined && (
                    <p className="text-green-400 text-sm font-semibold">+{selectedItem.stats.hp} Max HP{d && <DiffBadge diff={d.hp} />}</p>
                  )}
                  {selectedItem.stats.attackSpeed !== undefined && (
                    <p className="text-blue-400 text-sm font-semibold">{selectedItem.stats.attackSpeed >= 0 ? '+' : ''}{selectedItem.stats.attackSpeed.toFixed(2)} Atk Speed{d && <DiffBadgeF diff={d.attackSpeed} decimals={2} />}</p>
                  )}
                  {selectedItem.stats.critChance !== undefined && (
                    <p className="text-yellow-400 text-sm font-semibold">+{(selectedItem.stats.critChance * 100).toFixed(0)}% Crit{d && <DiffBadge diff={Math.round(d.critChance * 100)} />}</p>
                  )}
                  {selectedItem.stats.dodgeChance !== undefined && (
                    <p className="text-cyan-400 text-sm font-semibold">+{(selectedItem.stats.dodgeChance * 100).toFixed(0)}% Dodge{d && <DiffBadge diff={Math.round(d.dodgeChance * 100)} />}</p>
                  )}
                  {selectedItem.stats.lifesteal !== undefined && (
                    <p className="text-emerald-400 text-sm font-semibold">+{selectedItem.stats.lifesteal} Lifesteal{d && <DiffBadge diff={d.lifesteal} />}</p>
                  )}
                  {selectedItem.stats.damageReduction !== undefined && (
                    <p className="text-orange-400 text-sm font-semibold">+{selectedItem.stats.damageReduction} DR{d && <DiffBadge diff={d.damageReduction} />}</p>
                  )}
                  {selectedItem.equipSlot !== 'potion' && (<>
                    {selectedItem.stats.hp              === undefined && (equipment[selectedItem.equipSlot as EquipSlot]?.stats.hp              ?? 0) > 0   && <p className="text-green-400/50 text-sm font-semibold">Max HP {d && <DiffBadge diff={d!.hp} />}</p>}
                    {selectedItem.stats.damage          === undefined && (equipment[selectedItem.equipSlot as EquipSlot]?.stats.damage          ?? 0) > 0   && <p className="text-red-400/50 text-sm font-semibold">Damage {d && <DiffBadge diff={d!.damage} />}</p>}
                    {selectedItem.stats.attackSpeed     === undefined && (equipment[selectedItem.equipSlot as EquipSlot]?.stats.attackSpeed     ?? 0) !== 0 && <p className="text-blue-400/50 text-sm font-semibold">Atk Speed {d && <DiffBadgeF diff={d!.attackSpeed} decimals={2} />}</p>}
                    {selectedItem.stats.critChance      === undefined && (equipment[selectedItem.equipSlot as EquipSlot]?.stats.critChance      ?? 0) > 0   && <p className="text-yellow-400/50 text-sm font-semibold">Crit {d && <DiffBadge diff={Math.round(d!.critChance * 100)} />}</p>}
                    {selectedItem.stats.dodgeChance     === undefined && (equipment[selectedItem.equipSlot as EquipSlot]?.stats.dodgeChance     ?? 0) > 0   && <p className="text-cyan-400/50 text-sm font-semibold">Dodge {d && <DiffBadge diff={Math.round(d!.dodgeChance * 100)} />}</p>}
                    {selectedItem.stats.lifesteal       === undefined && (equipment[selectedItem.equipSlot as EquipSlot]?.stats.lifesteal       ?? 0) > 0   && <p className="text-emerald-400/50 text-sm font-semibold">Lifesteal {d && <DiffBadge diff={d!.lifesteal} />}</p>}
                    {selectedItem.stats.damageReduction === undefined && (equipment[selectedItem.equipSlot as EquipSlot]?.stats.damageReduction ?? 0) > 0   && <p className="text-orange-400/50 text-sm font-semibold">DR {d && <DiffBadge diff={d!.damageReduction} />}</p>}
                  </>)}
                </>
              )
            })()}
          </div>

          {/* Action button */}
          <div className="mt-auto pt-2 flex flex-col gap-2">
            {selectedFrom === 'backpack' ? (
              <>
                <button
                  onClick={() => {
                    selectedItem.equipSlot === 'potion' ? onEquipPotion(selectedItem) : onEquip(selectedItem)
                    onClear()
                  }}
                  className="w-full border border-amber-500 text-amber-400 py-2 rounded-lg text-sm font-bold uppercase tracking-widest hover:bg-amber-500/10 transition-colors"
                >
                  {selectedItem.equipSlot === 'potion' ? 'Equip to Belt' : 'Equip'}
                </button>
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
    backpack, equipment, equipItem, unequipItem, sellItem, player, talents,
    potionBelt, equipPotion, unequipPotion,
  } = useGameStore()
  const eff = getEffectiveStats(player, equipment, talents)

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
        onEquip={equipItem}
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
