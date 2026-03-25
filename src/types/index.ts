// ─── Navigation ───────────────────────────────────────────────────────────────

export type View = 'battle' | 'inventory' | 'hub'

// ─── Equipment ────────────────────────────────────────────────────────────────

export type EquipSlot =
  | 'head' | 'chest' | 'legs'
  | 'mainHand' | 'offHand'
  | 'amulet' | 'ring1' | 'ring2'
  | 'spell'

export type ItemSlot = EquipSlot | 'potion'

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic'

// ─── Talent System ────────────────────────────────────────────────────────────

import type { LucideIcon } from 'lucide-react'

export type TalentBranch = 'vitality' | 'might' | 'celerity'

export interface TalentNode {
  id: string
  name: string
  description: string
  maxRank: number
  costPerRank: number
  branch: TalentBranch
  tier: number              // 1 = top of branch; tier N requires tier N-1 rank >= 1
  icon: LucideIcon
  effect: {
    type: 'flat' | 'percent'
    stat: 'hp' | 'damage' | 'attackSpeed' | 'damageReduction' | 'critChance' | 'dodgeChance'
        | 'lifesteal' | 'postCombatHealPct' | 'eliteBonusMultiplier' | 'executionThreshold'
        | 'undying' | 'frenzy'
    valuePerRank: number
  }
}

// ─── Combat Feedback ──────────────────────────────────────────────────────────

export interface DamageIndicator {
  id: number
  value: number
  isCrit: boolean
  isSkill: boolean      // true for Shield Bash / spell damage
  isHeal?: boolean      // true for vampiric mob self-healing
  target: 'player' | 'enemy'
  createdAt: number
}

// ─── Items ────────────────────────────────────────────────────────────────────

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

// ─── Player ───────────────────────────────────────────────────────────────────

export interface Player {
  name: string
  playerClass: string
  maxHp: number
  currentHp: number
  baseDamage: number
  attackSpeed: number // attacks per second
  gold: number        // per-run; resets on new run / death
}

// ─── Run tracking ─────────────────────────────────────────────────────────────

export interface RunStats {
  monstersKilled:    number
  goldGathered:      number
  ironScrapGathered: number
  voidDustGathered:  number
}

export interface RunSummary {
  active: boolean
  status: 'dead' | 'victory'
  previousTotalXp: number
  goldAtDeath: number
}

// ─── Enemy ────────────────────────────────────────────────────────────────────

export type MobTier = 'normal' | 'elite' | 'boss'

export interface MobTrait {
  id: string
  name: string
  description: string
  icon: string
}

export interface Mob {
  name: string
  maxHp: number
  currentHp: number
  baseDamage: number
  attackSpeed: number // attacks per second
  tier: MobTier
  traits?: MobTrait[]
}

// ─── Map ──────────────────────────────────────────────────────────────────────

export interface MapNode {
  id: string            // "{floor}-{index}", e.g. "3-1"
  floor: number         // 1–20
  type: 'mob' | 'elite' | 'boss' | 'rest' | 'chest' | 'market'
  connectedTo: string[] // IDs of nodes on floor+1 this leads to
  isCompleted: boolean
}
