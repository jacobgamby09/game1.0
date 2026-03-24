import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { pickItemForFloor } from '../utils/itemLibrary'

// ─── Types ────────────────────────────────────────────────────────────────────

export type View = 'battle' | 'inventory' | 'hub'

export type EquipSlot =
  | 'head' | 'chest' | 'legs'
  | 'mainHand' | 'offHand'
  | 'amulet' | 'ring1' | 'ring2'
  | 'spell'

export type ItemSlot = EquipSlot | 'potion'

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic'

export const RARITY_COLORS: Record<Rarity, { text: string; border: string; glow: string }> = {
  common:   { text: 'text-gray-300',   border: 'border-gray-500',   glow: '' },
  uncommon: { text: 'text-teal-400',   border: 'border-teal-500',   glow: 'ring-1 ring-teal-500/40' },
  rare:     { text: 'text-blue-400',   border: 'border-blue-500',   glow: 'ring-1 ring-blue-500/40' },
  epic:     { text: 'text-purple-400', border: 'border-purple-500', glow: 'ring-1 ring-purple-500/40' },
}

// ─── Talent System ────────────────────────────────────────────────────────────

export type TalentBranch = 'vitality' | 'might' | 'celerity'

export interface TalentNode {
  id: string
  name: string
  description: string
  maxRank: number
  costPerRank: number
  branch: TalentBranch
  tier: number              // 1 = top of branch; tier N requires tier N-1 rank >= 1
  effect: {
    type: 'flat' | 'percent'
    stat: 'hp' | 'damage' | 'attackSpeed' | 'damageReduction' | 'critChance' | 'dodgeChance'
        | 'lifesteal' | 'postCombatHealPct' | 'eliteBonusMultiplier' | 'executionThreshold'
        | 'undying' | 'frenzy'
    valuePerRank: number
  }
}

export const TALENT_TREE: TalentNode[] = [
  // ── Vitality ──────────────────────────────────────────────────────────────
  { id:'vit_1', branch:'vitality', tier:1, name:'Fortitude',    description:'+5 Max HP per point',               maxRank:5, costPerRank:1, effect:{type:'flat',    stat:'hp',                   valuePerRank:5    }},
  { id:'vit_2', branch:'vitality', tier:2, name:'Thick Skin',   description:'+1 Damage Reduction per point',     maxRank:3, costPerRank:1, effect:{type:'flat',    stat:'damageReduction',       valuePerRank:1    }},
  { id:'vit_3', branch:'vitality', tier:3, name:'Field Medic',  description:'Heal 5% Max HP after combat/point', maxRank:3, costPerRank:2, effect:{type:'flat',    stat:'postCombatHealPct',     valuePerRank:0.05 }},
  { id:'vit_4', branch:'vitality', tier:4, name:'Undying',      description:'Revive once per run at 30% HP',     maxRank:1, costPerRank:3, effect:{type:'flat',    stat:'undying',               valuePerRank:1    }},

  // ── Might ─────────────────────────────────────────────────────────────────
  { id:'mgt_1', branch:'might',    tier:1, name:'Brutality',    description:'+1 Base Damage per point',          maxRank:5, costPerRank:1, effect:{type:'flat',    stat:'damage',                valuePerRank:1    }},
  { id:'mgt_2', branch:'might',    tier:2, name:'Precision',    description:'+5% Crit Chance per point',         maxRank:5, costPerRank:1, effect:{type:'flat',    stat:'critChance',            valuePerRank:0.05 }},
  { id:'mgt_3', branch:'might',    tier:3, name:'Giant Slayer', description:'+15% dmg vs Elites & Bosses/point', maxRank:3, costPerRank:2, effect:{type:'flat',    stat:'eliteBonusMultiplier',  valuePerRank:0.15 }},
  { id:'mgt_4', branch:'might',    tier:4, name:'Executioner',  description:'Instantly kill enemies below 15%',  maxRank:1, costPerRank:3, effect:{type:'flat',    stat:'executionThreshold',    valuePerRank:0.15 }},

  // ── Celerity ──────────────────────────────────────────────────────────────
  { id:'cel_1', branch:'celerity', tier:1, name:'Quick Hands',  description:'+5% Attack Speed per point',        maxRank:5, costPerRank:1, effect:{type:'percent', stat:'attackSpeed',           valuePerRank:0.05 }},
  { id:'cel_2', branch:'celerity', tier:2, name:'Agility',      description:'+3% Dodge Chance per point',        maxRank:5, costPerRank:1, effect:{type:'flat',    stat:'dodgeChance',           valuePerRank:0.03 }},
  { id:'cel_3', branch:'celerity', tier:3, name:'Vampirism',    description:'+1 Lifesteal per point',            maxRank:3, costPerRank:2, effect:{type:'flat',    stat:'lifesteal',             valuePerRank:1    }},
  { id:'cel_4', branch:'celerity', tier:4, name:'Frenzy',       description:'2× Attack Speed below 30% HP',      maxRank:1, costPerRank:3, effect:{type:'flat',    stat:'frenzy',                valuePerRank:1    }},
]

export function getItemSellValue(rarity: Rarity): number {
  const VALUES: Record<Rarity, number> = { common: 5, uncommon: 12, rare: 25, epic: 55 }
  return VALUES[rarity]
}

export function computeAvailablePoints(totalXp: number, talents: Record<string, number>): number {
  const spent = TALENT_TREE.reduce((s, n) => s + (talents[n.id] ?? 0) * n.costPerRank, 0)
  return Math.floor(totalXp / 100) - spent
}

export function computePlayerLevel(totalXp: number): number {
  return Math.floor(totalXp / 100) + 1
}

// ─── Damage Indicator ─────────────────────────────────────────────────────────

export interface DamageIndicator {
  id: number
  value: number
  isCrit: boolean
  isSkill: boolean      // true for Shield Bash / spell damage
  target: 'player' | 'enemy'
  createdAt: number
}

// ─── Item / Player types ──────────────────────────────────────────────────────

export interface ItemAbility {
  name: string
  description: string
  cooldown: number        // milliseconds
  effectType: 'damageEnemy'
  value: number
}

export interface ConsumableEffect {
  type: 'heal' | 'freezeEnemy' | 'berserk' | 'lifestealBuff' | 'midas'
  value?: number        // heal fraction (0.3), lifesteal amount
  durationMS?: number   // for timed buffs
  charges?: number      // for charge-based buffs
}

export interface ActiveBuff {
  type: 'freezeEnemy' | 'berserk' | 'lifestealBuff' | 'midas'
  expiresAt?: number    // Date.now() + durationMS
  charges?: number
  value?: number
}

export interface Item {
  id: string
  name: string
  equipSlot: ItemSlot
  rarity: Rarity
  description: string
  stats: {
    hp?:              number
    damage?:          number
    attackSpeed?:     number
    critChance?:      number
    dodgeChance?:     number
    lifesteal?:       number
    damageReduction?: number
  }
  ability?: ItemAbility
  consumableEffect?: ConsumableEffect
}

export interface Player {
  name: string
  playerClass: string
  maxHp: number
  currentHp: number
  baseDamage: number
  attackSpeed: number // attacks per second
  gold: number        // per-run; resets on new run / death
}

export interface RunStats {
  monstersKilled: number
  goldGathered: number
}

export interface RunSummary {
  active: boolean
  status: 'dead' | 'victory'
  previousTotalXp: number
  goldAtDeath: number
}

export type MobTier = 'normal' | 'elite' | 'boss'

export interface Mob {
  name: string
  maxHp: number
  currentHp: number
  baseDamage: number
  attackSpeed: number // attacks per second
  tier: MobTier
}

export interface MapNode {
  id: string            // "{floor}-{index}", e.g. "3-1"
  floor: number         // 1–20
  type: 'mob' | 'elite' | 'boss' | 'rest' | 'chest' | 'market'
  connectedTo: string[] // IDs of nodes on floor+1 this leads to
  isCompleted: boolean
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_PLAYER: Player = {
  name: 'Fighter',
  playerClass: 'Fighter',
  maxHp: 100,
  currentHp: 100,
  baseDamage: 12,
  attackSpeed: 0.45,
  gold: 0,
}

// ─── Bestiary ─────────────────────────────────────────────────────────────────

type MobBase = Omit<Mob, 'tier' | 'currentHp'>

const BESTIARY: MobBase[] = [
  { name: 'Goblin Rogue',  maxHp: 20,  baseDamage: 3,  attackSpeed: 0.30 },
  { name: 'Undead Brute',  maxHp: 45,  baseDamage: 9,  attackSpeed: 0.90 },
  { name: 'Orc Warrior',   maxHp: 40,  baseDamage: 7,  attackSpeed: 0.55 },
]

const VOID_WARDEN_BASE: MobBase = {
  name: 'The Void Warden', maxHp: 200, baseDamage: 15, attackSpeed: 0.65,
}

function spawnMob(floor: number, nodeType: 'mob' | 'elite' | 'boss'): Mob {
  const floorMult = 1 + floor * 0.10

  let base: MobBase
  let tier: MobTier

  if (nodeType === 'boss') {
    base = { ...VOID_WARDEN_BASE }
    tier = 'boss'
  } else {
    base = { ...BESTIARY[Math.floor(Math.random() * BESTIARY.length)] }
    if (nodeType === 'elite') {
      base = { ...base, maxHp: base.maxHp * 2, baseDamage: base.baseDamage * 2 }
      tier = 'elite'
    } else {
      tier = 'normal'
    }
  }

  const scaledHp  = Math.round(base.maxHp     * floorMult)
  const scaledDmg = Math.round(base.baseDamage * floorMult)

  return {
    name:        base.name,
    maxHp:       scaledHp,
    currentHp:   scaledHp,
    baseDamage:  scaledDmg,
    attackSpeed: base.attackSpeed,
    tier,
  }
}

const EMPTY_EQUIPMENT: Record<EquipSlot, Item | null> = {
  head: null, chest: null, legs: null,
  mainHand: null, offHand: null,
  amulet: null, ring1: null, ring2: null,
  spell: null,
}

// ─── Loot helpers ─────────────────────────────────────────────────────────────

function itemPrice(rarity: Rarity): number {
  const [lo, hi] = rarity === 'common'   ? [20,  30]
                 : rarity === 'uncommon' ? [45,  65]
                 : rarity === 'rare'     ? [100, 140]
                 :                         [220, 280]
  return Math.floor(Math.random() * (hi - lo + 1)) + lo
}

function generateMarketItems(floor: number): { item: Item; price: number }[] {
  const result: { item: Item; price: number }[] = []
  const usedNames = new Set<string>()
  let attempts = 0
  while (result.length < 4 && attempts < 50) {
    const item = pickItemForFloor(floor)
    if (!usedNames.has(item.name)) {
      result.push({ item, price: itemPrice(item.rarity) })
      usedNames.add(item.name)
    }
    attempts++
  }
  return result
}

function randomDrop(floor: number): Item {
  return pickItemForFloor(floor)
}

function randomThreeDrops(floor: number): Item[] {
  const result: Item[] = []
  const usedNames = new Set<string>()
  let attempts = 0
  while (result.length < 3 && attempts < 50) {
    const item = pickItemForFloor(floor)
    if (!usedNames.has(item.name)) {
      result.push(item)
      usedNames.add(item.name)
    }
    attempts++
  }
  return result
}

// ─── Map generation helpers ───────────────────────────────────────────────────

const MID_FLOOR_TYPES: MapNode['type'][] = ['mob', 'mob', 'mob', 'mob', 'mob', 'mob', 'mob', 'rest', 'rest', 'chest']
const MARKET_FLOORS = new Set([5, 12, 17])

function buildMap(): MapNode[][] {
  const floors: MapNode[][] = []
  const eliteFloor2 = Math.floor(Math.random() * 4) + 15 // 15, 16, 17, or 18

  for (let f = 1; f <= 20; f++) {
    let types: MapNode['type'][]

    if (f === 1) {
      types = ['mob']
    } else if (MARKET_FLOORS.has(f)) {
      types = ['market']
    } else if (f === 10 || f === eliteFloor2) {
      types = ['elite']
    } else if (f === 20) {
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

  for (let fi = 0; fi < 19; fi++) {
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
  equipment: Record<EquipSlot, Item | null>,
  talents: Record<string, number> = {}
) {
  const items = Object.values(equipment).filter(Boolean) as Item[]

  let flatHp = 0, flatDmg = 0, flatSpd = 0
  let pctHp  = 0, pctDmg  = 0, pctSpd  = 0
  let flatDr = 0, flatCrit = 0, flatDodge = 0, flatLifesteal = 0
  let flatHealPct = 0, flatEliteBonus = 0, flatExecution = 0, flatUndying = 0, flatFrenzy = 0

  for (const node of TALENT_TREE) {
    const rank = talents[node.id] ?? 0
    if (rank === 0) continue
    const total = node.effect.valuePerRank * rank
    if (node.effect.type === 'flat') {
      if      (node.effect.stat === 'hp')                   flatHp          += total
      else if (node.effect.stat === 'damage')               flatDmg         += total
      else if (node.effect.stat === 'attackSpeed')          flatSpd         += total
      else if (node.effect.stat === 'damageReduction')      flatDr          += total
      else if (node.effect.stat === 'critChance')           flatCrit        += total
      else if (node.effect.stat === 'dodgeChance')          flatDodge       += total
      else if (node.effect.stat === 'lifesteal')            flatLifesteal   += total
      else if (node.effect.stat === 'postCombatHealPct')    flatHealPct     += total
      else if (node.effect.stat === 'eliteBonusMultiplier') flatEliteBonus  += total
      else if (node.effect.stat === 'executionThreshold')   flatExecution   += total
      else if (node.effect.stat === 'undying')              flatUndying     += total
      else if (node.effect.stat === 'frenzy')               flatFrenzy      += total
    } else {
      if      (node.effect.stat === 'hp')          pctHp  += total
      else if (node.effect.stat === 'damage')      pctDmg += total
      else if (node.effect.stat === 'attackSpeed') pctSpd += total
    }
  }

  const gearHp          = items.reduce((s, i) => s + (i.stats.hp              ?? 0), 0)
  const gearDmg         = items.reduce((s, i) => s + (i.stats.damage          ?? 0), 0)
  const gearSpd         = items.reduce((s, i) => s + (i.stats.attackSpeed     ?? 0), 0)
  const gearCritRaw     = items.reduce((s, i) => s + (i.stats.critChance      ?? 0), 0)
  const gearDodgeRaw    = items.reduce((s, i) => s + (i.stats.dodgeChance     ?? 0), 0)
  const gearLifesteal   = items.reduce((s, i) => s + (i.stats.lifesteal       ?? 0), 0)
  const gearDr          = items.reduce((s, i) => s + (i.stats.damageReduction ?? 0), 0)
  // Safety: if values were accidentally stored as integers (e.g. 10 instead of 0.10), normalise
  const gearCrit        = gearCritRaw  > 1 ? gearCritRaw  / 100 : gearCritRaw
  const gearDodge       = gearDodgeRaw > 1 ? gearDodgeRaw / 100 : gearDodgeRaw

  return {
    maxHp:                Math.floor((player.maxHp      + flatHp  + gearHp)  * (1 + pctHp)),
    damage:               Math.floor((player.baseDamage + flatDmg + gearDmg) * (1 + pctDmg)),
    attackSpeed:                     (player.attackSpeed + flatSpd + gearSpd) * (1 + pctSpd),
    damageReduction:      flatDr + gearDr,
    critChance:           flatCrit + gearCrit,
    dodgeChance:          flatDodge + gearDodge,
    lifesteal:            Math.floor(flatLifesteal + gearLifesteal),
    postCombatHealPct:    flatHealPct,
    eliteBonusMultiplier: flatEliteBonus,
    executionThreshold:   flatExecution,
    hasUndying:           flatUndying >= 1,
    hasFrenzy:            flatFrenzy >= 1,
  }
}

// ─── Mob-death patch helper ───────────────────────────────────────────────────
// Returns the state fields that should be set whenever a mob's HP hits 0.
// Calling it in one place ensures usePowerStrike, useEquippedSpell, and
// tickCombat all produce the same victory transition.

function mobDeathPatch(state: { act1Map: MapNode[][]; currentMapNodeId: string | null; currentMob: Mob | null; currentFloor: number; activeBuffs: ActiveBuff[] }) {
  const act1Map = state.act1Map.map((floor) =>
    floor.map((n) =>
      n.id === state.currentMapNodeId ? { ...n, isCompleted: true } : n
    )
  )
  const goldBase = Math.floor(Math.random() * 6) + 5  // 5–10
  const hasMidas = state.activeBuffs.some(b => b.type === 'midas')
  const goldAmount = (goldBase + state.currentFloor * 2)
    * (state.currentMob?.tier === 'elite' ? 2 : 1)
    * (hasMidas ? 3 : 1)
  return {
    act1Map,
    isCombatActive: false as const,
    isMapVisible:   false as const,
    combatReward: { xp: XP_PER_KILL, gold: goldAmount, item: randomDrop(state.currentFloor) },
    activeBuffs: [] as ActiveBuff[],
  }
}

// ─── Killing blow helper ──────────────────────────────────────────────────────
// Sets isKillingBlowActive, schedules the 800ms victory resolution, and returns
// the immediate state patch. Called from tickCombat, usePowerStrike, useEquippedSpell.

function triggerEnemyDeath(
  state: Parameters<typeof mobDeathPatch>[0],
  mob: Mob,
  extraPatch: object = {}
): object {
  const snapshot = { ...state, currentMob: mob }
  setTimeout(() => {
    useGameStore.setState((s) => {
      if (!s.isKillingBlowActive) return s
      return { ...mobDeathPatch(snapshot), isKillingBlowActive: false }
    })
  }, 800)
  return {
    currentMob: mob,
    isCombatActive: false,
    isKillingBlowActive: true,
    ...extraPatch,
  }
}

// ─── Store ────────────────────────────────────────────────────────────────────

const TICK_MS = 50
const POWER_STRIKE_COOLDOWN_MS = 5600
const XP_PER_KILL = 20
const XP_PER_CHEST = 25
export const MAX_POTION_STACK = 1
export const MAX_POTION_SLOTS = 1

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
  currentMob: Mob | null
  playerAttackProgress: number
  mobAttackProgress: number
  isCombatActive: boolean

  // Skills state
  powerStrikeCooldown: number
  equippedSpellCooldown: number

  // Inventory state
  backpack: Item[]
  equipment: Record<EquipSlot, Item | null>

  // Potion state
  potionBelt: { item: Item; count: number }[]
  activeBuffs: ActiveBuff[]

  // Loot picker state
  lootChoices: Item[]
  isLootPickerVisible: boolean

  // Event state
  combatReward: { xp: number; gold: number; item: Item } | null
  restEvent: { healedAmount: number } | null
  combatEventKey: number
  combatEventText: string | null

  // Market state
  marketItems: { item: Item; price: number }[] | null

  // Feedback state
  damageIndicators: DamageIndicator[]
  isKillingBlowActive: boolean

  // Run state
  usedUndyingThisRun: boolean
  currentRunStats: RunStats
  runSummary: RunSummary | null

  // Combat actions
  startCombat: () => void
  engageCombat: () => void
  tickCombat: () => void
  usePowerStrike: () => void
  useEquippedSpell: () => void
  collectCombatReward: () => void
  resetRun: () => void

  // Inventory actions
  equipItem: (item: Item) => void
  unequipItem: (slotKey: string) => void
  sellItem: (itemId: string) => void
  sellAllBackpack: () => void
  equipPotion: (item: Item) => void
  usePotion: (index: number) => void
  unequipPotion: (index: number) => void

  // Loot picker actions
  selectLoot: (item: Item) => void

  // Rest actions
  leaveCamp: () => void

  // Market actions
  buyItem: (item: Item, price: number) => void
  rerollMarket: () => void
  leaveMarket: () => void

  // Feedback actions
  addDamageIndicator: (indicator: DamageIndicator) => void

  // Meta-progression (persistent across runs)
  totalXp: number
  talents: Record<string, number>
  upgradeTalent: (nodeId: string) => void
  hardResetGame: () => void
}

export const useGameStore = create<GameStore>()(
  persist(
    (set) => ({
  // ── Navigation ──────────────────────────────────────────────────────────────
  activeView: 'hub',
  setActiveView: (view) => set({ activeView: view }),

  // ── Map state ───────────────────────────────────────────────────────────────
  act1Map: [],
  currentFloor: 1,
  currentMapNodeId: null,
  isMapVisible: false,
  playerXp: 0,

  // ── generateMap ─────────────────────────────────────────────────────────────
  generateMap: () =>
    set((state) => {
      const effMaxHp = getEffectiveStats({ ...DEFAULT_PLAYER }, { ...EMPTY_EQUIPMENT }, state.talents).maxHp
      return {
        act1Map: buildMap(),
        currentFloor: 1,
        currentMapNodeId: null,
        isMapVisible: true,
        activeView: 'battle' as const,
        player: { ...DEFAULT_PLAYER, currentHp: effMaxHp },
        lootChoices: [],
        isLootPickerVisible: false,
        combatReward: null,
        restEvent: null,
        marketItems: null,
        damageIndicators: [],
        isKillingBlowActive: false,
        usedUndyingThisRun: false,
        currentRunStats: { monstersKilled: 0, goldGathered: 0 },
        runSummary: null,
      }
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
          currentMob: spawnMob(node.floor, node.type),
          playerAttackProgress: 0,
          mobAttackProgress: 0,
          powerStrikeCooldown: 0,
          equippedSpellCooldown: 0,
          isCombatActive: false,
        }
      }

      if (node.type === 'rest') {
        const eff = getEffectiveStats(state.player, state.equipment, state.talents)
        const healAmount = Math.floor(eff.maxHp * 0.30)
        const newHp = Math.min(eff.maxHp, state.player.currentHp + healAmount)
        const actualHealed = newHp - state.player.currentHp
        return {
          currentMapNodeId: nodeId,
          currentFloor: state.currentFloor + 1,
          act1Map: markComplete(state.act1Map),
          player: { ...state.player, currentHp: newHp },
          restEvent: { healedAmount: actualHealed },
        }
      }

      if (node.type === 'chest') {
        return {
          currentMapNodeId: nodeId,
          currentFloor: state.currentFloor + 1,
          act1Map: markComplete(state.act1Map),
          playerXp: state.playerXp + XP_PER_CHEST,
          lootChoices: randomThreeDrops(state.currentFloor),
          isLootPickerVisible: true,
        }
      }

      if (node.type === 'market') {
        return {
          currentMapNodeId: nodeId,
          currentFloor: state.currentFloor + 1,
          act1Map: markComplete(state.act1Map),
          marketItems: generateMarketItems(state.currentFloor),
        }
      }

      return state
    }),

  // ── Run state ───────────────────────────────────────────────────────────────
  usedUndyingThisRun: false,
  currentRunStats: { monstersKilled: 0, goldGathered: 0 },
  runSummary: null,

  // ── Combat state ────────────────────────────────────────────────────────────
  player: { ...DEFAULT_PLAYER },
  currentMob: null,
  playerAttackProgress: 0,
  mobAttackProgress: 0,
  isCombatActive: false,

  // ── Skills state ────────────────────────────────────────────────────────────
  powerStrikeCooldown: 0,
  equippedSpellCooldown: 0,

  // ── Inventory state ─────────────────────────────────────────────────────────
  backpack: [],
  equipment: { ...EMPTY_EQUIPMENT },
  potionBelt: [],
  activeBuffs: [],

  // ── Loot picker state ───────────────────────────────────────────────────────
  lootChoices: [],
  isLootPickerVisible: false,

  // ── Event state ─────────────────────────────────────────────────────────────
  combatReward: null,
  restEvent: null,
  combatEventKey: 0,
  combatEventText: null,

  // ── Market state ────────────────────────────────────────────────────────────
  marketItems: null,

  // ── Feedback state ──────────────────────────────────────────────────────────
  damageIndicators: [],
  isKillingBlowActive: false,

  // ── startCombat ─────────────────────────────────────────────────────────────
  startCombat: () =>
    set({
      currentMob: null,
      playerAttackProgress: 0,
      mobAttackProgress: 0,
      powerStrikeCooldown: 0,
      equippedSpellCooldown: 0,
      isCombatActive: true,
      activeBuffs: [],
    }),

  // ── engageCombat ────────────────────────────────────────────────────────────
  engageCombat: () => set({
    isCombatActive: true,
    combatEventKey: 0,
    combatEventText: null,
    damageIndicators: [],
    isKillingBlowActive: false,
  }),

  // ── usePowerStrike ───────────────────────────────────────────────────────────
  usePowerStrike: () =>
    set((state) => {
      if (!state.isCombatActive || state.powerStrikeCooldown > 0) return state
      if (!state.currentMob) return state

      const now = Date.now()
      const eff = getEffectiveStats(state.player, state.equipment, state.talents)
      const dmg = Math.floor(eff.damage * 1.5)
      const mob = { ...state.currentMob }
      mob.currentHp = Math.max(0, mob.currentHp - dmg)

      const damageIndicators = [
        ...state.damageIndicators,
        { id: now + Math.random(), value: dmg, isCrit: false, isSkill: true, target: 'enemy' as const, createdAt: now },
      ]

      if (mob.currentHp <= 0) {
        return {
          damageIndicators,
          mobAttackProgress: 0,
          powerStrikeCooldown: POWER_STRIKE_COOLDOWN_MS,
          ...triggerEnemyDeath(state, mob),
          currentRunStats: { ...state.currentRunStats, monstersKilled: state.currentRunStats.monstersKilled + 1 },
        }
      }

      return {
        currentMob: mob,
        mobAttackProgress: 0,
        powerStrikeCooldown: POWER_STRIKE_COOLDOWN_MS,
        isCombatActive: true,
        damageIndicators,
      }
    }),

  // ── useEquippedSpell ────────────────────────────────────────────────────────
  useEquippedSpell: () =>
    set((state) => {
      const spell = state.equipment.spell
      if (!state.isCombatActive || !spell?.ability || state.equippedSpellCooldown > 0) return state
      if (!state.currentMob) return state

      const { ability } = spell
      const mob = { ...state.currentMob }
      const now = Date.now()
      const damageIndicators = [...state.damageIndicators]

      if (ability.effectType === 'damageEnemy') {
        mob.currentHp = Math.max(0, mob.currentHp - ability.value)
        damageIndicators.push({ id: now + Math.random(), value: ability.value, isCrit: false, isSkill: true, target: 'enemy', createdAt: now })
      }

      if (mob.currentHp <= 0) {
        return {
          damageIndicators,
          equippedSpellCooldown: ability.cooldown,
          ...triggerEnemyDeath(state, mob),
          currentRunStats: { ...state.currentRunStats, monstersKilled: state.currentRunStats.monstersKilled + 1 },
        }
      }

      return {
        currentMob: mob,
        equippedSpellCooldown: ability.cooldown,
        isCombatActive: true,
        damageIndicators,
      }
    }),

  // ── resetRun ────────────────────────────────────────────────────────────────
  resetRun: () =>
    set((state) => {
      const effMaxHp = getEffectiveStats({ ...DEFAULT_PLAYER }, { ...EMPTY_EQUIPMENT }, state.talents).maxHp
      return {
        totalXp: state.totalXp + state.playerXp,
        playerXp: 0,
        act1Map: [],
        currentFloor: 1,
        currentMapNodeId: null,
        isMapVisible: false,
        activeView: 'hub' as const,
        player: { ...DEFAULT_PLAYER, currentHp: effMaxHp },
        currentMob: null,
        playerAttackProgress: 0,
        mobAttackProgress: 0,
        powerStrikeCooldown: 0,
        equippedSpellCooldown: 0,
        isCombatActive: false,
        usedUndyingThisRun: false,
        backpack: [],
        equipment: { ...EMPTY_EQUIPMENT },
        lootChoices: [],
        isLootPickerVisible: false,
        combatReward: null,
        restEvent: null,
        marketItems: null,
        damageIndicators: [],
        isKillingBlowActive: false,
        potionBelt: [],
        activeBuffs: [],
        runSummary: null,
        currentRunStats: { monstersKilled: 0, goldGathered: 0 },
      }
    }),

  // ── equipItem ───────────────────────────────────────────────────────────────
  // Moves item from backpack to its equipment slot. Swaps if slot is occupied.
  equipItem: (item) =>
    set((state) => {
      if (item.equipSlot === 'potion') return state   // potions use equipPotion
      let targetSlot: EquipSlot = item.equipSlot as EquipSlot

      // Smart dual-wield: weapons prefer mainHand, overflow to offHand
      if (item.equipSlot === 'mainHand') {
        if      (!state.equipment.mainHand) targetSlot = 'mainHand'
        else if (!state.equipment.offHand)  targetSlot = 'offHand'
        else                                targetSlot = 'mainHand' // swap mainHand
      }
      // Smart ring: fill ring1 first, then ring2, then swap ring1
      else if (item.equipSlot === 'ring1' || item.equipSlot === 'ring2') {
        if      (!state.equipment.ring1) targetSlot = 'ring1'
        else if (!state.equipment.ring2) targetSlot = 'ring2'
        else                             targetSlot = 'ring1'
      }

      const existing    = state.equipment[targetSlot]
      const newBackpack = state.backpack.filter((i) => i.id !== item.id)
      if (existing) newBackpack.push(existing)
      return {
        backpack:  newBackpack,
        equipment: { ...state.equipment, [targetSlot]: item },
      }
    }),

  // ── unequipItem ─────────────────────────────────────────────────────────────
  // Moves item from equipment slot back to backpack.
  unequipItem: (slotKey) =>
    set((state) => {
      const item = state.equipment[slotKey as EquipSlot]
      if (!item) return state
      const newEquipment = { ...state.equipment, [slotKey]: null }
      const newMaxHp = getEffectiveStats(state.player, newEquipment, state.talents).maxHp
      return {
        equipment: newEquipment,
        backpack: [...state.backpack, item],
        player: { ...state.player, currentHp: Math.min(state.player.currentHp, newMaxHp) },
      }
    }),

  // ── sellItem ────────────────────────────────────────────────────────────────
  sellItem: (itemId) =>
    set((state) => {
      const item = state.backpack.find((i) => i.id === itemId)
      if (!item) return state
      return {
        backpack: state.backpack.filter((i) => i.id !== itemId),
        player: { ...state.player, gold: state.player.gold + getItemSellValue(item.rarity) },
      }
    }),

  // ── sellAllBackpack ──────────────────────────────────────────────────────────
  sellAllBackpack: () =>
    set((state) => {
      const total = state.backpack.reduce((sum, i) => sum + getItemSellValue(i.rarity), 0)
      return {
        backpack: [],
        player: { ...state.player, gold: state.player.gold + total },
      }
    }),

  // ── equipPotion ─────────────────────────────────────────────────────────────
  equipPotion: (item) =>
    set((state) => {
      if (item.equipSlot !== 'potion') return state
      const existingIdx = state.potionBelt.findIndex(s => s.item.name === item.name)
      if (existingIdx >= 0) {
        if (state.potionBelt[existingIdx].count < MAX_POTION_STACK) {
          return {
            potionBelt: state.potionBelt.map((s, i) =>
              i === existingIdx ? { ...s, count: s.count + 1 } : s
            ),
            backpack: state.backpack.filter(b => b.id !== item.id),
          }
        }
        return state // can't stack, stays in backpack
      }
      if (state.potionBelt.length >= MAX_POTION_SLOTS) return state // belt full
      return {
        potionBelt: [...state.potionBelt, { item, count: 1 }],
        backpack: state.backpack.filter(b => b.id !== item.id),
      }
    }),

  // ── usePotion ───────────────────────────────────────────────────────────────
  usePotion: (index) =>
    set((state) => {
      const slot = state.potionBelt[index]
      if (!slot) return state
      const newBelt = state.potionBelt
        .map((s, i) => i === index ? { ...s, count: s.count - 1 } : s)
        .filter(s => s.count > 0)
      const effect = slot.item.consumableEffect
      if (!effect) return { potionBelt: newBelt }

      if (effect.type === 'heal') {
        const eff = getEffectiveStats(state.player, state.equipment, state.talents)
        const healAmt = Math.floor(eff.maxHp * (effect.value ?? 0.3))
        return {
          potionBelt: newBelt,
          player: { ...state.player, currentHp: Math.min(eff.maxHp, state.player.currentHp + healAmt) },
        }
      }

      const buff: ActiveBuff = { type: effect.type as ActiveBuff['type'] }
      if (effect.durationMS !== undefined) buff.expiresAt = Date.now() + effect.durationMS
      if (effect.charges !== undefined) buff.charges = effect.charges
      if (effect.value !== undefined) buff.value = effect.value
      return {
        potionBelt: newBelt,
        activeBuffs: [...state.activeBuffs, buff],
      }
    }),

  // ── unequipPotion ────────────────────────────────────────────────────────────
  unequipPotion: (index) =>
    set((state) => {
      const slot = state.potionBelt[index]
      if (!slot) return state
      if (state.backpack.length >= 16) return state // backpack full
      const newBelt = state.potionBelt
        .map((s, i) => i === index ? { ...s, count: s.count - 1 } : s)
        .filter(s => s.count > 0)
      return {
        potionBelt: newBelt,
        backpack: [...state.backpack, { ...slot.item }],
      }
    }),

  // ── selectLoot ──────────────────────────────────────────────────────────────
  selectLoot: (item) =>
    set((state) => ({
      backpack: [...state.backpack, item],
      lootChoices: [],
      isLootPickerVisible: false,
    })),

  // ── collectCombatReward ─────────────────────────────────────────────────────
  collectCombatReward: () =>
    set((state) => {
      if (!state.combatReward) return state
      const eff = getEffectiveStats(state.player, state.equipment, state.talents)
      const healAmount = Math.floor(eff.maxHp * eff.postCombatHealPct)
      const newHp = healAmount > 0
        ? Math.min(eff.maxHp, state.player.currentHp + healAmount)
        : state.player.currentHp
      return {
        player: { ...state.player, currentHp: newHp, gold: state.player.gold + state.combatReward.gold },
        backpack: [...state.backpack, state.combatReward.item],
        playerXp: state.playerXp + state.combatReward.xp,
        currentFloor: state.currentFloor + 1,
        combatReward: null,
        isMapVisible: true,
        currentRunStats: { ...state.currentRunStats, goldGathered: state.currentRunStats.goldGathered + state.combatReward.gold },
      }
    }),

  // ── leaveCamp ───────────────────────────────────────────────────────────────
  leaveCamp: () => set({ restEvent: null }),

  // ── buyItem ─────────────────────────────────────────────────────────────────
  buyItem: (item, price) =>
    set((state) => {
      if (!state.marketItems || state.player.gold < price) return state
      return {
        player: { ...state.player, gold: state.player.gold - price },
        backpack: [...state.backpack, item],
        marketItems: state.marketItems.filter((e) => e.item.id !== item.id),
      }
    }),

  // ── rerollMarket ────────────────────────────────────────────────────────────
  rerollMarket: () =>
    set((state) => {
      if (!state.marketItems || state.player.gold < 15) return state
      return {
        player: { ...state.player, gold: state.player.gold - 15 },
        marketItems: generateMarketItems(),
      }
    }),

  // ── leaveMarket ─────────────────────────────────────────────────────────────
  leaveMarket: () => set({ marketItems: null }),

  // ── addDamageIndicator ──────────────────────────────────────────────────────
  addDamageIndicator: (indicator) =>
    set((state) => ({ damageIndicators: [...state.damageIndicators, indicator] })),

  // ── Meta-progression ────────────────────────────────────────────────────────
  totalXp: 0,
  talents: {},

  upgradeTalent: (nodeId) =>
    set((state) => {
      const node = TALENT_TREE.find(n => n.id === nodeId)
      if (!node) return state
      const currentRank = state.talents[nodeId] ?? 0
      if (currentRank >= node.maxRank) return state
      const prereq = TALENT_TREE.find(n => n.branch === node.branch && n.tier === node.tier - 1)
      if (prereq && (state.talents[prereq.id] ?? 0) < prereq.maxRank) return state
      if (computeAvailablePoints(state.totalXp, state.talents) < node.costPerRank) return state
      return { talents: { ...state.talents, [nodeId]: currentRank + 1 } }
    }),

  // ── tickCombat ──────────────────────────────────────────────────────────────
  tickCombat: () =>
    set((state) => {
      if (!state.isCombatActive) return state
      if (!state.currentMob) return state

      const now = Date.now()
      const damageIndicators = state.damageIndicators.filter(d => now - d.createdAt < 1400)

      // ── Active buff bookkeeping ──────────────────────────────────────────────
      // Filter expired duration buffs; vampire charges are filtered below after attacking
      let activeBuffs = state.activeBuffs.filter(b =>
        b.expiresAt === undefined || b.expiresAt > now
      )
      const hasFreezeEnemy = activeBuffs.some(b => b.type === 'freezeEnemy')
      const hasBerserk     = activeBuffs.some(b => b.type === 'berserk')
      const vampIdx        = activeBuffs.findIndex(b => b.type === 'lifestealBuff' && (b.charges ?? 0) > 0)
      const vampBuff       = vampIdx >= 0 ? activeBuffs[vampIdx] : null

      let playerAttackProgress = state.playerAttackProgress
      let mobAttackProgress = state.mobAttackProgress
      const player = { ...state.player }
      const mob = { ...state.currentMob }
      const eff = getEffectiveStats(state.player, state.equipment, state.talents)

      // ── Berserk / Frenzy: compute effective attack speed ─────────────────────
      const baseSpeed = eff.hasFrenzy && player.currentHp < eff.maxHp * 0.30
        ? eff.attackSpeed * 2
        : eff.attackSpeed
      const effectiveAttackSpeed = baseSpeed * (hasBerserk ? 2 : 1)

      // ── Berserk: damage reduction = 0 ────────────────────────────────────────
      const effectiveDR = hasBerserk ? 0 : eff.damageReduction

      playerAttackProgress += effectiveAttackSpeed * (TICK_MS / 1000) * 100
      // Freeze: skip mob progress
      if (!hasFreezeEnemy) {
        mobAttackProgress += mob.attackSpeed * (TICK_MS / 1000) * 100
      }

      let newEventText: string | null = null

      if (playerAttackProgress >= 100) {
        playerAttackProgress -= 100
        const isCrit = eff.critChance > 0 && Math.random() < eff.critChance
        const giantMult = eff.eliteBonusMultiplier > 0 && (mob.tier === 'elite' || mob.tier === 'boss')
          ? 1 + eff.eliteBonusMultiplier : 1
        const dmg = Math.floor((isCrit ? eff.damage * 2 : eff.damage) * giantMult)
        mob.currentHp = Math.max(0, mob.currentHp - dmg)
        if (isCrit) newEventText = '⚡ Critical Hit!'

        // Vampire: bonus lifesteal for next N hits
        const effectiveLifesteal = eff.lifesteal + (vampBuff ? (vampBuff.value ?? 0) : 0)
        if (effectiveLifesteal > 0) {
          player.currentHp = Math.min(eff.maxHp, player.currentHp + effectiveLifesteal)
        }
        // Decrement vampire charges after a successful hit
        if (vampBuff) {
          activeBuffs = activeBuffs.map((b, i) =>
            i === vampIdx ? { ...b, charges: (b.charges ?? 1) - 1 } : b
          ).filter(b => b.type !== 'lifestealBuff' || (b.charges ?? 0) > 0)
        }

        damageIndicators.push({ id: now + Math.random(), value: dmg, isCrit, isSkill: false, target: 'enemy', createdAt: now })
      }

      // Execution: instant kill below threshold
      if (eff.executionThreshold > 0 && mob.currentHp > 0) {
        if (mob.currentHp / mob.maxHp <= eff.executionThreshold) {
          mob.currentHp = 0
          newEventText = '💀 Executed!'
        }
      }

      if (mobAttackProgress >= 100) {
        mobAttackProgress -= 100
        const isDodged = eff.dodgeChance > 0 && Math.random() < eff.dodgeChance
        if (!isDodged) {
          const dmgTaken = Math.max(0, mob.baseDamage - effectiveDR)
          player.currentHp = Math.max(0, player.currentHp - dmgTaken)
          if (dmgTaken > 0) {
            damageIndicators.push({ id: now + Math.random() + 1, value: dmgTaken, isCrit: false, isSkill: false, target: 'player', createdAt: now })
          }
        } else {
          newEventText = '✦ Dodged!'
        }
      }

      const powerStrikeCooldown = Math.max(0, state.powerStrikeCooldown - TICK_MS)
      const equippedSpellCooldown = Math.max(0, state.equippedSpellCooldown - TICK_MS)

      // Undying: revive at 30% HP once per run
      if (player.currentHp <= 0 && eff.hasUndying && !state.usedUndyingThisRun) {
        player.currentHp = Math.floor(eff.maxHp * 0.30)
        return {
          player,
          currentMob: mob,
          playerAttackProgress,
          mobAttackProgress,
          powerStrikeCooldown,
          equippedSpellCooldown,
          isCombatActive: true,
          usedUndyingThisRun: true,
          damageIndicators,
          activeBuffs,
        }
      }

      const isCombatActive = mob.currentHp > 0 && player.currentHp > 0

      // Player wins — killing blow: pause 800ms before showing reward
      if (!isCombatActive && mob.currentHp <= 0) {
        return {
          player,
          playerAttackProgress,
          mobAttackProgress,
          powerStrikeCooldown,
          equippedSpellCooldown,
          damageIndicators,
          ...triggerEnemyDeath(state, mob),  // mobDeathPatch clears activeBuffs
          currentRunStats: { ...state.currentRunStats, monstersKilled: state.currentRunStats.monstersKilled + 1 },
        }
      }

      const eventUpdate = newEventText
        ? { combatEventKey: state.combatEventKey + 1, combatEventText: newEventText }
        : {}

      // Player died — clear buffs, trigger summary screen
      if (!isCombatActive) {
        return {
          player,
          currentMob: mob,
          playerAttackProgress,
          mobAttackProgress,
          powerStrikeCooldown,
          equippedSpellCooldown,
          isCombatActive,
          damageIndicators,
          activeBuffs: [],
          ...eventUpdate,
          runSummary: state.runSummary ?? {
            active: true,
            status: 'dead' as const,
            previousTotalXp: state.totalXp,
            goldAtDeath: state.player.gold,
          },
        }
      }

      return {
        player,
        currentMob: mob,
        playerAttackProgress,
        mobAttackProgress,
        powerStrikeCooldown,
        equippedSpellCooldown,
        isCombatActive,
        damageIndicators,
        activeBuffs,
        ...eventUpdate,
      }
    }),

  hardResetGame: () => {
    localStorage.removeItem('tactical-roguelite-storage')
    window.location.reload()
  },
    }),
    {
      name: 'tactical-roguelite-storage',
      partialize: (state) => ({
        totalXp: state.totalXp,
        talents:  state.talents,
      }),
    }
  )
)
