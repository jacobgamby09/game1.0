import type { Rarity, TalentNode } from '../types'
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
}

// ─── Talent tree ──────────────────────────────────────────────────────────────

export const TALENT_TREE: TalentNode[] = [
  // ── Vitality ──────────────────────────────────────────────────────────────
  { id:'vit_1', branch:'vitality', tier:1, name:'Fortitude',    icon:ShieldPlus,  description:'+5 Max HP per point',               maxRank:5, costPerRank:1, effect:{type:'flat',    stat:'hp',                   valuePerRank:5    }},
  { id:'vit_2', branch:'vitality', tier:2, name:'Thick Skin',   icon:Shield,      description:'+1 Damage Reduction per point',     maxRank:3, costPerRank:1, effect:{type:'flat',    stat:'damageReduction',       valuePerRank:1    }},
  { id:'vit_3', branch:'vitality', tier:3, name:'Field Medic',  icon:HeartPulse,  description:'Heal 5% Max HP after combat/point', maxRank:3, costPerRank:2, effect:{type:'flat',    stat:'postCombatHealPct',     valuePerRank:0.05 }},
  { id:'vit_4', branch:'vitality', tier:4, name:'Undying',      icon:Sparkles,    description:'Revive once per run at 30% HP',     maxRank:1, costPerRank:3, effect:{type:'flat',    stat:'undying',               valuePerRank:1    }},

  // ── Might ─────────────────────────────────────────────────────────────────
  { id:'mgt_1', branch:'might',    tier:1, name:'Brutality',    icon:Axe,         description:'+1 Base Damage per point',          maxRank:5, costPerRank:1, effect:{type:'flat',    stat:'damage',                valuePerRank:1    }},
  { id:'mgt_2', branch:'might',    tier:2, name:'Precision',    icon:Crosshair,   description:'+5% Crit Chance per point',         maxRank:5, costPerRank:1, effect:{type:'flat',    stat:'critChance',            valuePerRank:0.05 }},
  { id:'mgt_3', branch:'might',    tier:3, name:'Giant Slayer', icon:Swords,      description:'+15% dmg vs Elites & Bosses/point', maxRank:3, costPerRank:2, effect:{type:'flat',    stat:'eliteBonusMultiplier',  valuePerRank:0.15 }},
  { id:'mgt_4', branch:'might',    tier:4, name:'Executioner',  icon:Skull,       description:'Instantly kill enemies below 15%',  maxRank:1, costPerRank:3, effect:{type:'flat',    stat:'executionThreshold',    valuePerRank:0.15 }},

  // ── Celerity ──────────────────────────────────────────────────────────────
  { id:'cel_1', branch:'celerity', tier:1, name:'Quick Hands',  icon:Zap,         description:'+5% Attack Speed per point',        maxRank:5, costPerRank:1, effect:{type:'percent', stat:'attackSpeed',           valuePerRank:0.05 }},
  { id:'cel_2', branch:'celerity', tier:2, name:'Agility',      icon:Wind,        description:'+3% Dodge Chance per point',        maxRank:5, costPerRank:1, effect:{type:'flat',    stat:'dodgeChance',           valuePerRank:0.03 }},
  { id:'cel_3', branch:'celerity', tier:3, name:'Vampirism',    icon:Droplets,    description:'+1 Lifesteal per point',            maxRank:3, costPerRank:2, effect:{type:'flat',    stat:'lifesteal',             valuePerRank:1    }},
  { id:'cel_4', branch:'celerity', tier:4, name:'Frenzy',       icon:Flame,       description:'2× Attack Speed below 30% HP',      maxRank:1, costPerRank:3, effect:{type:'flat',    stat:'frenzy',                valuePerRank:1    }},
]

// ─── Potion limits ────────────────────────────────────────────────────────────

export const MAX_POTION_STACK = 1
export const MAX_POTION_SLOTS = 1
