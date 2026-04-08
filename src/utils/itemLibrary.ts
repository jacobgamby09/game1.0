import type { Item, Rarity } from '../types'
import {
  Sword, Knife, Hammer, Axe,
  Shield, ShieldHalf, ShieldCheck,
  HardHat, Crown, Eye, Ghost, Skull,
  Shirt, Layers, Footprints, Wind,
  Award, Heart, Zap, Circle, Gem, Target, Infinity, Droplets,
  Flame, Snowflake, Sparkles, Coins,
} from 'lucide-react'

type ItemBase = Omit<Item, 'id'>

function newItemId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

// ─── Item Library ─────────────────────────────────────────────────────────────

const ITEM_LIBRARY: ItemBase[] = [

  // ── mainHand (weapons) ──────────────────────────────────────────────────────
  { name: 'Rusty Sword', equipSlot: 'mainHand', rarity: 'common', icon: Sword, description: 'A chipped blade found near the entrance.', stats: { damage: 5 } },
  { name: 'Iron Dagger', equipSlot: 'mainHand', rarity: 'common', icon: Knife, description: 'Light and quick; preferred by scouts.', stats: { damage: 3, attackSpeed: 0.25 } },
  { name: 'Serrated Blade', equipSlot: 'mainHand', rarity: 'uncommon', icon: Sword, description: 'Jagged teeth catch armour and rend flesh.', stats: { damage: 4, critChance: 0.04 } },
  { name: 'Heavy Mace', equipSlot: 'mainHand', rarity: 'uncommon', icon: Hammer, description: 'Slow and brutal — each strike has real weight.', stats: { damage: 7, attackSpeed: -0.15 } },
  { name: "Assassin's Kris", equipSlot: 'mainHand', rarity: 'rare', icon: Knife, description: 'Wavy-bladed ritual dagger that finds every gap in armour.', stats: { damage: 3, attackSpeed: 0.25, critChance: 0.07 } },
  { name: 'Blood-soaked Cleaver', equipSlot: 'mainHand', rarity: 'rare', icon: Axe, description: 'The blade has tasted so much blood it practically heals itself.', stats: { damage: 6, lifesteal: 3 } },
  { name: 'Void Blade', equipSlot: 'mainHand', rarity: 'epic', icon: Sword, description: 'A cursed edge that hungers for more.', stats: { damage: 9, lifesteal: 4, critChance: 0.05 } },
  { name: 'Thunderous Warhammer', equipSlot: 'mainHand', rarity: 'epic', icon: Hammer, description: 'Hits like a siege weapon — and swings about as fast.', stats: { damage: 15, attackSpeed: -0.3 } },

  // ── offHand (shields) ───────────────────────────────────────────────────────
  { name: 'Wooden Buckler', equipSlot: 'offHand', rarity: 'common', icon: Shield, description: 'A simple disc of hardwood; better than a bare arm.', stats: { hp: 10 } },
  { name: 'Cracked Kite Shield', equipSlot: 'offHand', rarity: 'common', icon: Shield, description: 'Reliable protection despite the fault lines running through it.', stats: { hp: 8, damageReduction: 1 } },
  { name: "Duelist's Parry Dagger", equipSlot: 'offHand', rarity: 'uncommon', icon: Knife, description: 'A nimble blade held reversed — perfect for deflecting blows.', stats: { dodgeChance: 0.05 } },
  { name: 'Iron Bulwark', equipSlot: 'offHand', rarity: 'uncommon', icon: ShieldHalf, description: 'Iron-banded wood, heavier than it looks.', stats: { hp: 10, damageReduction: 2 } },
  { name: 'Tower Shield of the Bear', equipSlot: 'offHand', rarity: 'rare', icon: Shield, description: 'Massive. Every hit that lands feels like it hit a wall.', stats: { hp: 18, damageReduction: 2 } },
  { name: 'Bladed Gauntlet', equipSlot: 'offHand', rarity: 'rare', icon: Shield, description: 'Armoured fist lined with forward-facing spikes.', stats: { damage: 3, dodgeChance: 0.05 } },
  { name: 'Aegis of the Ancients', equipSlot: 'offHand', rarity: 'epic', icon: ShieldCheck, description: 'An artifact buckler older than the kingdom, still unbroken.', stats: { hp: 27, damageReduction: 3 } },

  // ── head ────────────────────────────────────────────────────────────────────
  { name: 'Padded Cap', equipSlot: 'head', rarity: 'common', icon: HardHat, description: 'Cloth-padded leather cap; not glamorous but functional.', stats: { hp: 8 } },
  { name: "Hunter's Cowl", equipSlot: 'head', rarity: 'uncommon', icon: Eye, description: 'Light hood favoured by rangers for moving unseen.', stats: { dodgeChance: 0.06 } },
  { name: 'Shadow Hood', equipSlot: 'head', rarity: 'rare', icon: Ghost, description: 'Silk-dark hood that blurs your outline and steadies your hand.', stats: { critChance: 0.04, dodgeChance: 0.06 } },
  { name: 'Crown of the Warlord', equipSlot: 'head', rarity: 'epic', icon: Crown, description: 'A conqueror\'s crown — wearing it makes enemies hesitate.', stats: { damage: 4, lifesteal: 3 } },

  // ── chest ───────────────────────────────────────────────────────────────────
  { name: 'Leather Tunic', equipSlot: 'chest', rarity: 'common', icon: Shirt, description: 'Tough hide stitched into a serviceable coat.', stats: { hp: 15 } },
  { name: 'Chainmail', equipSlot: 'chest', rarity: 'uncommon', icon: Layers, description: 'Overlapping rings of tempered steel; diffuses the worst of it.', stats: { damageReduction: 3 } },
  { name: 'Shadow Garb', equipSlot: 'chest', rarity: 'rare', icon: Ghost, description: 'Slim dark armour that lets you slip through gaps in an attack.', stats: { critChance: 0.03, dodgeChance: 0.05 } },
  { name: 'Plate of Vitality', equipSlot: 'chest', rarity: 'rare', icon: Shirt, description: 'Thick iron plates riveted over a chain base.', stats: { hp: 20, damageReduction: 2 } },
  { name: 'Dragonscale Chestplate', equipSlot: 'chest', rarity: 'epic', icon: Shirt, description: 'Scales pried from a slain wyvern — still radiating warmth.', stats: { hp: 15, damageReduction: 3, critChance: 0.03 } },

  // ── legs ────────────────────────────────────────────────────────────────────
  { name: 'Leather Greaves', equipSlot: 'legs', rarity: 'common', icon: Footprints, description: 'Worn leather guards that still do the job.', stats: { hp: 8 } },
  { name: 'Windrunner Boots', equipSlot: 'legs', rarity: 'uncommon', icon: Wind, description: 'Swift-soled boots enchanted for evasion.', stats: { dodgeChance: 0.05 } },
  { name: 'Ironclad Legguards', equipSlot: 'legs', rarity: 'rare', icon: Layers, description: 'Solid iron plates welded to a chain base.', stats: { hp: 12, damageReduction: 2 } },
  { name: 'Phantom Treads', equipSlot: 'legs', rarity: 'epic', icon: Ghost, description: 'You move before your mind finishes thinking.', stats: { dodgeChance: 0.08, critChance: 0.03 } },

  // ── amulet ──────────────────────────────────────────────────────────────────
  { name: 'Brass Pendant', equipSlot: 'amulet', rarity: 'common', icon: Award, description: 'A plain brass pendant with a faint martial enchantment.', stats: { damage: 2 } },
  { name: 'Amulet of Vigor', equipSlot: 'amulet', rarity: 'uncommon', icon: Heart, description: 'Pulses gently against the skin, lending vitality.', stats: { lifesteal: 3 } },
  { name: 'Amulet of the Swift', equipSlot: 'amulet', rarity: 'rare', icon: Zap, description: 'Cool jade carved into a serpent devouring its tail.', stats: { attackSpeed: 0.2, dodgeChance: 0.06 } },
  { name: 'Eye of the Void', equipSlot: 'amulet', rarity: 'epic', icon: Eye, description: 'A gem that stares back — and teaches you to strike first.', stats: { critChance: 0.06, lifesteal: 3, damage: 3 } },

  // ── ring1 ───────────────────────────────────────────────────────────────────
  { name: 'Copper Band', equipSlot: 'ring1', rarity: 'common', icon: Circle, description: 'A plain ring of cold copper.', stats: { attackSpeed: 0.10 } },
  { name: 'Band of Fortitude', equipSlot: 'ring1', rarity: 'uncommon', icon: Gem, description: 'Thick-set ring engraved with a shield rune.', stats: { damage: 3, critChance: 0.03 } },
  { name: 'Ring of the Predator', equipSlot: 'ring1', rarity: 'rare', icon: Target, description: 'Set with a fang — your strikes feel predatory.', stats: { critChance: 0.05, damage: 2 } },
  { name: 'Ouroboros Ring', equipSlot: 'ring1', rarity: 'epic', icon: Infinity, description: 'A serpent swallowing its tail — you take, and it gives back.', stats: { lifesteal: 3, critChance: 0.03, attackSpeed: 0.1 } },

  // ── ring2 ───────────────────────────────────────────────────────────────────
  { name: 'Silver Ring', equipSlot: 'ring2', rarity: 'common', description: 'A light silver ring that makes your hands feel swifter.', stats: { attackSpeed: 0.05 } },
  { name: 'Iron Signet', equipSlot: 'ring2', rarity: 'uncommon', description: 'A military signet stamped with a crossed-swords crest.', stats: { damage: 2, attackSpeed: 0.10 } },
  { name: 'Serpent Ring', equipSlot: 'ring2', rarity: 'rare', description: 'A coiled serpent whose fangs bite the wearer\'s foe.', stats: { critChance: 0.04, damage: 3 } },
  { name: 'Void Ring', equipSlot: 'ring2', rarity: 'epic', description: 'Stares back at you when you look into its gem.', stats: { lifesteal: 3, critChance: 0.04, damage: 3 } },

  // ── spell ───────────────────────────────────────────────────────────────────
  { name: 'Flame Scroll', equipSlot: 'spell', rarity: 'common', description: 'A tattered scroll pulsing with heat.', stats: { damage: 1 }, ability: { name: 'Fireball', description: 'Deals 25 damage.', cooldown: 12000, effectType: 'damageEnemy', value: 25 } },
  { name: 'Frost Tome', equipSlot: 'spell', rarity: 'rare', description: 'Pages inscribed in permafrost runes.', stats: { damage: 3 }, ability: { name: 'Ice Lance', description: 'Deals 30 damage.', cooldown: 10000, effectType: 'damageEnemy', value: 30 } },
  { name: 'Thunder Codex', equipSlot: 'spell', rarity: 'epic', description: 'Lightning trapped between two pages.', stats: { damage: 5 }, ability: { name: 'Lightning Strike', description: 'Deals 50 damage.', cooldown: 15000, effectType: 'damageEnemy', value: 50 } },
  { name: 'Arcane Grimoire', equipSlot: 'spell', rarity: 'uncommon', description: 'A scholar\'s notebook rewritten with power.', stats: { hp: 5 }, ability: { name: 'Arcane Bolt', description: 'Deals 20 damage.', cooldown: 8000, effectType: 'damageEnemy', value: 20 } },

  // ── potions ─────────────────────────────────────────────────────────────────
  { name: 'Minor Health Potion', equipSlot: 'potion', rarity: 'common', icon: Heart, description: 'Heals 30% of your Max HP instantly.', stats: {}, consumableEffect: { type: 'heal', value: 0.3 } },
  { name: 'Glacial Flask', equipSlot: 'potion', rarity: 'uncommon', icon: Snowflake, description: 'Freezes the enemy for 4 seconds.', stats: {}, consumableEffect: { type: 'freezeEnemy', durationMS: 4000 } },
  { name: "Berserker's Brew", equipSlot: 'potion', rarity: 'rare', icon: Flame, description: '2× Attack Speed for 5s, but Damage Reduction = 0.', stats: {}, consumableEffect: { type: 'berserk', durationMS: 5000 } },
  { name: "Vampire's Draught", equipSlot: 'potion', rarity: 'rare', icon: Droplets, description: '+15 Lifesteal for the next 5 successful attacks.', stats: {}, consumableEffect: { type: 'lifestealBuff', charges: 5, value: 15 } },
  { name: 'Midas Elixir', equipSlot: 'potion', rarity: 'epic', icon: Coins, description: 'Next enemy death within 4s drops 3× Gold.', stats: {}, consumableEffect: { type: 'midas', durationMS: 4000 } },

  // ── Set Items — Vanguard (tank set) ─────────────────────────────────────────
  { name: 'Vanguard Blade', equipSlot: 'mainHand', rarity: 'set', setName: 'vanguard', icon: Sword, description: 'A broad sword etched with warding runes.', stats: { damage: 7, critChance: 0.03 } },
  { name: 'Vanguard Plate', equipSlot: 'chest', rarity: 'set', setName: 'vanguard', icon: Shirt, description: 'Thick iron plates layered with warding sigils.', stats: { hp: 22, damageReduction: 3 } },
  { name: 'Vanguard Helm', equipSlot: 'head', rarity: 'set', setName: 'vanguard', icon: HardHat, description: 'A full-face helm bearing the Vanguard seal.', stats: { hp: 14, damageReduction: 2 } },
  { name: 'Vanguard Signet', equipSlot: 'ring1', rarity: 'set', setName: 'vanguard', icon: Shield, description: 'A wide iron band engraved with a tower crest.', stats: { damage: 4, critChance: 0.04 } },

  // ── Set Items — Assassin (crit/speed set) ────────────────────────────────────
  { name: "Assassin's Fang", equipSlot: 'mainHand', rarity: 'set', setName: 'assassin', icon: Knife, description: "A slender blade whose edge vanishes in dim light.", stats: { damage: 4, attackSpeed: 0.20, critChance: 0.06 } },
  { name: "Assassin's Silks", equipSlot: 'chest', rarity: 'set', setName: 'assassin', icon: Shirt, description: "Near-weightless shadowsilk stitched for evasion.", stats: { hp: 10, dodgeChance: 0.07 } },
  { name: "Assassin's Cowl", equipSlot: 'head', rarity: 'set', setName: 'assassin', icon: Eye, description: "A deep hood that hides both face and intent.", stats: { critChance: 0.05, dodgeChance: 0.04 } },
  { name: "Assassin's Band", equipSlot: 'ring1', rarity: 'set', setName: 'assassin', icon: Target, description: "A slim obsidian ring, balanced for quick hands.", stats: { attackSpeed: 0.15, critChance: 0.04 } },

  // ── Set Items — Bloodbound (lifesteal set) ───────────────────────────────────
  { name: 'Bloodbound Reaper', equipSlot: 'mainHand', rarity: 'set', setName: 'bloodbound', icon: Axe, description: 'A curved blade that hungers — and satisfies.', stats: { damage: 6, lifesteal: 4 } },
  { name: 'Bloodbound Hauberk', equipSlot: 'chest', rarity: 'set', setName: 'bloodbound', icon: Shirt, description: 'Crimson-stained chainmail pulsing with stolen life.', stats: { hp: 18, damageReduction: 2 } },
  { name: 'Bloodbound Mask', equipSlot: 'head', rarity: 'set', setName: 'bloodbound', icon: Skull, description: 'A bone mask painted with a bloodbound covenant.', stats: { damage: 3, lifesteal: 2 } },
  { name: 'Bloodbound Ring', equipSlot: 'ring1', rarity: 'set', setName: 'bloodbound', icon: Droplets, description: 'A garnet ring that deepens in colour after each kill.', stats: { lifesteal: 3, critChance: 0.03 } },
]

// ─── Rarity weight helpers ────────────────────────────────────────────────────

function rarityWeights(floor: number): [number, number, number, number, number] {
  // [common, uncommon, rare, epic, set] — sums to 100
  if (floor <= 12) return [75, 25, 0, 0, 0]
  if (floor <= 24) return [35, 40, 15, 0, 10]
  if (floor <= 36) return [5, 40, 28, 5, 22]
  return [0, 15, 38, 20, 27]
}

function rollRarity(floor: number): Rarity {
  const [w0, w1, w2, w3] = rarityWeights(floor)
  const roll = Math.random() * 100
  if (roll < w0) return 'common'
  if (roll < w0 + w1) return 'uncommon'
  if (roll < w0 + w1 + w2) return 'rare'
  if (roll < w0 + w1 + w2 + w3) return 'epic'
  return 'set'
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function getItemsByRarity(rarity: Rarity): ItemBase[] {
  return ITEM_LIBRARY.filter(i => i.rarity === rarity)
}

export function pickItem(rarity: Rarity): Item {
  const pool = getItemsByRarity(rarity)
  const base = pool[Math.floor(Math.random() * pool.length)]
  return { ...base, id: newItemId() }
}

export function pickItemForFloor(floor: number): Item {
  return pickItem(rollRarity(floor))
}
