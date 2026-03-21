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

export function computeAvailablePoints(totalXp: number, talents: Record<string, number>): number {
  const spent = TALENT_TREE.reduce((s, n) => s + (talents[n.id] ?? 0) * n.costPerRank, 0)
  return Math.floor(totalXp / 100) - spent
}

// ─── Item / Player types ──────────────────────────────────────────────────────

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
  attackSpeed: 0.75,
}

const DEFAULT_MOB: Mob = {
  name: 'Orc Warrior', maxHp: 40, currentHp: 40,
  baseDamage: 7, attackSpeed: 0.90, tier: 'normal',
}

// ─── Bestiary ─────────────────────────────────────────────────────────────────

type MobBase = Omit<Mob, 'tier' | 'currentHp'>

const BESTIARY: MobBase[] = [
  { name: 'Goblin Rogue',  maxHp: 20,  baseDamage: 3,  attackSpeed: 0.50 },
  { name: 'Undead Brute',  maxHp: 45,  baseDamage: 9,  attackSpeed: 1.50 },
  { name: 'Orc Warrior',   maxHp: 40,  baseDamage: 7,  attackSpeed: 0.90 },
]

const VOID_WARDEN_BASE: MobBase = {
  name: 'The Void Warden', maxHp: 200, baseDamage: 15, attackSpeed: 1.10,
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
  const eliteFloor2 = Math.floor(Math.random() * 4) + 15 // 15, 16, 17, or 18

  for (let f = 1; f <= 20; f++) {
    let types: MapNode['type'][]

    if (f === 1) {
      types = ['mob']
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

  const gearHp  = items.reduce((s, i) => s + (i.stats.hp          ?? 0), 0)
  const gearDmg = items.reduce((s, i) => s + (i.stats.damage      ?? 0), 0)
  const gearSpd = items.reduce((s, i) => s + (i.stats.attackSpeed ?? 0), 0)

  return {
    maxHp:                Math.floor((player.maxHp      + flatHp  + gearHp)  * (1 + pctHp)),
    damage:               Math.floor((player.baseDamage + flatDmg + gearDmg) * (1 + pctDmg)),
    attackSpeed:                     (player.attackSpeed + flatSpd + gearSpd) * (1 + pctSpd),
    damageReduction:      flatDr,
    critChance:           flatCrit,
    dodgeChance:          flatDodge,
    lifesteal:            Math.floor(flatLifesteal),
    postCombatHealPct:    flatHealPct,
    eliteBonusMultiplier: flatEliteBonus,
    executionThreshold:   flatExecution,
    hasUndying:           flatUndying >= 1,
    hasFrenzy:            flatFrenzy >= 1,
  }
}

// ─── Mob-death patch helper ───────────────────────────────────────────────────
// Returns the state fields that should be set whenever a mob's HP hits 0.
// Calling it in one place ensures useShieldBash, useEquippedSpell, and
// tickCombat all produce the same victory transition.

function mobDeathPatch(state: { act1Map: MapNode[][]; currentMapNodeId: string | null }) {
  const act1Map = state.act1Map.map((floor) =>
    floor.map((n) =>
      n.id === state.currentMapNodeId ? { ...n, isCompleted: true } : n
    )
  )
  return {
    act1Map,
    isCombatActive: false as const,
    isMapVisible:   false as const,
    combatReward: { xp: XP_PER_KILL, item: randomDrop() },
  }
}

// ─── Store ────────────────────────────────────────────────────────────────────

const TICK_MS = 50
const SHIELD_BASH_COOLDOWN_MS = 8000
const SHIELD_BASH_DAMAGE = 5
const XP_PER_KILL = 20
const XP_PER_CHEST = 25

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

  // Event state
  combatReward: { xp: number; item: Item } | null
  restEvent: { healedAmount: number } | null
  combatEventKey: number
  combatEventText: string | null

  // Run state
  usedUndyingThisRun: boolean

  // Combat actions
  startCombat: () => void
  engageCombat: () => void
  tickCombat: () => void
  useShieldBash: () => void
  useEquippedSpell: () => void
  collectCombatReward: () => void
  resetRun: () => void

  // Inventory actions
  equipItem: (item: Item) => void
  unequipItem: (slotKey: string) => void

  // Loot picker actions
  selectLoot: (item: Item) => void

  // Rest actions
  leaveCamp: () => void

  // Meta-progression (persistent across runs)
  totalXp: number
  talents: Record<string, number>
  upgradeTalent: (nodeId: string) => void
}

export const useGameStore = create<GameStore>((set) => ({
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
        usedUndyingThisRun: false,
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
          shieldBashCooldown: 0,
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
          lootChoices: randomThreeDrops(),
          isLootPickerVisible: true,
        }
      }

      return state
    }),

  // ── Run state ───────────────────────────────────────────────────────────────
  usedUndyingThisRun: false,

  // ── Combat state ────────────────────────────────────────────────────────────
  player: { ...DEFAULT_PLAYER },
  currentMob: { ...DEFAULT_MOB },
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

  // ── Event state ─────────────────────────────────────────────────────────────
  combatReward: null,
  restEvent: null,
  combatEventKey: 0,
  combatEventText: null,

  // ── startCombat ─────────────────────────────────────────────────────────────
  startCombat: () =>
    set({
      currentMob: { ...DEFAULT_MOB },
      playerAttackProgress: 0,
      mobAttackProgress: 0,
      shieldBashCooldown: 0,
      equippedSpellCooldown: 0,
      isCombatActive: true,
    }),

  // ── engageCombat ────────────────────────────────────────────────────────────
  engageCombat: () => set({ isCombatActive: true, combatEventKey: 0, combatEventText: null }),

  // ── useShieldBash ───────────────────────────────────────────────────────────
  useShieldBash: () =>
    set((state) => {
      if (!state.isCombatActive || state.shieldBashCooldown > 0) return state

      const mob = { ...state.currentMob }
      mob.currentHp = Math.max(0, mob.currentHp - SHIELD_BASH_DAMAGE)

      if (mob.currentHp <= 0) {
        return { ...mobDeathPatch(state), currentMob: mob, mobAttackProgress: 0, shieldBashCooldown: SHIELD_BASH_COOLDOWN_MS }
      }

      return {
        currentMob: mob,
        mobAttackProgress: 0,
        shieldBashCooldown: SHIELD_BASH_COOLDOWN_MS,
        isCombatActive: true,
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

      if (mob.currentHp <= 0) {
        return { ...mobDeathPatch(state), currentMob: mob, equippedSpellCooldown: ability.cooldown }
      }

      return {
        currentMob: mob,
        equippedSpellCooldown: ability.cooldown,
        isCombatActive: true,
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
        currentMob: { ...DEFAULT_MOB },
        playerAttackProgress: 0,
        mobAttackProgress: 0,
        shieldBashCooldown: 0,
        equippedSpellCooldown: 0,
        isCombatActive: false,
        usedUndyingThisRun: false,
        backpack: [],
        equipment: { ...EMPTY_EQUIPMENT },
        lootChoices: [],
        isLootPickerVisible: false,
        combatReward: null,
        restEvent: null,
      }
    }),

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
      const newMaxHp = getEffectiveStats(state.player, newEquipment, state.talents).maxHp
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
        player: { ...state.player, currentHp: newHp },
        backpack: [...state.backpack, state.combatReward.item],
        playerXp: state.playerXp + state.combatReward.xp,
        currentFloor: state.currentFloor + 1,
        combatReward: null,
        isMapVisible: true,
      }
    }),

  // ── leaveCamp ───────────────────────────────────────────────────────────────
  leaveCamp: () => set({ restEvent: null }),

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
      if (prereq && (state.talents[prereq.id] ?? 0) < 1) return state
      if (computeAvailablePoints(state.totalXp, state.talents) < node.costPerRank) return state
      return { talents: { ...state.talents, [nodeId]: currentRank + 1 } }
    }),

  // ── tickCombat ──────────────────────────────────────────────────────────────
  tickCombat: () =>
    set((state) => {
      if (!state.isCombatActive) return state

      let playerAttackProgress = state.playerAttackProgress
      let mobAttackProgress = state.mobAttackProgress
      const player = { ...state.player }
      const mob = { ...state.currentMob }
      const eff = getEffectiveStats(state.player, state.equipment, state.talents)

      // Frenzy: double attack speed below 30% HP
      const effectiveAttackSpeed = eff.hasFrenzy && player.currentHp < eff.maxHp * 0.30
        ? eff.attackSpeed * 2
        : eff.attackSpeed

      playerAttackProgress += effectiveAttackSpeed * (TICK_MS / 1000) * 100
      mobAttackProgress += mob.attackSpeed * (TICK_MS / 1000) * 100

      let newEventText: string | null = null

      if (playerAttackProgress >= 100) {
        playerAttackProgress -= 100
        const isCrit = eff.critChance > 0 && Math.random() < eff.critChance
        const giantMult = eff.eliteBonusMultiplier > 0 && (mob.tier === 'elite' || mob.tier === 'boss')
          ? 1 + eff.eliteBonusMultiplier : 1
        const dmg = Math.floor((isCrit ? eff.damage * 2 : eff.damage) * giantMult)
        mob.currentHp = Math.max(0, mob.currentHp - dmg)
        if (isCrit) newEventText = '⚡ Critical Hit!'
        if (eff.lifesteal > 0) {
          player.currentHp = Math.min(eff.maxHp, player.currentHp + eff.lifesteal)
        }
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
          const dmgTaken = Math.max(0, mob.baseDamage - eff.damageReduction)
          player.currentHp = Math.max(0, player.currentHp - dmgTaken)
        } else {
          newEventText = '✦ Dodged!'
        }
      }

      const shieldBashCooldown = Math.max(0, state.shieldBashCooldown - TICK_MS)
      const equippedSpellCooldown = Math.max(0, state.equippedSpellCooldown - TICK_MS)

      // Undying: revive at 30% HP once per run
      if (player.currentHp <= 0 && eff.hasUndying && !state.usedUndyingThisRun) {
        player.currentHp = Math.floor(eff.maxHp * 0.30)
        return {
          player,
          currentMob: mob,
          playerAttackProgress,
          mobAttackProgress,
          shieldBashCooldown,
          equippedSpellCooldown,
          isCombatActive: true,
          usedUndyingThisRun: true,
        }
      }

      const isCombatActive = mob.currentHp > 0 && player.currentHp > 0

      // Player wins: show victory overlay (floor advance happens in collectCombatReward)
      if (!isCombatActive && mob.currentHp <= 0) {
        return {
          player,
          currentMob: mob,
          playerAttackProgress,
          mobAttackProgress,
          shieldBashCooldown,
          equippedSpellCooldown,
          ...mobDeathPatch(state),
        }
      }

      const eventUpdate = newEventText
        ? { combatEventKey: state.combatEventKey + 1, combatEventText: newEventText }
        : {}

      return {
        player,
        currentMob: mob,
        playerAttackProgress,
        mobAttackProgress,
        shieldBashCooldown,
        equippedSpellCooldown,
        isCombatActive,
        ...eventUpdate,
      }
    }),
}))
