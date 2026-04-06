import type { Mob, MobTier, MobTrait, Item, MapNode, Rarity } from '../types'
import { pickItemForFloor } from './itemLibrary'

// ─── Bestiary ─────────────────────────────────────────────────────────────────

type MobBase  = Omit<Mob, 'tier' | 'currentHp'>
type MobEntry = MobBase & { elitePortraitUrl?: string }

const BESTIARY: MobEntry[] = [
  { name: 'Goblin Rogue', maxHp: 50,  baseDamage: 2, attackSpeed: 0.30, portraitUrl: '/portraits/goblin-rogue.webp', elitePortraitUrl: '/portraits/elite-goblin-warrior.webp' },
  { name: 'Undead Brute', maxHp: 110, baseDamage: 7, attackSpeed: 0.90, portraitUrl: '/portraits/undead-brute.webp', elitePortraitUrl: '/portraits/elite-undead-brute.webp' },
  { name: 'Orc Warrior',  maxHp: 100, baseDamage: 5, attackSpeed: 0.55, portraitUrl: '/portraits/orc-warrior.webp' },
]

const VOID_WARDEN_BASE: MobBase = {
  name: 'The Void Warden', maxHp: 500, baseDamage: 12, attackSpeed: 0.65, portraitUrl: '/portraits/void-warden.webp',
}

// ─── Elite Traits ─────────────────────────────────────────────────────────────

const TRAIT_VAMPIRIC: MobTrait = {
  id: 'vampiric',
  name: 'Vampiric',
  description: 'Heals for 50% of damage dealt to the player.',
  icon: '🩸',
}

const TRAIT_FRENZIED: MobTrait = {
  id: 'frenzied',
  name: 'Frenzied',
  description: 'Attack speed is doubled when below 30% HP.',
  icon: '💢',
}

const ELITE_TRAITS = [TRAIT_VAMPIRIC, TRAIT_FRENZIED]

// ─── Mob spawning ─────────────────────────────────────────────────────────────

export function spawnMob(floor: number, nodeType: 'mob' | 'elite' | 'boss'): Mob {
  const hpMult  = nodeType === 'boss' ? 1.0
                : floor <= 15         ? 0.8
                : floor <= 30         ? 1.5
                :                       2.5

  const dmgMult = nodeType === 'boss' ? 1.0
                : floor <= 15         ? 1.2
                : floor <= 30         ? 2.0
                :                       2.5

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

  const scaledHp  = Math.round(base.maxHp     * hpMult)
  const scaledDmg = Math.round(base.baseDamage * dmgMult)

  return {
    name:        base.name,
    maxHp:       scaledHp,
    currentHp:   scaledHp,
    baseDamage:  scaledDmg,
    attackSpeed: base.attackSpeed,
    portraitUrl: tier === 'elite'
      ? ((base as MobEntry).elitePortraitUrl ?? base.portraitUrl)
      : base.portraitUrl,
    tier,
    traits: tier === 'elite'
      ? [ELITE_TRAITS[Math.floor(Math.random() * ELITE_TRAITS.length)]]
      : undefined,
  }
}

// ─── Loot helpers ─────────────────────────────────────────────────────────────

function itemPrice(rarity: Rarity): number {
  const [lo, hi] = rarity === 'common'   ? [20,  30]
                 : rarity === 'uncommon' ? [45,  65]
                 : rarity === 'rare'     ? [100, 140]
                 :                         [220, 280]
  return Math.floor(Math.random() * (hi - lo + 1)) + lo
}

export function generateMarketItems(floor?: number): { item: Item; price: number }[] {
  const result: { item: Item; price: number }[] = []
  const usedNames = new Set<string>()
  let attempts = 0
  while (result.length < 4 && attempts < 50) {
    const item = pickItemForFloor(floor ?? 1)
    if (!usedNames.has(item.name)) {
      result.push({ item, price: itemPrice(item.rarity) })
      usedNames.add(item.name)
    }
    attempts++
  }
  return result
}

export function randomDrop(floor: number): Item {
  return pickItemForFloor(floor)
}

export function randomThreeDrops(floor: number): Item[] {
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

// ─── Map generation ───────────────────────────────────────────────────────────

const MID_FLOOR_TYPES: MapNode['type'][] = ['mob', 'mob', 'mob', 'mob', 'mob', 'mob', 'mob', 'rest', 'rest', 'chest']
const MARKET_FLOORS = new Set([7, 14, 22, 29, 37])

export function buildMap(): MapNode[][] {
  const floors: MapNode[][] = []

  for (let f = 1; f <= 45; f++) {
    let types: MapNode['type'][]

    if (f === 1) {
      types = ['mob']
    } else if (MARKET_FLOORS.has(f)) {
      types = ['market']
    } else if (f === 15 || f === 30) {
      types = ['elite']
    } else if (f === 45) {
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

  for (let fi = 0; fi < 44; fi++) {
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
