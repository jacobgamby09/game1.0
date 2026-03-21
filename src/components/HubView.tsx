import { Heart, Swords, Zap } from 'lucide-react'
import {
  useGameStore,
  TALENT_TREE,
  computeAvailablePoints,
  type TalentNode,
  type TalentBranch,
} from '../stores/useGameStore'

// ─── Branch metadata ──────────────────────────────────────────────────────────

const BRANCH_META: Record<TalentBranch, { label: string; Icon: React.ElementType; color: string; dimColor: string }> = {
  vitality: { label: 'Vitality', Icon: Heart,  color: 'text-green-400', dimColor: 'text-green-900'  },
  might:    { label: 'Might',    Icon: Swords, color: 'text-red-400',   dimColor: 'text-red-900'    },
  celerity: { label: 'Celerity', Icon: Zap,    color: 'text-blue-400',  dimColor: 'text-blue-900'   },
}

// ─── Stat color map ───────────────────────────────────────────────────────────

const STAT_COLOR: Record<string, string> = {
  hp:                   'text-green-400',
  damage:               'text-red-400',
  attackSpeed:          'text-blue-400',
  damageReduction:      'text-orange-400',
  critChance:           'text-yellow-400',
  dodgeChance:          'text-cyan-400',
  lifesteal:            'text-emerald-400',
  postCombatHealPct:    'text-green-300',
  eliteBonusMultiplier: 'text-red-300',
  executionThreshold:   'text-purple-400',
  undying:              'text-amber-300',
  frenzy:               'text-orange-400',
}

// ─── TalentCard ───────────────────────────────────────────────────────────────

interface TalentCardProps {
  node: TalentNode
  currentRank: number
  availablePoints: number
  prereqMet: boolean
  onUpgrade: () => void
}

function TalentCard({ node, currentRank, availablePoints, prereqMet, onUpgrade }: TalentCardProps) {
  const isMaxRank    = currentRank >= node.maxRank
  const canAfford    = availablePoints >= node.costPerRank
  const canUpgrade   = !isMaxRank && prereqMet && canAfford
  const meta         = BRANCH_META[node.branch]

  // Visual state
  let borderClass = 'border-gray-800'
  let bgClass     = 'bg-gray-900'
  let nameClass   = 'text-gray-600'
  let iconColor   = meta.dimColor

  if (isMaxRank) {
    borderClass = 'border-amber-500/50'
    bgClass     = 'bg-amber-500/10'
    nameClass   = 'text-amber-300'
    iconColor   = 'text-amber-400'
  } else if (!prereqMet) {
    borderClass = 'border-gray-800'
    bgClass     = 'bg-gray-900/50'
    nameClass   = 'text-gray-700'
    iconColor   = 'text-gray-800'
  } else if (canUpgrade) {
    borderClass = `border-gray-600 hover:${meta.color.replace('text-', 'border-')}`
    bgClass     = 'bg-gray-800 hover:bg-gray-750'
    nameClass   = 'text-gray-300'
    iconColor   = meta.color
  } else {
    // prereq met but can't afford
    borderClass = 'border-gray-700'
    bgClass     = 'bg-gray-800/60'
    nameClass   = 'text-gray-500'
    iconColor   = 'text-gray-600'
  }

  const Icon = BRANCH_META[node.branch].Icon

  return (
    <button
      onClick={canUpgrade ? onUpgrade : undefined}
      disabled={!canUpgrade}
      title={node.description}
      className={`w-full rounded-lg border p-1.5 sm:p-2.5 flex flex-col items-center gap-1 sm:gap-1.5 transition-all duration-150
        ${borderClass} ${bgClass} ${canUpgrade ? 'cursor-pointer' : 'cursor-default'}`}
    >
      <Icon size={14} className={iconColor} />
      <p className={`text-[9px] sm:text-[11px] font-bold text-center leading-tight ${nameClass}`}>{node.name}</p>
      <p className={`text-[7px] sm:text-[8px] text-center leading-tight ${
        isMaxRank ? 'text-amber-400/70' : (STAT_COLOR[node.effect.stat] ?? 'text-gray-500')
      }`}>
        {node.description}
      </p>

      {/* Point investment */}
      <div className={`text-[8px] sm:text-[9px] font-bold tabular-nums ${
        isMaxRank ? 'text-amber-400' : canUpgrade ? meta.color : 'text-gray-600'
      }`}>
        {currentRank} / {node.maxRank}
        {!isMaxRank && (
          <span className="text-gray-600 font-normal"> · {node.costPerRank}pt</span>
        )}
      </div>
    </button>
  )
}

// ─── BranchColumn ─────────────────────────────────────────────────────────────

interface BranchColumnProps {
  branch: TalentBranch
  talents: Record<string, number>
  availablePoints: number
  upgradeTalent: (id: string) => void
}

function BranchColumn({ branch, talents, availablePoints, upgradeTalent }: BranchColumnProps) {
  const nodes = TALENT_TREE.filter(n => n.branch === branch).sort((a, b) => a.tier - b.tier)
  const meta  = BRANCH_META[branch]
  const Icon  = meta.Icon

  return (
    <div className="flex flex-col items-stretch gap-0">
      {/* Branch header */}
      <div className={`flex items-center justify-center gap-1.5 mb-3 ${meta.color}`}>
        <Icon size={14} />
        <span className="text-xs font-bold uppercase tracking-widest">{meta.label}</span>
      </div>

      {nodes.map((node, i) => {
        const prereqNode = TALENT_TREE.find(n => n.branch === branch && n.tier === node.tier - 1)
        const prereqMet  = !prereqNode || (talents[prereqNode.id] ?? 0) >= 1

        return (
          <div key={node.id} className="flex flex-col items-center">
            <TalentCard
              node={node}
              currentRank={talents[node.id] ?? 0}
              availablePoints={availablePoints}
              prereqMet={prereqMet}
              onUpgrade={() => upgradeTalent(node.id)}
            />
            {i < nodes.length - 1 && (
              <div className="w-px h-4 bg-gray-800" />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── HubView ──────────────────────────────────────────────────────────────────

export default function HubView() {
  const { totalXp, talents, upgradeTalent, generateMap, hardResetGame } = useGameStore()
  const availablePoints = computeAvailablePoints(totalXp, talents)

  return (
    <div className="flex flex-col h-full gap-3 sm:gap-4 p-3 sm:p-5 max-w-lg mx-auto w-full">

      {/* Header */}
      <div className="relative text-center shrink-0">
        <p className="text-[10px] text-amber-400/40 uppercase tracking-widest mb-0.5">Base Camp</p>
        <h1 className="text-3xl font-bold tracking-widest uppercase text-white">The HUB</h1>
        <button
          onClick={() => {
            if (window.confirm('WARNING: This will permanently delete your save file, including all XP and Talents. Are you sure?')) {
              hardResetGame()
            }
          }}
          title="Wipe Save (Hard Reset)"
          className="absolute top-0 right-0 text-[10px] text-red-900 hover:text-red-500 uppercase tracking-widest transition-colors"
        >
          Wipe Save
        </button>
      </div>

      {/* XP + Points bar */}
      <div className="w-full shrink-0 bg-gray-900 border border-gray-700 rounded-xl px-4 sm:px-5 py-3 flex items-center justify-center gap-4 sm:gap-5">
        <div className="text-center">
          <p className="text-[10px] text-amber-400/50 uppercase tracking-widest">Total XP</p>
          <p className="text-amber-300 text-lg font-bold">{totalXp}</p>
        </div>
        <div className="w-px h-8 bg-gray-700" />
        <div className="text-center">
          <p className="text-[10px] text-amber-400/50 uppercase tracking-widest">Available</p>
          <p className={`text-lg font-bold ${availablePoints > 0 ? 'text-amber-300' : 'text-gray-600'}`}>
            {availablePoints} <span className="text-xs font-normal text-amber-400/40">pts</span>
          </p>
        </div>
        <div className="w-px h-8 bg-gray-700" />
        <div className="text-center">
          <p className="text-[10px] text-amber-400/50 uppercase tracking-widest">Next Point</p>
          <p className="text-gray-400 text-sm font-semibold">
            {100 - (totalXp % 100)} XP
          </p>
        </div>
      </div>

      {/* 3-column talent tree */}
      <div className="flex-1 min-h-0 overflow-y-auto w-full bg-gray-900 border border-gray-700 rounded-xl p-3 sm:p-4">
        <p className="text-[10px] text-gray-600 font-semibold uppercase tracking-widest text-center mb-4">
          Talent Tree
        </p>
        <div className="grid grid-cols-3 gap-1.5 sm:gap-3">
          {(['vitality', 'might', 'celerity'] as TalentBranch[]).map(branch => (
            <BranchColumn
              key={branch}
              branch={branch}
              talents={talents}
              availablePoints={availablePoints}
              upgradeTalent={upgradeTalent}
            />
          ))}
        </div>
        <p className="text-[9px] text-gray-700 text-center mt-4">
          Earn 1 point per 100 XP · Talents persist between runs
        </p>
      </div>

      {/* Embark */}
      <button
        onClick={generateMap}
        className="w-full shrink-0 py-4 rounded-xl border-2 border-amber-500 bg-amber-500/10
                   text-amber-300 text-base font-bold uppercase tracking-widest
                   hover:bg-amber-500/20 active:bg-amber-500/30 transition-colors"
      >
        ⚔ Embark on Run
      </button>

    </div>
  )
}
