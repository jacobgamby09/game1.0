import type { Rarity, Player, EquipSlot, Item } from '../types'
import { TALENT_TREE } from '../data/constants'

// ─── Item sell value ──────────────────────────────────────────────────────────

export function getItemSellValue(rarity: Rarity): number {
  const VALUES: Record<Rarity, number> = { common: 5, uncommon: 12, rare: 25, epic: 55 }
  return VALUES[rarity]
}

// ─── Talent point helpers ─────────────────────────────────────────────────────

export function computeAvailablePoints(totalXp: number, talents: Record<string, number>): number {
  const spent = TALENT_TREE.reduce((s, n) => s + (talents[n.id] ?? 0) * n.costPerRank, 0)
  return Math.floor(totalXp / 100) - spent
}

export function computePlayerLevel(totalXp: number): number {
  return Math.floor(totalXp / 100) + 1
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
