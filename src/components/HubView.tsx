import { useState } from 'react'
import { Heart, Swords, Zap, Dumbbell, Skull } from 'lucide-react'
import {
  useGameStore,
  TALENT_TREE,
  computeAvailablePoints,
  computePlayerLevel,
  type TalentNode,
  type TalentBranch,
} from '../stores/useGameStore'

// ─── Feature definitions ──────────────────────────────────────────────────────

type Feature = 'arena' | 'talents' | 'reset'

const FEATURES: Record<Feature, { title: string; Icon: React.ElementType; desc: string; color: string }> = {
  arena: {
    title: 'Battle Arena',
    Icon: Swords,
    desc: 'Enter the dungeon to fight monsters, gather gold, and earn XP. Each run is procedurally generated.',
    color: 'text-amber-400',
  },
  talents: {
    title: 'Training Grounds',
    Icon: Dumbbell,
    desc: 'Spend your hard-earned XP to unlock permanent passive upgrades that persist between runs.',
    color: 'text-blue-400',
  },
  reset: {
    title: 'Oblivion',
    Icon: Skull,
    desc: 'Hard reset all progress, permanently deleting your save data including all XP and talents.',
    color: 'text-red-400',
  },
}

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

// ─── CompactTalentNode ────────────────────────────────────────────────────────

interface CompactTalentNodeProps {
  node: TalentNode
  currentRank: number
  availablePoints: number
  prereqMet: boolean
  isSelected: boolean
  onSelect: (id: string) => void
}

function CompactTalentNode({ node, currentRank, availablePoints, prereqMet, isSelected, onSelect }: CompactTalentNodeProps) {
  const isMaxRank  = currentRank >= node.maxRank
  const canAfford  = availablePoints >= node.costPerRank
  const meta       = BRANCH_META[node.branch]
  const NodeIcon   = node.icon

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
  availablePoints: number
  selectedNodeId: string | null
  onSelect: (id: string) => void
}

function BranchColumn({ branch, talents, availablePoints, selectedNodeId, onSelect }: BranchColumnProps) {
  const nodes = TALENT_TREE.filter(n => n.branch === branch).sort((a, b) => a.tier - b.tier)
  const meta  = BRANCH_META[branch]
  const Icon  = meta.Icon

  return (
    <div className="flex flex-col items-stretch gap-0">
      <div className={`flex items-center justify-center gap-1.5 mb-2 ${meta.color}`}>
        <Icon size={12} />
        <span className="text-[10px] font-bold uppercase tracking-widest">{meta.label}</span>
      </div>
      {nodes.map((node, i) => {
        const prereqNode = TALENT_TREE.find(n => n.branch === branch && n.tier === node.tier - 1)
        const prereqMet  = !prereqNode || (talents[prereqNode.id] ?? 0) >= prereqNode.maxRank
        return (
          <div key={node.id} className="flex flex-col items-center">
            <CompactTalentNode
              node={node}
              currentRank={talents[node.id] ?? 0}
              availablePoints={availablePoints}
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

// ─── HubView ──────────────────────────────────────────────────────────────────

export default function HubView() {
  const { totalXp, talents, upgradeTalent, generateMap, hardResetGame } = useGameStore()
  const availablePoints = computeAvailablePoints(totalXp, talents)
  const playerLevel     = computePlayerLevel(totalXp)

  const [selectedFeature, setSelectedFeature] = useState<Feature>('arena')
  const [selectedNodeId,  setSelectedNodeId]  = useState<string | null>(null)

  return (
    <div className="flex flex-col h-full max-w-lg mx-auto w-full">

      {/* Header */}
      <div className="text-center shrink-0 pt-4 pb-2 px-4">
        <p className="text-[10px] text-amber-400/40 uppercase tracking-widest mb-0.5">Base Camp</p>
        <h1 className="text-2xl font-bold tracking-widest uppercase text-white">The HUB</h1>
        <p className="text-sm text-amber-400/50 font-semibold tracking-wide mt-0.5">Level {playerLevel} · Fighter</p>
      </div>

      {/* Tile grid */}
      <div className="grid grid-cols-3 gap-3 px-4 pb-3 shrink-0">
        {(Object.entries(FEATURES) as [Feature, typeof FEATURES[Feature]][]).map(([key, feat]) => {
          const isSelected = selectedFeature === key
          return (
            <button
              key={key}
              onClick={() => setSelectedFeature(key)}
              className={`aspect-square rounded-xl border flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-150
                ${isSelected
                  ? 'ring-2 ring-amber-500 border-amber-500/40 bg-gray-800'
                  : 'border-gray-700 bg-gray-900/50 hover:bg-gray-800/60 hover:border-gray-600'
                }`}
            >
              <feat.Icon size={22} className={isSelected ? feat.color : 'text-gray-600'} />
              <span className={`text-[10px] font-bold uppercase tracking-wider text-center leading-tight px-1
                ${isSelected ? 'text-gray-300' : 'text-gray-600'}`}>
                {feat.title}
              </span>
            </button>
          )
        })}
      </div>

      {/* Info panel */}
      <div className="flex-1 min-h-0 overflow-y-auto bg-gray-900 border-t border-gray-800 rounded-t-2xl px-5 py-5 flex flex-col">

        {/* ── Arena ── */}
        {selectedFeature === 'arena' && (
          <div className="flex flex-col gap-4 flex-1">
            <div>
              <p className="text-xl font-bold text-amber-300">Battle Arena</p>
              <p className="text-sm text-gray-400 mt-1 leading-relaxed">{FEATURES.arena.desc}</p>
            </div>
            <button
              onClick={generateMap}
              className="mt-auto w-full py-4 rounded-xl border-2 border-amber-500 bg-amber-500/10
                         text-amber-300 text-base font-bold uppercase tracking-widest
                         hover:bg-amber-500/20 active:bg-amber-500/30 transition-colors"
            >
              ⚔ Enter Dungeon
            </button>
          </div>
        )}

        {/* ── Talents ── */}
        {selectedFeature === 'talents' && (
          <div className="flex flex-col gap-3 flex-1">
            {/* XP / points bar */}
            <div className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 flex items-center justify-center gap-4 sm:gap-5 shrink-0">
              <div className="text-center">
                <p className="text-[10px] text-amber-400/50 uppercase tracking-widest">Level</p>
                <p className="text-amber-300 text-lg font-bold">{playerLevel}</p>
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
                <p className="text-gray-400 text-sm font-semibold">{100 - (totalXp % 100)} XP</p>
              </div>
            </div>

            {/* Compact 3-column tree */}
            <div className="grid grid-cols-3 gap-2">
              {(['vitality', 'might', 'celerity'] as TalentBranch[]).map(branch => (
                <BranchColumn
                  key={branch}
                  branch={branch}
                  talents={talents}
                  availablePoints={availablePoints}
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
              const canAfford   = availablePoints >= selectedNode.costPerRank
              const canUpgrade  = !isMaxRank && prereqMet && canAfford
              return (
                <div className="rounded-xl border border-gray-700 bg-gray-800/60 p-4 flex flex-col gap-3">
                  {/* Name row */}
                  <div className="flex items-center gap-2">
                    <NodeIcon size={16} className={branch.color} />
                    <p className="text-sm font-bold text-gray-200">{selectedNode.name}</p>
                    <span className={`ml-auto text-[10px] font-bold uppercase tracking-widest ${branch.color}`}>
                      {branch.label}
                    </span>
                  </div>
                  {/* Description */}
                  <p className={`text-xs leading-relaxed ${STAT_COLOR[selectedNode.effect.stat] ?? 'text-gray-400'}`}>
                    {selectedNode.description}
                  </p>
                  {/* Rank + cost row */}
                  <div className="flex items-center justify-between text-[11px] text-gray-500">
                    <span>Rank <span className="text-gray-300 font-bold">{currentRank} / {selectedNode.maxRank}</span></span>
                    {isMaxRank
                      ? <span className="text-amber-400 font-bold">MAX RANK</span>
                      : <span>Cost: <span className={canAfford ? 'text-amber-300 font-bold' : 'text-red-500 font-bold'}>{selectedNode.costPerRank} pts</span></span>
                    }
                  </div>
                  {/* Upgrade button */}
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
                      {!prereqMet ? 'Locked' : !canAfford ? 'Not Enough Points' : 'Upgrade'}
                    </button>
                  )}
                </div>
              )
            })()}

            <p className="text-[9px] text-gray-700 text-center mt-1">
              Earn 1 point per 100 XP · Talents persist between runs
            </p>
          </div>
        )}

        {/* ── Reset ── */}
        {selectedFeature === 'reset' && (
          <div className="flex flex-col gap-4 flex-1">
            <div>
              <p className="text-xl font-bold text-red-400">Oblivion</p>
              <p className="text-sm text-gray-400 mt-1 leading-relaxed">{FEATURES.reset.desc}</p>
            </div>
            <div className="text-xs text-red-900 border border-red-900/30 rounded-lg p-3 bg-red-900/10 leading-relaxed">
              ⚠ This action is permanent and cannot be undone. All XP, talent points, and run history will be lost.
            </div>
            <button
              onClick={() => {
                if (window.confirm('WARNING: This will permanently delete your save file, including all XP and Talents. Are you sure?')) {
                  hardResetGame()
                }
              }}
              className="mt-auto w-full py-4 rounded-xl border-2 border-red-800 bg-red-900/10
                         text-red-400 text-base font-bold uppercase tracking-widest
                         hover:bg-red-900/20 active:bg-red-900/30 transition-colors"
            >
              Wipe Save
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
