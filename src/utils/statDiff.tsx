import type { Item } from '../stores/useGameStore'

export function getStatDiff(offered: Item, equipped: Item | null) {
  return {
    hp:          (offered.stats.hp          ?? 0) - (equipped?.stats.hp          ?? 0),
    damage:      (offered.stats.damage      ?? 0) - (equipped?.stats.damage      ?? 0),
    attackSpeed: (offered.stats.attackSpeed ?? 0) - (equipped?.stats.attackSpeed ?? 0),
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
