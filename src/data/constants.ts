import type { Rarity, TalentNode, SlotRarityLevel, EquipmentSlotName, Boon, SetName } from '../types'
import {
  ShieldPlus, Shield, HeartPulse, Sparkles,
  Axe, Crosshair, Swords, Skull,
  Zap, Wind, Droplets, Flame,
} from 'lucide-react'

// ─── Rarity colours ───────────────────────────────────────────────────────────

export const RARITY_COLORS: Record<Rarity, { text: string; border: string; glow: string }> = {
  common:   { text: 'text-gray-300',   border: 'border-gray-500',   glow: '' },
  uncommon: { text: 'text-teal-400',   border: 'border-teal-500',   glow: 'ring-1 ring-teal-500/40' },
  rare:     { text: 'text-blue-400',   border: 'border-blue-500',   glow: 'ring-1 ring-blue-500/40' },
  epic:     { text: 'text-purple-400', border: 'border-purple-500', glow: 'ring-1 ring-purple-500/40' },
  set:      { text: 'text-lime-400',   border: 'border-lime-500',   glow: 'ring-1 ring-lime-500/40' },
}

// ─── Slot upgrade config ──────────────────────────────────────────────────────

export const SLOT_TIER_COLORS: Record<SlotRarityLevel, { border: string; text: string; label: string; dot: string }> = {
  0: { border: 'border-gray-700',    text: 'text-gray-500',    label: 'Base',     dot: '' },
  1: { border: 'border-gray-500',    text: 'text-gray-300',    label: 'Common',   dot: 'bg-stone-500' },
  2: { border: 'border-emerald-500', text: 'text-emerald-400', label: 'Uncommon', dot: 'bg-emerald-500 shadow-sm shadow-emerald-500' },
  3: { border: 'border-blue-500',    text: 'text-blue-400',    label: 'Rare',     dot: 'bg-blue-500 shadow-sm shadow-blue-500' },
  4: { border: 'border-purple-600',  text: 'text-purple-400',  label: 'Epic',     dot: 'bg-purple-600 shadow-sm shadow-purple-600' },
}

export const SLOT_UPGRADE_COSTS: Record<1 | 2 | 3 | 4, number> = {
  1: 10, 2: 25, 3: 75, 4: 200,
}

type SlotBonus = {
  hp?: number; damage?: number; attackSpeed?: number
  critChance?: number; dodgeChance?: number; lifesteal?: number; damageReduction?: number
}

export const SLOT_TIER_BONUSES: Record<EquipmentSlotName, Record<1 | 2 | 3 | 4, SlotBonus>> = {
  head:     { 1: { hp: 5 }, 2: { hp: 12 }, 3: { hp: 22 }, 4: { hp: 35, dodgeChance: 0.03 } },
  chest:    { 1: { hp: 5, damageReduction: 1 }, 2: { hp: 12, damageReduction: 2 }, 3: { hp: 22, damageReduction: 3 }, 4: { hp: 35, damageReduction: 5 } },
  legs:     { 1: { dodgeChance: 0.01 }, 2: { dodgeChance: 0.02 }, 3: { dodgeChance: 0.03 }, 4: { dodgeChance: 0.05 } },
  mainHand: { 1: { damage: 2 }, 2: { damage: 5 }, 3: { damage: 9 }, 4: { damage: 14, critChance: 0.05 } },
  offHand:  { 1: { damageReduction: 1 }, 2: { damageReduction: 2 }, 3: { damageReduction: 4 }, 4: { damageReduction: 6, hp: 5 } },
  amulet:   { 1: { critChance: 0.01 }, 2: { critChance: 0.02 }, 3: { critChance: 0.03 }, 4: { critChance: 0.05, damage: 2 } },
  ring1:    { 1: { attackSpeed: 0.03 }, 2: { attackSpeed: 0.06 }, 3: { attackSpeed: 0.10 }, 4: { attackSpeed: 0.14, damage: 3 } },
  ring2:    { 1: { lifesteal: 2 }, 2: { lifesteal: 5 }, 3: { lifesteal: 8 }, 4: { lifesteal: 12, hp: 5 } },
}

// ─── Talent tree ──────────────────────────────────────────────────────────────

export const TALENT_TREE: TalentNode[] = [
  // ── Vitality ──────────────────────────────────────────────────────────────
  { id:'vit_1', branch:'vitality', tier:1, name:'Fortitude',    icon:ShieldPlus,  description:'+8 Max HP per point',               maxRank:3, costPerRank:1, effect:{type:'flat',    stat:'hp',                   valuePerRank:8    }},
  { id:'vit_2', branch:'vitality', tier:2, name:'Thick Skin',   icon:Shield,      description:'+1 Damage Reduction per point',     maxRank:3, costPerRank:1, effect:{type:'flat',    stat:'damageReduction',       valuePerRank:1    }},
  { id:'vit_3', branch:'vitality', tier:3, name:'Field Medic',  icon:HeartPulse,  description:'Heal 5% Max HP after combat/point', maxRank:3, costPerRank:2, effect:{type:'flat',    stat:'postCombatHealPct',     valuePerRank:0.05 }},
  { id:'vit_4', branch:'vitality', tier:4, name:'Undying',      icon:Sparkles,    description:'Revive once per run at 30% HP',     maxRank:1, costPerRank:3, effect:{type:'flat',    stat:'undying',               valuePerRank:1    }},

  // ── Might ─────────────────────────────────────────────────────────────────
  { id:'mgt_1', branch:'might',    tier:1, name:'Brutality',    icon:Axe,         description:'+2 Base Damage per point',          maxRank:3, costPerRank:1, effect:{type:'flat',    stat:'damage',                valuePerRank:2    }},
  { id:'mgt_2', branch:'might',    tier:2, name:'Precision',    icon:Crosshair,   description:'+8% Crit Chance per point',         maxRank:3, costPerRank:1, effect:{type:'flat',    stat:'critChance',            valuePerRank:0.08 }},
  { id:'mgt_3', branch:'might',    tier:3, name:'Giant Slayer', icon:Swords,      description:'+15% dmg vs Elites & Bosses/point', maxRank:3, costPerRank:2, effect:{type:'flat',    stat:'eliteBonusMultiplier',  valuePerRank:0.15 }},
  { id:'mgt_4', branch:'might',    tier:4, name:'Executioner',  icon:Skull,       description:'Instantly kill enemies below 15%',  maxRank:1, costPerRank:3, effect:{type:'flat',    stat:'executionThreshold',    valuePerRank:0.15 }},

  // ── Celerity ──────────────────────────────────────────────────────────────
  { id:'cel_1', branch:'celerity', tier:1, name:'Quick Hands',  icon:Zap,         description:'+8% Attack Speed per point',        maxRank:3, costPerRank:1, effect:{type:'percent', stat:'attackSpeed',           valuePerRank:0.08 }},
  { id:'cel_2', branch:'celerity', tier:2, name:'Agility',      icon:Wind,        description:'+5% Dodge Chance per point',        maxRank:3, costPerRank:1, effect:{type:'flat',    stat:'dodgeChance',           valuePerRank:0.05 }},
  { id:'cel_3', branch:'celerity', tier:3, name:'Vampirism',    icon:Droplets,    description:'+1 Lifesteal per point',            maxRank:3, costPerRank:2, effect:{type:'flat',    stat:'lifesteal',             valuePerRank:1    }},
  { id:'cel_4', branch:'celerity', tier:4, name:'Frenzy',       icon:Flame,       description:'2× Attack Speed below 30% HP',      maxRank:1, costPerRank:3, effect:{type:'flat',    stat:'frenzy',                valuePerRank:1    }},
]

// ─── Potion limits ────────────────────────────────────────────────────────────

export const MAX_POTION_STACK = 1
export const MAX_POTION_SLOTS = 1

// ─── Boons ────────────────────────────────────────────────────────────────────

export const BOONS: Boon[] = [
  {
    id: 'glass-blade',
    name: 'Glass Blade',
    description: '+50% Base Damage, but you take +25% more damage.',
    icon: '🗡️',
    iconUrl: '/boons/glass-blade.webp',
  },
  {
    id: 'thick-blood',
    name: 'Thick Blood',
    description: '+30 Max HP for this run.',
    icon: '🩸',
    iconUrl: '/boons/thick-blood.webp',
  },
  {
    id: 'scholar',
    name: 'Scholar of the Void',
    description: '+50% XP gained from all sources.',
    icon: '📖',
    iconUrl: '/boons/scholar.webp',
  },
]

// ─── Set Bonus Descriptors ────────────────────────────────────────────────────

export type SetBonusTier = {
  pieces: 2 | 4
  description: string
  maxHp?: number
  damageReduction?: number
  thorns?: number
  dodgeChance?: number
  critChance?: number
  pctAttackSpeed?: number
  damage?: number
  lifesteal?: number
  postCombatHealPct?: number
}

export const SET_BONUSES: Record<SetName, { name: string; color: string; tiers: SetBonusTier[] }> = {
  vanguard: {
    name: 'Vanguard', color: 'text-amber-400',
    tiers: [
      { pieces: 2, description: '+20 Max HP',          maxHp: 20 },
      { pieces: 4, description: '+2 DR & +5 Thorns',   damageReduction: 2, thorns: 5 },
    ],
  },
  assassin: {
    name: 'Assassin', color: 'text-yellow-300',
    tiers: [
      { pieces: 2, description: '+10% Dodge',                  dodgeChance: 0.10 },
      { pieces: 4, description: '+20% Crit & +20% Atk Spd',    critChance: 0.20, pctAttackSpeed: 0.20 },
    ],
  },
  bloodbound: {
    name: 'Bloodbound', color: 'text-rose-400',
    tiers: [
      { pieces: 2, description: '+3 Lifesteal',                         lifesteal: 3 },
      { pieces: 4, description: '+10 Damage & +15% Post-Combat Heal',   damage: 10, postCombatHealPct: 0.15 },
    ],
  },
}

// ─── Set Bonus inline text (for item cards) ───────────────────────────────────

export const SET_BONUS_TEXT: Record<string, Record<2 | 4, string>> = {
  vanguard:   { 2: '+20 Max HP', 4: '+2 DR & +5 Thorns' },
  assassin:   { 2: '+10% Dodge', 4: '+20% Crit & +20% Atk Spd' },
  bloodbound: { 2: '+3 Lifesteal', 4: '+10 Base Dmg & +15% Heal' },
}
