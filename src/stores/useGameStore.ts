import { create } from 'zustand'

// ─── Types ────────────────────────────────────────────────────────────────────

export type View = 'battle' | 'inventory' | 'hub'

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

// ─── Map generation helpers ───────────────────────────────────────────────────

// Weighted pool: mob appears 2× to keep combat the dominant encounter
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

  // Build connections: each node on floor F → 1–2 nodes on floor F+1
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

    // Guarantee: every next-floor node has at least one incoming connection
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
  playerAttackProgress: number // 0–100
  mobAttackProgress: number    // 0–100
  isCombatActive: boolean

  // Skills state
  shieldBashCooldown: number // ms remaining; 0 = ready

  // Combat actions
  startCombat: () => void
  tickCombat: () => void
  useShieldBash: () => void
  resetRun: () => void
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
      // Also reset player HP for a fresh run
      player: { ...DEFAULT_PLAYER },
    }),

  // ── chooseNode ──────────────────────────────────────────────────────────────
  // Validates path legality, then starts combat or resolves an instant event.
  chooseNode: (nodeId) =>
    set((state) => {
      const allNodes = state.act1Map.flat()
      const node = allNodes.find((n) => n.id === nodeId)

      // Validation guards
      if (!node) return state
      if (node.floor !== state.currentFloor) return state
      if (node.isCompleted) return state

      // Path connectivity: floor 1 is always open; otherwise must be connected
      if (state.currentMapNodeId !== null) {
        const prev = allNodes.find((n) => n.id === state.currentMapNodeId)
        if (!prev || !prev.connectedTo.includes(nodeId)) return state
      }

      const markComplete = (map: MapNode[][]): MapNode[][] =>
        map.map((floor) =>
          floor.map((n) => (n.id === nodeId ? { ...n, isCompleted: true } : n))
        )

      // Combat nodes → hide map, start fighting
      if (node.type === 'mob' || node.type === 'elite' || node.type === 'boss') {
        return {
          currentMapNodeId: nodeId,
          isMapVisible: false,
          currentMob: { ...ORC_GRUNT },
          playerAttackProgress: 0,
          mobAttackProgress: 0,
          shieldBashCooldown: 0,
          isCombatActive: true,
        }
      }

      // Rest node → heal, advance floor, stay on map
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

      // Chest node → XP, advance floor, stay on map
      if (node.type === 'chest') {
        return {
          currentMapNodeId: nodeId,
          currentFloor: state.currentFloor + 1,
          act1Map: markComplete(state.act1Map),
          playerXp: state.playerXp + XP_PER_CHEST,
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

  // ── startCombat ─────────────────────────────────────────────────────────────
  // Direct start (used if the player clicks Start Combat without the map).
  startCombat: () =>
    set({
      currentMob: { ...ORC_GRUNT },
      playerAttackProgress: 0,
      mobAttackProgress: 0,
      shieldBashCooldown: 0,
      isCombatActive: true,
    }),

  // ── useShieldBash ───────────────────────────────────────────────────────────
  useShieldBash: () =>
    set((state) => {
      if (!state.isCombatActive || state.shieldBashCooldown > 0) return state

      const mob = { ...state.currentMob }
      mob.currentHp = Math.max(0, mob.currentHp - SHIELD_BASH_DAMAGE)

      const isCombatActive = mob.currentHp > 0 && state.player.currentHp > 0

      return {
        currentMob: mob,
        mobAttackProgress: 0,
        shieldBashCooldown: SHIELD_BASH_COOLDOWN_MS,
        isCombatActive,
      }
    }),

  // ── resetRun ────────────────────────────────────────────────────────────────
  // Generates a fresh map and restores player HP. XP is preserved across runs.
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
      isCombatActive: false,
      activeView: 'battle',
    })),

  // ── tickCombat ──────────────────────────────────────────────────────────────
  tickCombat: () =>
    set((state) => {
      if (!state.isCombatActive) return state

      let playerAttackProgress = state.playerAttackProgress
      let mobAttackProgress = state.mobAttackProgress
      const player = { ...state.player }
      const mob = { ...state.currentMob }

      playerAttackProgress += player.attackSpeed * (TICK_MS / 1000) * 100
      mobAttackProgress += mob.attackSpeed * (TICK_MS / 1000) * 100

      if (playerAttackProgress >= 100) {
        playerAttackProgress -= 100
        mob.currentHp = Math.max(0, mob.currentHp - player.baseDamage)
      }

      if (mobAttackProgress >= 100) {
        mobAttackProgress -= 100
        player.currentHp = Math.max(0, player.currentHp - mob.baseDamage)
      }

      const shieldBashCooldown = Math.max(0, state.shieldBashCooldown - TICK_MS)
      const isCombatActive = mob.currentHp > 0 && player.currentHp > 0

      // Player wins: return to map, advance floor, award XP, mark node complete
      if (!isCombatActive && mob.currentHp <= 0) {
        const act1Map = state.act1Map.map((floor) =>
          floor.map((n) =>
            n.id === state.currentMapNodeId ? { ...n, isCompleted: true } : n
          )
        )
        return {
          player,
          currentMob: mob,
          playerAttackProgress,
          mobAttackProgress,
          shieldBashCooldown,
          isCombatActive: false,
          isMapVisible: true,
          currentFloor: state.currentFloor + 1,
          playerXp: state.playerXp + XP_PER_KILL,
          act1Map,
        }
      }

      return {
        player,
        currentMob: mob,
        playerAttackProgress,
        mobAttackProgress,
        shieldBashCooldown,
        isCombatActive,
      }
    }),
}))
