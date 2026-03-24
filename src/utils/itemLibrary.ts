import type { Item, Rarity } from '../stores/useGameStore'

type ItemBase = Omit<Item, 'id'>

function newItemId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

// ─── Item Library ─────────────────────────────────────────────────────────────

const ITEM_LIBRARY: ItemBase[] = [

  // ── mainHand (weapons) ──────────────────────────────────────────────────────
  { name: 'Rusty Sword',           equipSlot: 'mainHand', rarity: 'common',   description: 'A chipped blade found near the entrance.',                       stats: { damage: 5 } },
  { name: 'Iron Dagger',           equipSlot: 'mainHand', rarity: 'common',   description: 'Light and quick; preferred by scouts.',                          stats: { damage: 3, attackSpeed: 0.25 } },
  { name: 'Serrated Blade',        equipSlot: 'mainHand', rarity: 'uncommon', description: 'Jagged teeth catch armour and rend flesh.',                       stats: { damage: 6, critChance: 0.10 } },
  { name: 'Heavy Mace',            equipSlot: 'mainHand', rarity: 'uncommon', description: 'Slow and brutal — each strike has real weight.',                  stats: { damage: 11, attackSpeed: -0.15, damageReduction: 2 } },
  { name: "Assassin's Kris",       equipSlot: 'mainHand', rarity: 'rare',     description: 'Wavy-bladed ritual dagger that finds every gap in armour.',       stats: { damage: 5, attackSpeed: 0.25, critChance: 0.18 } },
  { name: 'Blood-soaked Cleaver',  equipSlot: 'mainHand', rarity: 'rare',     description: 'The blade has tasted so much blood it practically heals itself.', stats: { damage: 9, lifesteal: 6 } },
  { name: 'Void Blade',            equipSlot: 'mainHand', rarity: 'epic',     description: 'A cursed edge that hungers for more.',                            stats: { damage: 14, lifesteal: 8, critChance: 0.12 } },
  { name: 'Thunderous Warhammer',  equipSlot: 'mainHand', rarity: 'epic',     description: 'Hits like a siege weapon — and swings about as fast.',            stats: { damage: 24, attackSpeed: -0.3 } },

  // ── offHand (shields) ───────────────────────────────────────────────────────
  { name: 'Wooden Buckler',        equipSlot: 'offHand',  rarity: 'common',   description: 'A simple disc of hardwood; better than a bare arm.',             stats: { hp: 10 } },
  { name: 'Cracked Kite Shield',   equipSlot: 'offHand',  rarity: 'common',   description: 'Reliable protection despite the fault lines running through it.', stats: { hp: 8, damageReduction: 1 } },
  { name: "Duelist's Parry Dagger",equipSlot: 'offHand',  rarity: 'uncommon', description: 'A nimble blade held reversed — perfect for deflecting blows.',    stats: { dodgeChance: 0.08 } },
  { name: 'Iron Bulwark',          equipSlot: 'offHand',  rarity: 'uncommon', description: 'Iron-banded wood, heavier than it looks.',                        stats: { hp: 15, damageReduction: 2 } },
  { name: 'Tower Shield of the Bear',equipSlot:'offHand', rarity: 'rare',     description: 'Massive. Every hit that lands feels like it hit a wall.',          stats: { hp: 30, damageReduction: 4 } },
  { name: 'Bladed Gauntlet',       equipSlot: 'offHand',  rarity: 'rare',     description: 'Armoured fist lined with forward-facing spikes.',                  stats: { damage: 4, dodgeChance: 0.08 } },
  { name: 'Aegis of the Ancients', equipSlot: 'offHand',  rarity: 'epic',     description: 'An artifact buckler older than the kingdom, still unbroken.',      stats: { hp: 40, damageReduction: 7, lifesteal: 4 } },

  // ── head ────────────────────────────────────────────────────────────────────
  { name: 'Padded Cap',            equipSlot: 'head',     rarity: 'common',   description: 'Cloth-padded leather cap; not glamorous but functional.',          stats: { hp: 8 } },
  { name: "Hunter's Cowl",         equipSlot: 'head',     rarity: 'uncommon', description: 'Light hood favoured by rangers for moving unseen.',                stats: { dodgeChance: 0.06 } },
  { name: 'Shadow Hood',           equipSlot: 'head',     rarity: 'rare',     description: 'Silk-dark hood that blurs your outline and steadies your hand.',    stats: { critChance: 0.10, dodgeChance: 0.06 } },
  { name: 'Crown of the Warlord',  equipSlot: 'head',     rarity: 'epic',     description: 'A conqueror\'s crown — wearing it makes enemies hesitate.',        stats: { damage: 6, lifesteal: 5 } },

  // ── chest ───────────────────────────────────────────────────────────────────
  { name: 'Leather Tunic',         equipSlot: 'chest',    rarity: 'common',   description: 'Tough hide stitched into a serviceable coat.',                     stats: { hp: 15 } },
  { name: 'Chainmail',             equipSlot: 'chest',    rarity: 'uncommon', description: 'Overlapping rings of tempered steel; diffuses the worst of it.',   stats: { damageReduction: 3 } },
  { name: 'Shadow Garb',           equipSlot: 'chest',    rarity: 'rare',     description: 'Slim dark armour that lets you slip through gaps in an attack.',   stats: { critChance: 0.08, dodgeChance: 0.08 } },
  { name: 'Plate of Vitality',     equipSlot: 'chest',    rarity: 'rare',     description: 'Thick iron plates riveted over a chain base.',                     stats: { hp: 35, damageReduction: 4 } },
  { name: 'Dragonscale Chestplate',equipSlot: 'chest',    rarity: 'epic',     description: 'Scales pried from a slain wyvern — still radiating warmth.',       stats: { hp: 25, damageReduction: 5, critChance: 0.08 } },

  // ── legs ────────────────────────────────────────────────────────────────────
  { name: 'Leather Greaves',       equipSlot: 'legs',     rarity: 'common',   description: 'Worn leather guards that still do the job.',                        stats: { hp: 8 } },
  { name: 'Windrunner Boots',      equipSlot: 'legs',     rarity: 'uncommon', description: 'Swift-soled boots enchanted for evasion.',                          stats: { dodgeChance: 0.08 } },
  { name: 'Ironclad Legguards',    equipSlot: 'legs',     rarity: 'rare',     description: 'Solid iron plates welded to a chain base.',                         stats: { hp: 18, damageReduction: 2 } },
  { name: 'Phantom Treads',        equipSlot: 'legs',     rarity: 'epic',     description: 'You move before your mind finishes thinking.',                      stats: { dodgeChance: 0.12, critChance: 0.08 } },

  // ── amulet ──────────────────────────────────────────────────────────────────
  { name: 'Brass Ring',            equipSlot: 'amulet',   rarity: 'common',   description: 'A plain brass ring with a faint martial enchantment.',              stats: { damage: 2 } },
  { name: 'Ring of Vigor',         equipSlot: 'amulet',   rarity: 'uncommon', description: 'Pulses gently against the skin, lending vitality.',                 stats: { hp: 12, lifesteal: 3 } },
  { name: 'Amulet of the Swift',   equipSlot: 'amulet',   rarity: 'rare',     description: 'Cool jade carved into a serpent devouring its tail.',               stats: { attackSpeed: 0.2, dodgeChance: 0.06 } },
  { name: 'Eye of the Void',       equipSlot: 'amulet',   rarity: 'epic',     description: 'A gem that stares back — and teaches you to strike first.',         stats: { critChance: 0.15, lifesteal: 6, damage: 4 } },

  // ── ring1 ───────────────────────────────────────────────────────────────────
  { name: 'Copper Band',           equipSlot: 'ring1',    rarity: 'common',   description: 'A plain ring of cold copper.',                                       stats: { hp: 6 } },
  { name: 'Band of Fortitude',     equipSlot: 'ring1',    rarity: 'uncommon', description: 'Thick-set ring engraved with a shield rune.',                        stats: { hp: 10, damageReduction: 1 } },
  { name: 'Ring of the Predator',  equipSlot: 'ring1',    rarity: 'rare',     description: 'Set with a fang — your strikes feel predatory.',                     stats: { critChance: 0.12, damage: 3 } },
  { name: 'Ouroboros Ring',        equipSlot: 'ring1',    rarity: 'epic',     description: 'A serpent swallowing its tail — you take, and it gives back.',       stats: { lifesteal: 8, critChance: 0.08, attackSpeed: 0.1 } },

  // ── ring2 ───────────────────────────────────────────────────────────────────
  { name: 'Silver Ring',           equipSlot: 'ring2',    rarity: 'common',   description: 'Engraved with a small rune of warding.',                             stats: { hp: 6 } },
  { name: 'Iron Signet',           equipSlot: 'ring2',    rarity: 'uncommon', description: 'A military signet stamped with a crossed-swords crest.',             stats: { damage: 2, damageReduction: 1 } },
  { name: 'Serpent Ring',          equipSlot: 'ring2',    rarity: 'rare',     description: 'A coiled serpent whose fangs bite the wearer\'s foe.',               stats: { critChance: 0.10, damage: 4 } },
  { name: 'Void Ring',             equipSlot: 'ring2',    rarity: 'epic',     description: 'Stares back at you when you look into its gem.',                     stats: { lifesteal: 6, critChance: 0.10, damage: 5 } },

  // ── spell ───────────────────────────────────────────────────────────────────
  { name: 'Flame Scroll',          equipSlot: 'spell',    rarity: 'common',   description: 'A tattered scroll pulsing with heat.',           stats: { damage: 1 }, ability: { name: 'Fireball',         description: 'Deals 25 damage.',  cooldown: 12000, effectType: 'damageEnemy', value: 25 } },
  { name: 'Frost Tome',            equipSlot: 'spell',    rarity: 'rare',     description: 'Pages inscribed in permafrost runes.',           stats: { damage: 3 }, ability: { name: 'Ice Lance',         description: 'Deals 30 damage.',  cooldown: 10000, effectType: 'damageEnemy', value: 30 } },
  { name: 'Thunder Codex',         equipSlot: 'spell',    rarity: 'epic',     description: 'Lightning trapped between two pages.',           stats: { damage: 5 }, ability: { name: 'Lightning Strike',  description: 'Deals 50 damage.',  cooldown: 15000, effectType: 'damageEnemy', value: 50 } },
  { name: 'Arcane Grimoire',       equipSlot: 'spell',    rarity: 'uncommon', description: 'A scholar\'s notebook rewritten with power.',    stats: { hp: 5 },    ability: { name: 'Arcane Bolt',       description: 'Deals 20 damage.',  cooldown:  8000, effectType: 'damageEnemy', value: 20 } },

  // ── potions ─────────────────────────────────────────────────────────────────
  { name: 'Minor Health Potion',  equipSlot: 'potion', rarity: 'common',   description: 'Heals 30% of your Max HP instantly.',                 stats: {}, consumableEffect: { type: 'heal',         value: 0.3                      } },
  { name: 'Glacial Flask',        equipSlot: 'potion', rarity: 'uncommon', description: 'Freezes the enemy for 4 seconds.',                    stats: {}, consumableEffect: { type: 'freezeEnemy', durationMS: 4000                } },
  { name: "Berserker's Brew",     equipSlot: 'potion', rarity: 'rare',     description: '2× Attack Speed for 5s, but Damage Reduction = 0.',   stats: {}, consumableEffect: { type: 'berserk',     durationMS: 5000                } },
  { name: "Vampire's Draught",    equipSlot: 'potion', rarity: 'rare',     description: '+15 Lifesteal for the next 5 successful attacks.',     stats: {}, consumableEffect: { type: 'lifestealBuff', charges: 5, value: 15        } },
  { name: 'Midas Elixir',         equipSlot: 'potion', rarity: 'epic',     description: 'Next enemy death within 4s drops 3× Gold.',           stats: {}, consumableEffect: { type: 'midas',       durationMS: 4000                } },
]

// ─── Rarity weight helpers ────────────────────────────────────────────────────

function rarityWeights(floor: number): [number, number, number, number] {
  // [common, uncommon, rare, epic] — sums to 100
  if (floor <= 5)  return [65, 30,  5,  0]
  if (floor <= 12) return [20, 55, 20,  5]
  return                  [ 0, 20, 55, 25]
}

function rollRarity(floor: number): Rarity {
  const [w0, w1, w2] = rarityWeights(floor)
  const roll = Math.random() * 100
  if (roll < w0)           return 'common'
  if (roll < w0 + w1)      return 'uncommon'
  if (roll < w0 + w1 + w2) return 'rare'
  return 'epic'
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
