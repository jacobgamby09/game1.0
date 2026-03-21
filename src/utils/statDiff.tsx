import type { Item } from '../stores/useGameStore'

export function getStatDiff(offered: Item, equipped: Item | null) {
  return {
    hp:              (offered.stats.hp              ?? 0) - (equipped?.stats.hp              ?? 0),
    damage:          (offered.stats.damage          ?? 0) - (equipped?.stats.damage          ?? 0),
    attackSpeed:     (offered.stats.attackSpeed     ?? 0) - (equipped?.stats.attackSpeed     ?? 0),
    critChance:      (offered.stats.critChance      ?? 0) - (equipped?.stats.critChance      ?? 0),
    dodgeChance:     (offered.stats.dodgeChance     ?? 0) - (equipped?.stats.dodgeChance     ?? 0),
    lifesteal:       (offered.stats.lifesteal       ?? 0) - (equipped?.stats.lifesteal       ?? 0),
    damageReduction: (offered.stats.damageReduction ?? 0) - (equipped?.stats.damageReduction ?? 0),
  }
}

export function DiffBadge({ diff }: { diff: number }) {
  if (diff === 0) return null
  return (
    <span className={diff > 0 ? 'text-green-500' : 'text-red-500'}>
      {diff > 0 ? ` (+${diff})` : ` (${diff})`}
    </span>
  )
}

export function DiffBadgeF({ diff, decimals = 1 }: { diff: number; decimals?: number }) {
  if (diff === 0) return null
  return (
    <span className={diff > 0 ? 'text-green-500' : 'text-red-500'}>
      {diff > 0 ? ` (+${diff.toFixed(decimals)})` : ` (${diff.toFixed(decimals)})`}
    </span>
  )
}
