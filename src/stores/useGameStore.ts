import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type {
  View, EquipSlot, ItemSlot, Rarity, TalentBranch, MobTier, MobTrait, TalentNode,
  DamageIndicator, ItemAbility, ConsumableEffect, ActiveBuff, Item,
  Player, RunStats, RunSummary, Mob, MapNode,
} from '../types'
import { TALENT_TREE, RARITY_COLORS, MAX_POTION_STACK, MAX_POTION_SLOTS } from '../data/constants'
import { getItemSellValue, computeAvailablePoints, computePlayerLevel, getEffectiveStats } from '../utils/gameHelpers'
import { spawnMob, generateMarketItems, randomDrop, randomThreeDrops, buildMap } from '../utils/storeHelpers'

// ─── Re-exports (preserve existing component import paths) ───────────────────

export type {
  View, EquipSlot, ItemSlot, Rarity, TalentBranch, MobTier, MobTrait, TalentNode,
  DamageIndicator, ItemAbility, ConsumableEffect, ActiveBuff, Item,
  Player, RunStats, RunSummary, Mob, MapNode,
}
export { TALENT_TREE, RARITY_COLORS, MAX_POTION_STACK, MAX_POTION_SLOTS }
export { getItemSellValue, computeAvailablePoints, computePlayerLevel, getEffectiveStats }

// ─── Internal constants ───────────────────────────────────────────────────────

const TICK_MS = 50
const POWER_STRIKE_COOLDOWN_MS = 5600
const XP_PER_KILL = 20
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
}

const EMPTY_EQUIPMENT: Record<EquipSlot, Item | null> = {
  head: null, chest: null, legs: null,
  mainHand: null, offHand: null,
  amulet: null, ring1: null, ring2: null,
  spell: null,
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
