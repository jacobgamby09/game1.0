import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type {
  View, EquipSlot, ItemSlot, Rarity, TalentBranch, MobTier, MobTrait, TalentNode,
  DamageIndicator, ItemAbility, ConsumableEffect, ActiveBuff, Item,
  Player, RunStats, RunSummary, Mob, MapNode,
  BuildingId, Buildings,
  SlotRarityLevel, EquipmentSlotName, EquipmentSlotUpgrades,
  Boon,
} from '../types'
import { TALENT_TREE, RARITY_COLORS, MAX_POTION_STACK, MAX_POTION_SLOTS, SLOT_TIER_COLORS, SLOT_TIER_BONUSES, SLOT_UPGRADE_COSTS, BOONS } from '../data/constants'
import { getItemSellValue, computeAvailablePoints, computePlayerLevel, getEffectiveStats, getTargetEquipSlot } from '../utils/gameHelpers'
import { spawnMob, generateMarketItems, randomDrop, randomThreeDrops, buildMap } from '../utils/storeHelpers'

// ─── Re-exports (preserve existing component import paths) ───────────────────

export type {
  View, EquipSlot, ItemSlot, Rarity, TalentBranch, MobTier, MobTrait, TalentNode,
  DamageIndicator, ItemAbility, ConsumableEffect, ActiveBuff, Item,
  Player, RunStats, RunSummary, Mob, MapNode,
  BuildingId, Buildings,
  SlotRarityLevel, EquipmentSlotName, EquipmentSlotUpgrades,
  Boon,
}
export { TALENT_TREE, RARITY_COLORS, MAX_POTION_STACK, MAX_POTION_SLOTS, SLOT_TIER_COLORS, SLOT_TIER_BONUSES, SLOT_UPGRADE_COSTS, BOONS }
export { getItemSellValue, computeAvailablePoints, computePlayerLevel, getEffectiveStats, getTargetEquipSlot }

// ─── Balancing functions ──────────────────────────────────────────────────────

// XP cost to buy the nth talent point (0-indexed: first point costs 100, second 125, etc.)
export const calculateTalentCost = (currentTotalPoints: number): number =>
  100 + currentTotalPoints * 25

// XP awarded for killing a monster. monsterLevel = current floor number.
export const calculateMonsterXp = (monsterLevel: number, isBoss: boolean): number =>
  isBoss ? 500 : 75 + monsterLevel * 15

// Total XP spent to have k talent points (sum of calculateTalentCost(0..k-1))
function totalTalentXpCost(k: number): number {
  return 100 * k + 25 * (k * (k - 1)) / 2
}

// Derives talent Level, XP progress within that level, and XP required for the next level.
// Level N = enough XP earned to buy N talent points total.
export function calculateLevelFromXp(totalXp: number): { level: number; currentXp: number; nextLevelXp: number } {
  let level = 0
  let spent = 0
  while (true) {
    const next = calculateTalentCost(level)
    if (spent + next > totalXp) break
    spent += next
    level++
  }
  return { level, currentXp: totalXp - spent, nextLevelXp: calculateTalentCost(level) }
}

// ─── Internal constants ───────────────────────────────────────────────────────

const TICK_MS = 50
const POWER_STRIKE_COOLDOWN_MS = 5600
const XP_PER_CHEST = 25

// ─── Internal defaults ────────────────────────────────────────────────────────

const DEFAULT_PLAYER: Player = {
  name: 'Fighter',
  playerClass: 'Fighter',
  maxHp: 100,
  currentHp: 100,
  baseDamage: 12,
  attackSpeed: 0.45,
  gold: 0,
  portraitUrl: '/portraits/fighter.webp',
}

const EMPTY_EQUIPMENT: Record<EquipSlot, Item | null> = {
  head: null, chest: null, legs: null,
  mainHand: null, offHand: null,
  amulet: null, ring1: null, ring2: null,
  spell: null,
}

// ─── Meta-resource drop helper ───────────────────────────────────────────────

function calcMetaDrops(tier: MobTier): { scrapDrop: number; dustDrop: number } {
  if (tier === 'boss')  return { scrapDrop: 3, dustDrop: 3 }
  if (tier === 'elite') return { scrapDrop: 1, dustDrop: 1 }
  return { scrapDrop: Math.random() < 0.30 ? 1 : 0, dustDrop: 0 }
}

// ─── Mob-death patch helper ───────────────────────────────────────────────────
// Returns the state fields that should be set whenever a mob's HP hits 0.
// Calling it in one place ensures usePowerStrike, useEquippedSpell, and
// tickCombat all produce the same victory transition.

function mobDeathPatch(state: { act1Map: MapNode[][]; currentMapNodeId: string | null; currentMob: Mob | null; currentFloor: number; activeBuffs: ActiveBuff[]; playerXp: number; activeBoon: string | null }) {
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
  const { scrapDrop, dustDrop } = calcMetaDrops(state.currentMob?.tier ?? 'normal')
  const scholarMult = state.activeBoon === 'scholar' ? 1.5 : 1
  const pendingXp    = Math.round(calculateMonsterXp(state.currentFloor, state.currentMob?.tier === 'boss') * scholarMult)
  const levelBefore  = calculateLevelFromXp(state.playerXp).level
  const levelAfter   = calculateLevelFromXp(state.playerXp + pendingXp).level
  return {
    act1Map,
    isCombatActive: false as const,
    isMapVisible:   false as const,
    combatReward: { xp: pendingXp, gold: goldAmount, item: randomDrop(state.currentFloor), scrap: scrapDrop, dust: dustDrop, leveledUp: levelAfter > levelBefore },
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

// ─── Store interface ──────────────────────────────────────────────────────────

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
  bossPhase: 'void' | 'exposed'
  bossPhaseTimerMs: number

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
  combatReward: { xp: number; gold: number; item: Item; scrap: number; dust: number; leveledUp: boolean } | null
  inspectedItem: Item | null
  setInspectedItem: (item: Item | null) => void
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

  // Boon state
  activeBoon: string | null
  isChoosingBoon: boolean
  selectBoon: (boonId: string) => void

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
  equipItemToSlot: (item: Item, slot: EquipSlot) => void
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
  totalXp:   number
  talents:   Record<string, number>
  ironScrap: number
  voidDust:  number
  buildings:    Buildings
  slotUpgrades: EquipmentSlotUpgrades
  upgradeTalent:         (nodeId: string) => void
  constructBuilding:     (id: BuildingId) => void
  upgradeEquipmentSlot:  (slotName: EquipmentSlotName) => void
  hardResetGame:         () => void
}

// ─── Store ────────────────────────────────────────────────────────────────────

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
      const effMaxHp = getEffectiveStats({ ...DEFAULT_PLAYER }, { ...EMPTY_EQUIPMENT }, state.talents, state.slotUpgrades).maxHp
      return {
        act1Map: buildMap(),
        currentFloor: 1,
        currentMapNodeId: null,
        isMapVisible: true,
        activeView: 'battle' as const,
        player: { ...DEFAULT_PLAYER, currentHp: effMaxHp },
        talents: {},
        playerXp: 0,
        lootChoices: [],
        isLootPickerVisible: false,
        combatReward: null,
        restEvent: null,
        marketItems: null,
        damageIndicators: [],
        isKillingBlowActive: false,
        usedUndyingThisRun: false,
        currentRunStats: { monstersKilled: 0, goldGathered: 0, ironScrapGathered: 0, voidDustGathered: 0 },
        runSummary: null,
        activeBoon: null,
        isChoosingBoon: true,
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
          bossPhase: 'void' as const,
          bossPhaseTimerMs: 8000,
        }
      }

      if (node.type === 'rest') {
        const eff = getEffectiveStats(state.player, state.equipment, state.talents, state.slotUpgrades)
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
  currentRunStats: { monstersKilled: 0, goldGathered: 0, ironScrapGathered: 0, voidDustGathered: 0 },
  runSummary: null,

  // ── Boon state ──────────────────────────────────────────────────────────────
  activeBoon: null,
  isChoosingBoon: false,

  selectBoon: (boonId) =>
    set((state) => {
      const patch: Partial<GameStore> = {
        activeBoon: boonId,
        isChoosingBoon: false,
      }
      if (boonId === 'thick-blood') {
        const newMaxHp = state.player.maxHp + 30
        patch.player = { ...state.player, maxHp: newMaxHp, currentHp: newMaxHp }
      }
      return patch
    }),

  // ── Combat state ────────────────────────────────────────────────────────────
  player: { ...DEFAULT_PLAYER },
  currentMob: null,
  playerAttackProgress: 0,
  mobAttackProgress: 0,
  isCombatActive: false,
  bossPhase: 'void' as const,
  bossPhaseTimerMs: 8000,

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
  inspectedItem: null,
  setInspectedItem: (item) => set({ inspectedItem: item }),
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
      bossPhase: 'void' as const,
      bossPhaseTimerMs: 8000,
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
      const eff = getEffectiveStats(state.player, state.equipment, state.talents, state.slotUpgrades)
      const glassBladeMult = state.activeBoon === 'glass-blade' ? 1.5 : 1
      const dmg = Math.floor(eff.damage * 1.5 * glassBladeMult)
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
      const effMaxHp = getEffectiveStats({ ...DEFAULT_PLAYER }, { ...EMPTY_EQUIPMENT }, state.talents, state.slotUpgrades).maxHp
      return {
        totalXp:   0,
        talents:   {},
        playerXp:  0,
        ironScrap: state.ironScrap + state.currentRunStats.ironScrapGathered,
        voidDust:  state.voidDust  + state.currentRunStats.voidDustGathered,
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
        inspectedItem: null,
        restEvent: null,
        marketItems: null,
        damageIndicators: [],
        isKillingBlowActive: false,
        potionBelt: [],
        activeBuffs: [],
        runSummary: null,
        currentRunStats: { monstersKilled: 0, goldGathered: 0, ironScrapGathered: 0, voidDustGathered: 0 },
        activeBoon: null,
        isChoosingBoon: false,
      }
    }),

  // ── equipItem ───────────────────────────────────────────────────────────────
  // Moves item from backpack to its equipment slot. Swaps if slot is occupied.
  equipItem: (item) =>
    set((state) => {
      if (item.equipSlot === 'potion') return state   // potions use equipPotion
      const targetSlot = getTargetEquipSlot(item, state.equipment)

      const existing    = state.equipment[targetSlot]
      const newBackpack = state.backpack.filter((i) => i.id !== item.id)
      if (existing) newBackpack.push(existing)
      const newEquipment = { ...state.equipment, [targetSlot]: item }
      const newMaxHp = getEffectiveStats(state.player, newEquipment, state.talents).maxHp
      return {
        backpack:  newBackpack,
        equipment: newEquipment,
        player: { ...state.player, currentHp: Math.min(state.player.currentHp, newMaxHp) },
      }
    }),

  // ── equipItemToSlot ──────────────────────────────────────────────────────────
  // Forces item into a specific slot, bypassing smart-fill logic.
  equipItemToSlot: (item, slot) =>
    set((state) => {
      if (item.equipSlot === 'potion') return state
      const existing    = state.equipment[slot]
      const newBackpack = state.backpack.filter((i) => i.id !== item.id)
      if (existing) newBackpack.push(existing)
      const newEquipment = { ...state.equipment, [slot]: item }
      const newMaxHp = getEffectiveStats(state.player, newEquipment, state.talents).maxHp
      return {
        backpack:  newBackpack,
        equipment: newEquipment,
        player: { ...state.player, currentHp: Math.min(state.player.currentHp, newMaxHp) },
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
        const eff = getEffectiveStats(state.player, state.equipment, state.talents, state.slotUpgrades)
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
      const eff = getEffectiveStats(state.player, state.equipment, state.talents, state.slotUpgrades)
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
        inspectedItem: null,
        isMapVisible: true,
        currentRunStats: {
          ...state.currentRunStats,
          goldGathered:      state.currentRunStats.goldGathered      + state.combatReward.gold,
          ironScrapGathered: state.currentRunStats.ironScrapGathered + state.combatReward.scrap,
          voidDustGathered:  state.currentRunStats.voidDustGathered  + state.combatReward.dust,
        },
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
  totalXp:   0,
  talents:   {},
  ironScrap: 0,
  voidDust:  0,
  buildings:    { apothecary: 0, blacksmith: 0, tavern: 0 },
  slotUpgrades: { head: 0, chest: 0, legs: 0, mainHand: 0, offHand: 0, amulet: 0, ring1: 0, ring2: 0 },

  upgradeTalent: (nodeId) =>
    set((state) => {
      const node = TALENT_TREE.find(n => n.id === nodeId)
      if (!node) return state
      const currentRank = state.talents[nodeId] ?? 0
      if (currentRank >= node.maxRank) return state
      const prereq = TALENT_TREE.find(n => n.branch === node.branch && n.tier === node.tier - 1)
      if (prereq && (state.talents[prereq.id] ?? 0) < prereq.maxRank) return state
      const totalSpent = Object.values(state.talents).reduce((a, b) => a + b, 0)
      let xpCost = 0
      for (let i = 0; i < node.costPerRank; i++) xpCost += calculateTalentCost(totalSpent + i)
      if (state.playerXp < totalTalentXpCost(totalSpent) + xpCost) return state
      return { talents: { ...state.talents, [nodeId]: currentRank + 1 } }
    }),

  constructBuilding: (id) =>
    set((state) => {
      if (state.ironScrap < 10) return state
      return {
        ironScrap: state.ironScrap - 10,
        buildings: { ...state.buildings, [id]: (state.buildings[id] ?? 0) + 1 },
      }
    }),

  upgradeEquipmentSlot: (slotName) =>
    set((state) => {
      const currentLevel = state.slotUpgrades[slotName]
      if (currentLevel >= 4) return state
      const cost = SLOT_UPGRADE_COSTS[(currentLevel + 1) as 1 | 2 | 3 | 4]
      if (state.ironScrap < cost) return state
      return {
        ironScrap:    state.ironScrap - cost,
        slotUpgrades: { ...state.slotUpgrades, [slotName]: currentLevel + 1 },
      }
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
      const eff = getEffectiveStats(state.player, state.equipment, state.talents, state.slotUpgrades)
      const glassBladeDmgMult      = state.activeBoon === 'glass-blade' ? 1.5 : 1
      const glassBladeIncomingMult = state.activeBoon === 'glass-blade' ? 1.25 : 1

      // ── Boss phase (Void Warden) ──────────────────────────────────────────────
      let bossPhase = state.bossPhase
      let bossPhaseTimerMs = state.bossPhaseTimerMs
      const isVoidWarden = mob.name === 'The Void Warden'
      if (isVoidWarden) {
        bossPhaseTimerMs -= TICK_MS
        if (bossPhaseTimerMs <= 0) {
          bossPhase = bossPhase === 'void' ? 'exposed' : 'void'
          bossPhaseTimerMs = 8000
        }
      }
      const bossPhaseMultiplier = isVoidWarden ? (bossPhase === 'void' ? 0.5 : 1.5) : 1

      // ── Berserk / Frenzy: compute effective attack speed ─────────────────────
      const baseSpeed = eff.hasFrenzy && player.currentHp < eff.maxHp * 0.30
        ? eff.attackSpeed * 2
        : eff.attackSpeed
      const effectiveAttackSpeed = baseSpeed * (hasBerserk ? 2 : 1)

      // ── Berserk: damage reduction = 0 ────────────────────────────────────────
      const effectiveDR = hasBerserk ? 0 : eff.damageReduction

      playerAttackProgress += effectiveAttackSpeed * (TICK_MS / 1000) * 100
      // Freeze: skip mob progress; Frenzied: double speed below 30% HP
      if (!hasFreezeEnemy) {
        const isFrenzied = mob.traits?.some(t => t.id === 'frenzied') ?? false
        const mobEffectiveSpeed = isFrenzied && mob.currentHp < mob.maxHp * 0.30
          ? mob.attackSpeed * 2
          : mob.attackSpeed
        mobAttackProgress += mobEffectiveSpeed * (TICK_MS / 1000) * 100
      }

      let newEventText: string | null = null

      if (playerAttackProgress >= 100) {
        playerAttackProgress -= 100
        const isCrit = eff.critChance > 0 && Math.random() < eff.critChance
        const giantMult = eff.eliteBonusMultiplier > 0 && (mob.tier === 'elite' || mob.tier === 'boss')
          ? 1 + eff.eliteBonusMultiplier : 1
        const dmg = Math.floor((isCrit ? eff.damage * 2 : eff.damage) * giantMult * bossPhaseMultiplier * glassBladeDmgMult)
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
          const dmgTaken = Math.max(0, Math.floor((mob.baseDamage * glassBladeIncomingMult - effectiveDR) * bossPhaseMultiplier))
          player.currentHp = Math.max(0, player.currentHp - dmgTaken)
          if (dmgTaken > 0) {
            damageIndicators.push({ id: now + Math.random() + 1, value: dmgTaken, isCrit: false, isSkill: false, target: 'player', createdAt: now })
          }
          // Vampiric: heal mob for 50% of damage dealt
          const isVampiric = mob.traits?.some(t => t.id === 'vampiric') ?? false
          if (isVampiric && dmgTaken > 0) {
            const healAmt = Math.floor(dmgTaken * 0.5)
            mob.currentHp = Math.min(mob.maxHp, mob.currentHp + healAmt)
            if (healAmt > 0) {
              damageIndicators.push({ id: now + Math.random() + 2, value: healAmt, isCrit: false, isSkill: false, isHeal: true, target: 'enemy', createdAt: now })
            }
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
          bossPhase,
          bossPhaseTimerMs,
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
          bossPhase,
          bossPhaseTimerMs,
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
          bossPhase,
          bossPhaseTimerMs,
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
        bossPhase,
        bossPhaseTimerMs,
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
        ironScrap:    state.ironScrap,
        voidDust:     state.voidDust,
        buildings:    state.buildings,
        slotUpgrades: state.slotUpgrades,
      }),
    }
  )
)
