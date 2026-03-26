import { useState } from 'react'
import { Heart, Swords, Zap } from 'lucide-react'
import {
  useGameStore,
  TALENT_TREE,
  calculateTalentCost,
  calculateLevelFromXp,
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

// ─── XP cost helpers ──────────────────────────────────────────────────────────

function totalTalentXpSpent(talents: Record<string, number>): number {
  const k = Object.values(talents).reduce((a, b) => a + b, 0)
  return 100 * k + 25 * (k * (k - 1)) / 2
}

function upgradeCost(talents: Record<string, number>, costPerRank: number): number {
  const totalSpent = Object.values(talents).reduce((a, b) => a + b, 0)
  let cost = 0
  for (let i = 0; i < costPerRank; i++) cost += calculateTalentCost(totalSpent + i)
  return cost
}

// ─── CompactTalentNode ────────────────────────────────────────────────────────

interface CompactTalentNodeProps {
  node: TalentNode
  currentRank: number
  canAfford: boolean
  prereqMet: boolean
  isSelected: boolean
  onSelect: (id: string) => void
}

function CompactTalentNode({ node, currentRank, canAfford, prereqMet, isSelected, onSelect }: CompactTalentNodeProps) {
  const isMaxRank = currentRank >= node.maxRank
  const meta      = BRANCH_META[node.branch]
  const NodeIcon  = node.icon

  let borderClass = 'border-gray-800'
  let bgClass     = 'bg-gray-900'
  let iconColor   = meta.dimColor
  let nameColor   = 'text-gray-700'

  if (isMaxRank) {
    borderClass = 'border-amber-500/50'
    bgClass     = 'bg-amber-500/10'
    iconColor   = 'text-amber-400'
    nameColor   = 'text-amber-300/70'
  } else if (!prereqMet) {
    borderClass = 'border-gray-800'
    bgClass     = 'bg-gray-900/50'
    iconColor   = 'text-gray-600'
    nameColor   = 'text-gray-500'
  } else if (canAfford) {
    borderClass = 'border-gray-600'
    bgClass     = 'bg-gray-800'
    iconColor   = meta.color
    nameColor   = 'text-gray-300'
  } else {
    borderClass = 'border-gray-700'
    bgClass     = 'bg-gray-800/60'
    iconColor   = 'text-gray-600'
    nameColor   = 'text-gray-600'
  }

  return (
    <button
      onClick={() => onSelect(node.id)}
      className={`w-full aspect-square rounded-lg border flex flex-col items-center justify-between py-3 px-1 transition-all duration-150 cursor-pointer
        ${borderClass} ${bgClass}
        ${!prereqMet ? 'opacity-65' : 'hover:brightness-110'}
        ${isSelected ? 'ring-2 ring-white/30' : ''}`}
    >
      <NodeIcon size={32} className={iconColor} />
      <p className={`text-[11px] font-bold text-center leading-tight w-full truncate px-0.5 ${nameColor}`}>
        {node.name}
      </p>
      <span className={`text-[10px] tabular-nums font-bold ${isMaxRank ? 'text-amber-400' : 'text-gray-600'}`}>
        {currentRank}/{node.maxRank}
      </span>
    </button>
  )
}

// ─── BranchColumn ─────────────────────────────────────────────────────────────

interface BranchColumnProps {
  branch: TalentBranch
  talents: Record<string, number>
  playerXp: number
  selectedNodeId: string | null
  onSelect: (id: string) => void
}

function BranchColumn({ branch, talents, playerXp, selectedNodeId, onSelect }: BranchColumnProps) {
  const nodes    = TALENT_TREE.filter(n => n.branch === branch).sort((a, b) => a.tier - b.tier)
  const meta     = BRANCH_META[branch]
  const Icon     = meta.Icon
  const xpSpent  = totalTalentXpSpent(talents)

  return (
    <div className="flex flex-col items-stretch gap-0">
      <div className={`flex items-center justify-center gap-1.5 mb-2 ${meta.color}`}>
        <Icon size={12} />
        <span className="text-[10px] font-bold uppercase tracking-widest">{meta.label}</span>
      </div>
      {nodes.map((node, i) => {
        const prereqNode = TALENT_TREE.find(n => n.branch === branch && n.tier === node.tier - 1)
        const prereqMet  = !prereqNode || (talents[prereqNode.id] ?? 0) >= prereqNode.maxRank
        const cost       = upgradeCost(talents, node.costPerRank)
        const canAfford  = prereqMet && playerXp >= xpSpent + cost
        return (
          <div key={node.id} className="flex flex-col items-center">
            <CompactTalentNode
              node={node}
              currentRank={talents[node.id] ?? 0}
              canAfford={canAfford}
              prereqMet={prereqMet}
              isSelected={selectedNodeId === node.id}
              onSelect={onSelect}
            />
            {i < nodes.length - 1 && <div className="w-px h-3 bg-gray-800" />}
          </div>
        )
      })}
    </div>
  )
}

// ─── TalentTreeView ───────────────────────────────────────────────────────────

export default function TalentTreeView() {
  const { playerXp, talents, upgradeTalent } = useGameStore()

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)

  const { level, currentXp, nextLevelXp } = calculateLevelFromXp(playerXp)
  const totalSpent    = Object.values(talents).reduce((a, b) => a + b, 0)
  const unspentPoints = level - totalSpent

  return (
    <div className="flex flex-col h-full w-full max-w-lg">

      {/* Header */}
      <div className="shrink-0 w-full bg-gray-800 border-b border-gray-700 px-4 pt-3 pb-2 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Talents</p>
          {unspentPoints > 0 && (
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-lg border-2 border-amber-500/50 bg-amber-900/20 flex items-center justify-center">
                <span className="text-2xl font-bold text-amber-300">{unspentPoints}</span>
              </div>
              <span className="text-[9px] font-bold uppercase tracking-widest text-amber-500/70 mt-0.5">Unspent</span>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-gray-300">Talent Level {level}</p>
            <p className="text-[10px] text-gray-500">{currentXp} / {nextLevelXp} XP</p>
          </div>
          <div className="w-full h-3 rounded-full bg-gray-950 overflow-hidden">
            <div
              className="h-full rounded-full bg-blue-600 transition-all duration-300"
              style={{ width: `${Math.min(100, (currentXp / nextLevelXp) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 min-h-0 overflow-y-auto bg-gray-900 px-4 py-4 flex flex-col gap-3">

        {/* Compact 3-column tree */}
        <div className="grid grid-cols-3 gap-2">
          {(['vitality', 'might', 'celerity'] as TalentBranch[]).map(branch => (
            <BranchColumn
              key={branch}
              branch={branch}
              talents={talents}
              playerXp={playerXp}
              selectedNodeId={selectedNodeId}
              onSelect={setSelectedNodeId}
            />
          ))}
        </div>

        {/* Inspect panel */}
        {(() => {
          const selectedNode = selectedNodeId ? TALENT_TREE.find(n => n.id === selectedNodeId) ?? null : null
          if (!selectedNode) return (
            <div className="rounded-xl border border-gray-800 bg-gray-800/40 p-4 flex items-center justify-center min-h-[80px]">
              <p className="text-[11px] text-gray-600">Select a talent to view details.</p>
            </div>
          )
          const branch      = BRANCH_META[selectedNode.branch]
          const NodeIcon    = selectedNode.icon
          const currentRank = talents[selectedNode.id] ?? 0
          const isMaxRank   = currentRank >= selectedNode.maxRank
          const prereqNode  = TALENT_TREE.find(n => n.branch === selectedNode.branch && n.tier === selectedNode.tier - 1)
          const prereqMet   = !prereqNode || (talents[prereqNode.id] ?? 0) >= prereqNode.maxRank
          const canAfford  = unspentPoints >= selectedNode.costPerRank
          const canUpgrade = !isMaxRank && prereqMet && canAfford
          return (
            <div className="rounded-xl border border-gray-700 bg-gray-800/60 p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <NodeIcon size={16} className={branch.color} />
                <p className="text-sm font-bold text-gray-200">{selectedNode.name}</p>
                <span className={`ml-auto text-[10px] font-bold uppercase tracking-widest ${branch.color}`}>
                  {branch.label}
                </span>
              </div>
              <p className={`text-xs leading-relaxed ${STAT_COLOR[selectedNode.effect.stat] ?? 'text-gray-400'}`}>
                {selectedNode.description}
              </p>
              <div className="flex items-center justify-between text-[11px] text-gray-500">
                <span>Rank <span className="text-gray-300 font-bold">{currentRank} / {selectedNode.maxRank}</span></span>
                {isMaxRank
                  ? <span className="text-amber-400 font-bold">MAX RANK</span>
                  : <span>Cost: <span className={canAfford ? 'text-amber-300 font-bold' : 'text-red-500 font-bold'}>{selectedNode.costPerRank} {selectedNode.costPerRank === 1 ? 'point' : 'points'}</span></span>
                }
              </div>
              {!isMaxRank && (
                <button
                  onClick={() => upgradeTalent(selectedNode.id)}
                  disabled={!canUpgrade}
                  className={`w-full py-2 rounded-lg border text-xs font-bold uppercase tracking-wider transition-colors
                    ${canUpgrade
                      ? 'border-amber-500 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 cursor-pointer'
                      : 'border-gray-700 bg-gray-800 text-gray-600 cursor-default'
                    }`}
                >
                  {!prereqMet ? 'Locked' : !canAfford ? 'Not Enough XP' : 'Upgrade'}
                </button>
              )}
            </div>
          )
        })()}

        <p className="text-[9px] text-gray-700 text-center mt-1">
          Earn XP by defeating monsters · Talents reset each run
        </p>
      </div>

    </div>
  )
}
