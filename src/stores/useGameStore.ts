import { create } from 'zustand'

// ─── Types ────────────────────────────────────────────────────────────────────

export type View = 'battle' | 'inventory' | 'hub'

export type EquipSlot =
  | 'head' | 'chest' | 'legs'
  | 'mainHand' | 'offHand'
  | 'amulet' | 'ring1' | 'ring2'
  | 'spell'

export type Rarity = 'common' | 'rare' | 'epic'

export const RARITY_COLORS: Record<Rarity, { text: string; border: string; glow: string }> = {
  common: { text: 'text-gray-300',   border: 'border-gray-500',   glow: '' },
  rare:   { text: 'text-blue-400',   border: 'border-blue-500',   glow: 'ring-1 ring-blue-500/40' },
  epic:   { text: 'text-purple-400', border: 'border-purple-500', glow: 'ring-1 ring-purple-500/40' },
}

export interface ItemAbility {
  name: string
  description: string
  cooldown: number        // milliseconds
  effectType: 'damageEnemy'
  value: number
}

export interface Item {
  id: string
  name: string
  equipSlot: EquipSlot
  rarity: Rarity
  description: string
  stats: { hp?: number; damage?: number; attackSpeed?: number }
  ability?: ItemAbility
}

export interface Player {
  name: string
  maxHp: number
  currentHp: number
  baseDamage: number
  attackSpeed: number // attacks per second
}

export interface Mob {
  name: string
  maxHp: number
  currentHp: number
  baseDamage: number
  attackSpeed: number // attacks per second
}

export interface MapNode {
  id: string            // "{floor}-{index}", e.g. "3-1"
  floor: number         // 1–11
  type: 'mob' | 'elite' | 'boss' | 'rest' | 'chest'
  connectedTo: string[] // IDs of nodes on floor+1 this leads to
  isCompleted: boolean
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_PLAYER: Player = {
  name: 'Fighter',
  maxHp: 100,
  currentHp: 100,
  baseDamage: 12,
  attackSpeed: 1.2,
}

const ORC_GRUNT: Mob = {
  name: 'Orc Grunt',
  maxHp: 80,
  currentHp: 80,
  baseDamage: 8,
  attackSpeed: 0.8,
}

const EMPTY_EQUIPMENT: Record<EquipSlot, Item | null> = {
  head: null, chest: null, legs: null,
  mainHand: null, offHand: null,
  amulet: null, ring1: null, ring2: null,
  spell: null,
}

// ─── Loot ─────────────────────────────────────────────────────────────────────

type ItemBase = Omit<Item, 'id'>

const COMMON_POOL: ItemBase[] = [
  { name: 'Rusty Sword',    equipSlot: 'mainHand', rarity: 'common', description: 'A chipped blade found near the entrance.',       stats: { damage: 5 } },
  { name: 'Worn Buckler',   equipSlot: 'offHand',  rarity: 'common', description: 'A dented buckler, still blocks a punch.',        stats: { hp: 6 } },
  { name: 'Iron Shield',    equipSlot: 'offHand',  rarity: 'common', description: 'Reliable protection against basic threats.',     stats: { hp: 10 } },
  { name: 'Leather Helm',   equipSlot: 'head',     rarity: 'common', description: 'Cracked but still better than nothing.',         stats: { hp: 5 } },
  { name: 'Cloth Coif',     equipSlot: 'head',     rarity: 'common', description: 'Light fabric hood, surprisingly nimble.',        stats: { attackSpeed: 0.1 } },
  { name: 'Chain Mail',     equipSlot: 'chest',    rarity: 'common', description: 'Heavy rings of iron laced together.',            stats: { hp: 15 } },
  { name: 'Torn Greaves',   equipSlot: 'legs',     rarity: 'common', description: 'Worn leather guards for the legs.',              stats: { hp: 8 } },
  { name: 'Copper Amulet',  equipSlot: 'amulet',   rarity: 'common', description: 'Faint magic lingers on the metal.',              stats: { attackSpeed: 0.1 } },
  { name: 'Iron Band',      equipSlot: 'ring1',    rarity: 'common', description: 'A plain ring of cold iron.',                     stats: { damage: 2 } },
  { name: 'Silver Ring',    equipSlot: 'ring2',    rarity: 'common', description: 'Engraved with a small rune.',                    stats: { hp: 5 } },
  { name: 'Apprentice Ring',equipSlot: 'ring2',    rarity: 'common', description: 'A student\'s first attempt at enchantment.',     stats: { attackSpeed: 0.1 } },
  { name: 'Flame Scroll',   equipSlot: 'spell',    rarity: 'common', description: 'A tattered scroll pulsing with heat.',           stats: { damage: 1 }, ability: { name: 'Fireball', description: 'Deals 25 damage.', cooldown: 12000, effectType: 'damageEnemy', value: 25 } },
]

const RARE_POOL: ItemBase[] = [
  { name: 'Steel Longsword', equipSlot: 'mainHand', rarity: 'rare', description: 'A well-balanced blade forged in the city smithy.',    stats: { damage: 8,  attackSpeed: 0.15 } },
  { name: 'Guardian Ward',   equipSlot: 'offHand',  rarity: 'rare', description: 'A warded buckler imbued with defensive sigils.',      stats: { hp: 15,     attackSpeed: 0.1 } },
  { name: "Soldier's Helm",  equipSlot: 'head',     rarity: 'rare', description: 'Forged for the front lines, dented but proud.',       stats: { hp: 12,     damage: 4 } },
  { name: 'Battle Plate',    equipSlot: 'chest',    rarity: 'rare', description: 'Thick iron plates riveted over a chain base.',        stats: { hp: 20,     damage: 5 } },
  { name: 'Iron Wargreaves', equipSlot: 'legs',     rarity: 'rare', description: 'Heavy sabatons that stomp with authority.',           stats: { hp: 12,     attackSpeed: 0.1 } },
  { name: 'Jade Amulet',     equipSlot: 'amulet',   rarity: 'rare', description: 'Cool jade carved into a serpent devouring its tail.', stats: { hp: 10,     attackSpeed: 0.2 } },
  { name: 'Serpent Ring',    equipSlot: 'ring1',    rarity: 'rare', description: 'A coiled serpent whose fangs bite the wearer\'s foe.',stats: { damage: 4,  hp: 8 } },
  { name: 'Frost Tome',      equipSlot: 'spell',    rarity: 'rare', description: 'Pages inscribed in permafrost runes.',                stats: { damage: 3,  attackSpeed: 0.1 }, ability: { name: 'Ice Lance', description: 'Deals 30 damage.', cooldown: 10000, effectType: 'damageEnemy', value: 30 } },
]

const EPIC_POOL: ItemBase[] = [
  { name: 'Doom Blade',        equipSlot: 'mainHand', rarity: 'epic', description: 'A cursed edge that hungers for more.',                    stats: { damage: 15, hp: 10,     attackSpeed: 0.2 } },
  { name: 'Dragon Scale Helm', equipSlot: 'head',     rarity: 'epic', description: 'Scales pried from a slain wyvern, still warm.',           stats: { hp: 20,     damage: 6,   attackSpeed: 0.15 } },
  { name: "Titan's Plate",     equipSlot: 'chest',    rarity: 'epic', description: 'Armor worn by a giant — resized, barely.',                 stats: { hp: 30,     damage: 8,   attackSpeed: 0.1 } },
  { name: 'Abyssal Greaves',   equipSlot: 'legs',     rarity: 'epic', description: 'Forged in the deep dark; they move before you do.',        stats: { hp: 18,     damage: 5,   attackSpeed: 0.15 } },
  { name: 'Void Ring',         equipSlot: 'ring2',    rarity: 'epic', description: 'Stares back at you when you look into its gem.',           stats: { damage: 8,  hp: 15,     attackSpeed: 0.2 } },
  { name: 'Thunder Codex',     equipSlot: 'spell',    rarity: 'epic', description: 'Lightning trapped between two pages — barely contained.', stats: { damage: 5,  hp: 10,     attackSpeed: 0.2 }, ability: { name: 'Lightning Strike', description: 'Deals 50 damage.', cooldown: 15000, effectType: 'damageEnemy', value: 50 } },
]

function newItemId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

function getWeightedRandomItem(): Item {
  const roll = Math.random()
  const pool = roll < 0.70 ? COMMON_POOL : roll < 0.95 ? RARE_POOL : EPIC_POOL
  return { ...pool[Math.floor(Math.random() * pool.length)], id: newItemId() }
}

function randomDrop(): Item {
  return getWeightedRandomItem()
}

function randomThreeDrops(): Item[] {
  const result: Item[] = []
  const usedNames = new Set<string>()
  let attempts = 0
  while (result.length < 3 && attempts < 50) {
    const item = getWeightedRandomItem()
    if (!usedNames.has(item.name)) {
      result.push(item)
      usedNames.add(item.name)
    }
    attempts++
  }
  return result
}

// ─── Map generation helpers ───────────────────────────────────────────────────

const MID_FLOOR_TYPES: MapNode['type'][] = ['mob', 'mob', 'rest', 'chest']

function buildMap(): MapNode[][] {
  const floors: MapNode[][] = []

  for (let f = 1; f <= 11; f++) {
    let types: MapNode['type'][]

    if (f === 1) {
      types = ['mob']
    } else if (f === 11) {
      types = ['boss']
    } else {
      const count = Math.random() < 0.5 ? 2 : 3
      types = Array.from({ length: count }, () =>
        MID_FLOOR_TYPES[Math.floor(Math.random() * MID_FLOOR_TYPES.length)]
      )
    }

    floors.push(
      types.map((type, i) => ({
        id: `${f}-${i}`,
        floor: f,
        type,
        connectedTo: [],
        isCompleted: false,
      }))
    )
  }

  for (let fi = 0; fi < 10; fi++) {
    const current = floors[fi]
    const next = floors[fi + 1]

    for (const node of current) {
      const maxConns = Math.min(next.length, current.length === 1 ? 2 : 1)
      const shuffled = [...next].sort(() => Math.random() - 0.5)
      shuffled.slice(0, maxConns).forEach((n) => {
        if (!node.connectedTo.includes(n.id)) node.connectedTo.push(n.id)
      })
    }

    for (const nextNode of next) {
      const hasIncoming = current.some((n) => n.connectedTo.includes(nextNode.id))
      if (!hasIncoming) {
        const pick = current[Math.floor(Math.random() * current.length)]
        if (!pick.connectedTo.includes(nextNode.id)) pick.connectedTo.push(nextNode.id)
      }
    }
  }

  return floors
}

// ─── Derived stats ────────────────────────────────────────────────────────────

export function getEffectiveStats(
  player: Player,
  equipment: Record<EquipSlot, Item | null>
) {
  const items = Object.values(equipment).filter(Boolean) as Item[]
  return {
    maxHp:       player.maxHp       + items.reduce((s, i) => s + (i.stats.hp          ?? 0), 0),
    damage:      player.baseDamage  + items.reduce((s, i) => s + (i.stats.damage      ?? 0), 0),
    attackSpeed: player.attackSpeed + items.reduce((s, i) => s + (i.stats.attackSpeed ?? 0), 0),
  }
}

// ─── Store ────────────────────────────────────────────────────────────────────

const TICK_MS = 50
const SHIELD_BASH_COOLDOWN_MS = 8000
const SHIELD_BASH_DAMAGE = 5
const XP_PER_KILL = 20
const XP_PER_CHEST = 25
const REST_HEAL = 30

interface GameStore {
  // Navigation
  activeView: View
  setActiveView: (view: View) => void

  // Map state
  act1Map: MapNode[][]
  currentFloor: number
  currentMapNodeId: string | null
  isMapVisible: boolean
  playerXp: number
  generateMap: () => void
  chooseNode: (nodeId: string) => void

  // Combat state
  player: Player
  currentMob: Mob
  playerAttackProgress: number
  mobAttackProgress: number
  isCombatActive: boolean

  // Skills state
  shieldBashCooldown: number
  equippedSpellCooldown: number

  // Inventory state
  backpack: Item[]
  equipment: Record<EquipSlot, Item | null>

  // Loot picker state
  lootChoices: Item[]
  isLootPickerVisible: boolean

  // Combat actions
  startCombat: () => void
  tickCombat: () => void
  useShieldBash: () => void
  useEquippedSpell: () => void
  resetRun: () => void

  // Inventory actions
  equipItem: (item: Item) => void
  unequipItem: (slotKey: string) => void

  // Loot picker actions
  selectLoot: (item: Item) => void
}

export const useGameStore = create<GameStore>((set) => ({
  // ── Navigation ──────────────────────────────────────────────────────────────
  activeView: 'battle',
  setActiveView: (view) => set({ activeView: view }),

  // ── Map state ───────────────────────────────────────────────────────────────
  act1Map: [],
  currentFloor: 1,
  currentMapNodeId: null,
  isMapVisible: false,
  playerXp: 0,

  // ── generateMap ─────────────────────────────────────────────────────────────
  generateMap: () =>
    set({
      act1Map: buildMap(),
      currentFloor: 1,
      currentMapNodeId: null,
      isMapVisible: true,
      playerXp: 0,
      player: { ...DEFAULT_PLAYER },
      backpack: [],
      equipment: { ...EMPTY_EQUIPMENT },
      lootChoices: [],
      isLootPickerVisible: false,
    }),

  // ── chooseNode ──────────────────────────────────────────────────────────────
  chooseNode: (nodeId) =>
    set((state) => {
      const allNodes = state.act1Map.flat()
      const node = allNodes.find((n) => n.id === nodeId)

      if (!node) return state
      if (node.floor !== state.currentFloor) return state
      if (node.isCompleted) return state

      if (state.currentMapNodeId !== null) {
        const prev = allNodes.find((n) => n.id === state.currentMapNodeId)
        if (!prev || !prev.connectedTo.includes(nodeId)) return state
      }

      const markComplete = (map: MapNode[][]): MapNode[][] =>
        map.map((floor) =>
          floor.map((n) => (n.id === nodeId ? { ...n, isCompleted: true } : n))
        )

      if (node.type === 'mob' || node.type === 'elite' || node.type === 'boss') {
        return {
          currentMapNodeId: nodeId,
          isMapVisible: false,
          currentMob: { ...ORC_GRUNT },
          playerAttackProgress: 0,
          mobAttackProgress: 0,
          shieldBashCooldown: 0,
          equippedSpellCooldown: 0,
          isCombatActive: true,
        }
      }

      if (node.type === 'rest') {
        return {
          currentMapNodeId: nodeId,
          currentFloor: state.currentFloor + 1,
          act1Map: markComplete(state.act1Map),
          player: {
            ...state.player,
            currentHp: Math.min(state.player.maxHp, state.player.currentHp + REST_HEAL),
          },
        }
      }

      if (node.type === 'chest') {
        return {
          currentMapNodeId: nodeId,
          currentFloor: state.currentFloor + 1,
          act1Map: markComplete(state.act1Map),
          playerXp: state.playerXp + XP_PER_CHEST,
          lootChoices: randomThreeDrops(),
          isLootPickerVisible: true,
        }
      }

      return state
    }),

  // ── Combat state ────────────────────────────────────────────────────────────
  player: { ...DEFAULT_PLAYER },
  currentMob: { ...ORC_GRUNT },
  playerAttackProgress: 0,
  mobAttackProgress: 0,
  isCombatActive: false,

  // ── Skills state ────────────────────────────────────────────────────────────
  shieldBashCooldown: 0,
  equippedSpellCooldown: 0,

  // ── Inventory state ─────────────────────────────────────────────────────────
  backpack: [],
  equipment: { ...EMPTY_EQUIPMENT },

  // ── Loot picker state ───────────────────────────────────────────────────────
  lootChoices: [],
  isLootPickerVisible: false,

  // ── startCombat ─────────────────────────────────────────────────────────────
  startCombat: () =>
    set({
      currentMob: { ...ORC_GRUNT },
      playerAttackProgress: 0,
      mobAttackProgress: 0,
      shieldBashCooldown: 0,
      equippedSpellCooldown: 0,
      isCombatActive: true,
    }),

  // ── useShieldBash ───────────────────────────────────────────────────────────
  useShieldBash: () =>
    set((state) => {
      if (!state.isCombatActive || state.shieldBashCooldown > 0) return state

      const mob = { ...state.currentMob }
      mob.currentHp = Math.max(0, mob.currentHp - SHIELD_BASH_DAMAGE)

      return {
        currentMob: mob,
        mobAttackProgress: 0,
        shieldBashCooldown: SHIELD_BASH_COOLDOWN_MS,
        isCombatActive: mob.currentHp > 0 && state.player.currentHp > 0,
      }
    }),

  // ── useEquippedSpell ────────────────────────────────────────────────────────
  useEquippedSpell: () =>
    set((state) => {
      const spell = state.equipment.spell
      if (!state.isCombatActive || !spell?.ability || state.equippedSpellCooldown > 0) return state

      const { ability } = spell
      const mob = { ...state.currentMob }

      if (ability.effectType === 'damageEnemy') {
        mob.currentHp = Math.max(0, mob.currentHp - ability.value)
      }

      return {
        currentMob: mob,
        equippedSpellCooldown: ability.cooldown,
        isCombatActive: mob.currentHp > 0 && state.player.currentHp > 0,
      }
    }),

  // ── resetRun ────────────────────────────────────────────────────────────────
  resetRun: () =>
    set((state) => ({
      act1Map: buildMap(),
      currentFloor: 1,
      currentMapNodeId: null,
      isMapVisible: true,
      player: { ...state.player, currentHp: state.player.maxHp },
      currentMob: { ...ORC_GRUNT },
      playerAttackProgress: 0,
      mobAttackProgress: 0,
      shieldBashCooldown: 0,
      equippedSpellCooldown: 0,
      isCombatActive: false,
      activeView: 'battle',
      backpack: [],
      equipment: { ...EMPTY_EQUIPMENT },
      lootChoices: [],
      isLootPickerVisible: false,
    })),

  // ── equipItem ───────────────────────────────────────────────────────────────
  // Moves item from backpack to its equipment slot. Swaps if slot is occupied.
  equipItem: (item) =>
    set((state) => {
      const existing = state.equipment[item.equipSlot]
      const newBackpack = state.backpack.filter((i) => i.id !== item.id)
      if (existing) newBackpack.push(existing)
      return {
        backpack: newBackpack,
        equipment: { ...state.equipment, [item.equipSlot]: item },
      }
    }),

  // ── unequipItem ─────────────────────────────────────────────────────────────
  // Moves item from equipment slot back to backpack.
  unequipItem: (slotKey) =>
    set((state) => {
      const item = state.equipment[slotKey as EquipSlot]
      if (!item) return state
      const newEquipment = { ...state.equipment, [slotKey]: null }
      const newMaxHp = getEffectiveStats(state.player, newEquipment).maxHp
      return {
        equipment: newEquipment,
        backpack: [...state.backpack, item],
        player: { ...state.player, currentHp: Math.min(state.player.currentHp, newMaxHp) },
      }
    }),

  // ── selectLoot ──────────────────────────────────────────────────────────────
  selectLoot: (item) =>
    set((state) => ({
      backpack: [...state.backpack, item],
      lootChoices: [],
      isLootPickerVisible: false,
    })),

  // ── tickCombat ──────────────────────────────────────────────────────────────
  tickCombat: () =>
    set((state) => {
      if (!state.isCombatActive) return state

      let playerAttackProgress = state.playerAttackProgress
      let mobAttackProgress = state.mobAttackProgress
      const player = { ...state.player }
      const mob = { ...state.currentMob }
      const eff = getEffectiveStats(state.player, state.equipment)

      playerAttackProgress += eff.attackSpeed * (TICK_MS / 1000) * 100
      mobAttackProgress += mob.attackSpeed * (TICK_MS / 1000) * 100

      if (playerAttackProgress >= 100) {
        playerAttackProgress -= 100
        mob.currentHp = Math.max(0, mob.currentHp - eff.damage)
      }

      if (mobAttackProgress >= 100) {
        mobAttackProgress -= 100
        player.currentHp = Math.max(0, player.currentHp - mob.baseDamage)
      }

      const shieldBashCooldown = Math.max(0, state.shieldBashCooldown - TICK_MS)
      const equippedSpellCooldown = Math.max(0, state.equippedSpellCooldown - TICK_MS)
      const isCombatActive = mob.currentHp > 0 && player.currentHp > 0

      // Player wins: return to map, award XP + loot, mark node complete
      if (!isCombatActive && mob.currentHp <= 0) {
        const act1Map = state.act1Map.map((floor) =>
          floor.map((n) =>
            n.id === state.currentMapNodeId ? { ...n, isCompleted: true } : n
          )
        )
        const drop = randomDrop()
        return {
          player,
          currentMob: mob,
          playerAttackProgress,
          mobAttackProgress,
          shieldBashCooldown,
          equippedSpellCooldown,
          isCombatActive: false,
          isMapVisible: true,
          currentFloor: state.currentFloor + 1,
          playerXp: state.playerXp + XP_PER_KILL,
          act1Map,
          backpack: [...state.backpack, drop],
        }
      }

      return {
        player,
        currentMob: mob,
        playerAttackProgress,
        mobAttackProgress,
        shieldBashCooldown,
        equippedSpellCooldown,
        isCombatActive,
      }
    }),
}))
