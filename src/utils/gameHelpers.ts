import type { Rarity, Player, EquipSlot, Item, EquipmentSlotName, EquipmentSlotUpgrades, SetName } from '../types'
import { TALENT_TREE, SLOT_TIER_BONUSES, SET_BONUSES } from '../data/constants'

// ─── Item sell value ──────────────────────────────────────────────────────────

export function getItemSellValue(rarity: Rarity): number {
  const VALUES: Record<Rarity, number> = { common: 5, uncommon: 12, rare: 25, epic: 55 }
  return VALUES[rarity]
}

// ─── Smart slot targeting ─────────────────────────────────────────────────────
// Returns the actual EquipSlot the item will land in, mirroring equipItem
// smart-fill logic (fill empty slot first, fall back to primary slot).

export function getTargetEquipSlot(item: Item, equipment: Record<EquipSlot, Item | null>): EquipSlot {
  const slot = item.equipSlot
  if (slot === 'mainHand') {
    return 'mainHand'
  }
  if (slot === 'offHand') {
    return 'offHand'  // shields always target offHand
  }
  if (slot === 'ring1' || slot === 'ring2') {
    if (!equipment.ring1) return 'ring1'
    if (!equipment.ring2) return 'ring2'
    return 'ring1'
  }
  return slot as EquipSlot
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
  talents: Record<string, number> = {},
  slotUpgrades?: EquipmentSlotUpgrades
) {
  const equippedItems = Object.values(equipment).filter(Boolean) as Item[]

  let flatHp = 0, flatDmg = 0, flatSpd = 0
  let pctHp  = 0, pctDmg  = 0, pctSpd  = 0
  let flatDr = 0, flatCrit = 0, flatDodge = 0, flatLifesteal = 0
  let flatHealPct = 0, flatEliteBonus = 0, flatExecution = 0, flatUndying = 0, flatFrenzy = 0

  for (const node of TALENT_TREE) {
    const rank = Math.min(talents[node.id] ?? 0, node.maxRank)
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

  let gearHp        = equippedItems.reduce((s, i) => s + (i.stats.hp              ?? 0), 0)
  let gearDmg       = equippedItems.reduce((s, i) => s + (i.stats.damage          ?? 0), 0)
  let gearSpd       = equippedItems.reduce((s, i) => s + (i.stats.attackSpeed     ?? 0), 0)
  let gearCritRaw   = equippedItems.reduce((s, i) => s + (i.stats.critChance      ?? 0), 0)
  let gearDodgeRaw  = equippedItems.reduce((s, i) => s + (i.stats.dodgeChance     ?? 0), 0)
  let gearLifesteal = equippedItems.reduce((s, i) => s + (i.stats.lifesteal       ?? 0), 0)
  let gearDr        = equippedItems.reduce((s, i) => s + (i.stats.damageReduction ?? 0), 0)
  let gearThorns    = equippedItems.reduce((s, i) => s + (i.stats.thorns          ?? 0), 0)

  // Apply slot upgrade bonuses (stacks with gear and talent %)
  if (slotUpgrades) {
    for (const [slot, level] of Object.entries(slotUpgrades) as [EquipmentSlotName, number][]) {
      if (level === 0) continue
      const bonus = SLOT_TIER_BONUSES[slot]?.[level as 1 | 2 | 3 | 4]
      if (!bonus) continue
      gearHp        += bonus.hp              ?? 0
      gearDmg       += bonus.damage          ?? 0
      gearSpd       += bonus.attackSpeed     ?? 0
      gearCritRaw   += bonus.critChance      ?? 0
      gearDodgeRaw  += bonus.dodgeChance     ?? 0
      gearLifesteal += bonus.lifesteal       ?? 0
      gearDr        += bonus.damageReduction ?? 0
    }
  }

  // Safety: if values were accidentally stored as integers (e.g. 10 instead of 0.10), normalise
  const gearCrit  = gearCritRaw  > 1 ? gearCritRaw  / 100 : gearCritRaw
  const gearDodge = gearDodgeRaw > 1 ? gearDodgeRaw / 100 : gearDodgeRaw

  // ─── Set Bonuses ────────────────────────────────────────────────────────────
  const setCounts: Partial<Record<SetName, number>> = {}
  for (const equippedItem of equippedItems) {
    if (equippedItem.setName) setCounts[equippedItem.setName] = (setCounts[equippedItem.setName] ?? 0) + 1
  }
  for (const [setKey, count] of Object.entries(setCounts) as [SetName, number][]) {
    for (const tier of SET_BONUSES[setKey].tiers) {
      if (count >= tier.pieces) {
        if (tier.maxHp)             flatHp        += tier.maxHp
        if (tier.damageReduction)   flatDr        += tier.damageReduction
        if (tier.thorns)            gearThorns    += tier.thorns
        if (tier.dodgeChance)       flatDodge     += tier.dodgeChance
        if (tier.critChance)        flatCrit      += tier.critChance
        if (tier.pctAttackSpeed)    pctSpd        += tier.pctAttackSpeed
        if (tier.damage)            flatDmg       += tier.damage
        if (tier.lifesteal)         flatLifesteal += tier.lifesteal
        if (tier.postCombatHealPct) flatHealPct   += tier.postCombatHealPct
      }
    }
  }

  return {
    maxHp:                Math.floor((player.maxHp      + flatHp  + gearHp)  * (1 + pctHp)),
    damage:               Math.floor((player.baseDamage + flatDmg + gearDmg) * (1 + pctDmg)),
    attackSpeed:                     (player.attackSpeed + flatSpd + gearSpd) * (1 + pctSpd),
    damageReduction:      flatDr + gearDr,
    critChance:           flatCrit + gearCrit,
    dodgeChance:          flatDodge + gearDodge,
    lifesteal:            Math.floor(flatLifesteal + gearLifesteal),
    thorns:               Math.floor(gearThorns),
    postCombatHealPct:    flatHealPct,
    eliteBonusMultiplier: flatEliteBonus,
    executionThreshold:   flatExecution,
    hasUndying:           flatUndying >= 1,
    hasFrenzy:            flatFrenzy >= 1,
  }
}
