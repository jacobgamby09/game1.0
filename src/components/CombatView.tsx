import { useEffect } from 'react'
import { Swords, Shield, Plus, Skull, Tent, Archive, Flame, Crown, Shirt, Layers, Gem, Circle, Zap, Heart } from 'lucide-react'
import { useGameStore, getEffectiveStats, RARITY_COLORS } from '../stores/useGameStore'
import type { Player, Mob, MapNode, Item, EquipSlot } from '../stores/useGameStore'

// ─── Slot icon maps (shared by LootCard) ──────────────────────────────────────

const SLOT_ICONS: Record<EquipSlot, React.ElementType> = {
  head: Crown, chest: Shirt, legs: Layers,
  mainHand: Swords, offHand: Shield,
  amulet: Gem, ring1: Circle, ring2: Circle, spell: Zap,
}

const SLOT_LABELS: Record<EquipSlot, string> = {
  head: 'Head', chest: 'Chest', legs: 'Legs',
  mainHand: 'Main Hand', offHand: 'Off Hand',
  amulet: 'Amulet', ring1: 'Ring 1', ring2: 'Ring 2', spell: 'Spell',
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CONTAINER_W = 320
const FLOOR_H = 60
const NODE_R = 24 // radius of node circle

function nodeX(nodesOnFloor: number, index: number): number {
  return (CONTAINER_W / (nodesOnFloor + 1)) * (index + 1)
}

function nodeY(floor: number): number {
  return (11 - floor) * FLOOR_H + FLOOR_H / 2
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hpColor(pct: number): string {
  if (pct > 50) return 'bg-green-500'
  if (pct > 25) return 'bg-yellow-500'
  return 'bg-red-500'
}

function NodeIcon({ type, size = 16 }: { type: MapNode['type']; size?: number }) {
  if (type === 'mob')   return <Swords size={size} />
  if (type === 'elite') return <Skull size={size} />
  if (type === 'boss')  return <Skull size={size} />
  if (type === 'rest')  return <Tent size={size} />
  if (type === 'chest') return <Archive size={size} />
  return null
}

// ─── PlayerStatsBar ───────────────────────────────────────────────────────────

function PlayerStatsBar() {
  const { player, equipment, playerXp, talents } = useGameStore()
  const eff = getEffectiveStats(player, equipment, talents)
  return (
    <div className="w-full max-w-sm bg-gray-900/80 border border-gray-800 rounded-xl px-4 py-2 flex items-center gap-5 text-xs font-semibold">
      <div className="flex items-center gap-1.5 text-green-400">
        <Heart size={13} />
        <span>{player.currentHp} / {eff.maxHp}</span>
      </div>
      <div className="flex items-center gap-1.5 text-red-400">
        <Swords size={13} />
        <span>{eff.damage} dmg</span>
      </div>
      <div className="flex items-center gap-1.5 text-blue-400">
        <Zap size={13} />
        <span>{eff.attackSpeed.toFixed(2)}/s</span>
      </div>
      <div className="ml-auto text-amber-400">⭐ {playerXp} XP</div>
    </div>
  )
}

// ─── MapView ──────────────────────────────────────────────────────────────────

function MapView() {
  const { act1Map, currentFloor, currentMapNodeId, playerXp, chooseNode } = useGameStore()

  const allNodes = act1Map.flat()
  const prevNode = allNodes.find((n) => n.id === currentMapNodeId) ?? null
  const totalH = 11 * FLOOR_H

  // A node is selectable if it's on the current floor and connected from the prev node
  function isAvailable(node: MapNode): boolean {
    if (node.floor !== currentFloor) return false
    if (node.isCompleted) return false
    if (currentMapNodeId === null) return true // floor 1: all open
    return prevNode?.connectedTo.includes(node.id) ?? false
  }

  // Edge color for SVG lines
  function edgeColor(fromNode: MapNode): string {
    if (fromNode.isCompleted) return '#6b7280' // gray-500 past path
    if (fromNode.id === currentMapNodeId) return '#f59e0b' // amber-400 active path
    return '#374151' // gray-700 locked
  }

  const actComplete = currentFloor > 11

  return (
    <div className="flex flex-col items-center w-full min-h-full p-4 gap-4">
      {/* Player stats HUD */}
      <PlayerStatsBar />

      {/* Header */}
      <div className="flex items-center justify-between w-full max-w-sm">
        <div className="flex items-center gap-2">
          <Swords className="text-amber-400" size={20} />
          <h1 className="text-lg font-bold tracking-widest uppercase text-white">
            Act 1: The Ascent
          </h1>
        </div>
        <div className="flex items-center gap-3 text-xs font-semibold text-gray-400">
          <span className="text-amber-400">⭐ {playerXp} XP</span>
          <span>Floor {Math.min(currentFloor, 11)} / 11</span>
        </div>
      </div>

      {actComplete && (
        <p className="text-amber-400 text-xl font-bold tracking-widest uppercase animate-pulse">
          ✨ Act 1 Complete!
        </p>
      )}

      {/* Map container */}
      <div
        className="relative bg-gray-950 border border-gray-800 rounded-xl overflow-hidden"
        style={{ width: CONTAINER_W, height: totalH }}
      >
        {/* SVG connection lines */}
        <svg
          className="absolute inset-0 pointer-events-none"
          width={CONTAINER_W}
          height={totalH}
        >
          {act1Map.map((floorNodes) =>
            floorNodes.map((node) =>
              node.connectedTo.map((toId) => {
                const toNode = allNodes.find((n) => n.id === toId)
                if (!toNode) return null
                const x1 = nodeX(floorNodes.length, floorNodes.indexOf(node))
                const y1 = nodeY(node.floor)
                const toFloor = act1Map[toNode.floor - 1]
                const x2 = nodeX(toFloor.length, toFloor.indexOf(toNode))
                const y2 = nodeY(toNode.floor)
                const color = edgeColor(node)
                return (
                  <line
                    key={`${node.id}-${toId}`}
                    x1={x1} y1={y1}
                    x2={x2} y2={y2}
                    stroke={color}
                    strokeWidth={node.id === currentMapNodeId ? 2 : 1.5}
                    strokeDasharray={node.isCompleted ? '4 3' : undefined}
                    opacity={node.isCompleted ? 0.5 : 0.8}
                  />
                )
              })
            )
          )}
        </svg>

        {/* Node buttons */}
        {act1Map.map((floorNodes) =>
          floorNodes.map((node, idx) => {
            const cx = nodeX(floorNodes.length, idx)
            const cy = nodeY(node.floor)
            const available = isAvailable(node)
            const isCurrent = node.id === currentMapNodeId
            const isBoss = node.type === 'boss'

            let btnClass = 'absolute flex items-center justify-center rounded-full border-2 transition-all duration-200 '
            if (node.isCompleted || isCurrent) {
              btnClass += 'bg-gray-800 border-gray-600 text-gray-400 opacity-50 cursor-default'
            } else if (available) {
              btnClass += isBoss
                ? 'bg-red-900/40 border-red-500 text-red-300 ring-2 ring-red-400/40 hover:bg-red-500/30 cursor-pointer scale-110'
                : 'bg-amber-500/20 border-amber-400 text-amber-300 ring-2 ring-amber-400/40 hover:bg-amber-500/30 cursor-pointer scale-110'
            } else if (node.floor < currentFloor) {
              btnClass += 'bg-gray-800 border-gray-700 text-gray-400 opacity-50 cursor-default'
            } else {
              btnClass += 'bg-gray-800 border-gray-600 text-gray-300 opacity-70 cursor-default'
            }

            return (
              <button
                key={node.id}
                disabled={!available}
                onClick={() => chooseNode(node.id)}
                title={node.type.charAt(0).toUpperCase() + node.type.slice(1)}
                className={btnClass}
                style={{
                  width: NODE_R * 2,
                  height: NODE_R * 2,
                  left: cx - NODE_R,
                  top: cy - NODE_R,
                }}
              >
                <NodeIcon type={node.type} size={18} />
              </button>
            )
          })
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-3 text-xs text-gray-500 max-w-sm">
        {([['mob','Mob'],['elite','Elite'],['boss','Boss'],['rest','Rest'],['chest','Chest']] as const).map(([type, label]) => (
          <span key={type} className="flex items-center gap-1">
            <NodeIcon type={type} size={12} />
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── CombatantPanel ───────────────────────────────────────────────────────────

interface PanelProps {
  combatant: Player | Mob
  attackProgress: number
  atkBarColor: 'amber' | 'orange'
  icon: React.ReactNode
}

function CombatantPanel({ combatant, attackProgress, atkBarColor, icon }: PanelProps) {
  const hpPct = Math.max(0, (combatant.currentHp / combatant.maxHp) * 100)
  const atkPct = Math.min(100, attackProgress)
  const atkFill = atkBarColor === 'amber' ? 'bg-amber-400' : 'bg-orange-500'

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-5 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <span className="text-amber-400">{icon}</span>
        <h2 className="text-lg font-bold tracking-widest uppercase text-white">
          {combatant.name}
        </h2>
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex justify-between text-xs text-gray-400 font-semibold uppercase tracking-wider">
          <span>HP</span>
          <span>{combatant.currentHp} / {combatant.maxHp}</span>
        </div>
        <div className="bg-gray-700 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-150 ${hpColor(hpPct)}`}
            style={{ width: `${hpPct}%` }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex justify-between text-xs text-gray-400 font-semibold uppercase tracking-wider">
          <span>Attack</span>
          <span>{Math.floor(atkPct)}%</span>
        </div>
        <div className="bg-gray-700 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-100 ${atkFill}`}
            style={{ width: `${atkPct}%` }}
          />
        </div>
      </div>

      <p className="text-xs text-gray-500 tracking-wide">
        {combatant.baseDamage} dmg &nbsp;·&nbsp; {combatant.attackSpeed}/s
      </p>
    </div>
  )
}

// ─── ActiveSkills ─────────────────────────────────────────────────────────────

interface ActiveSkillsProps {
  shieldBashCooldown: number
  onShieldBash: () => void
  isCombatActive: boolean
  spellItem: Item | null
  equippedSpellCooldown: number
  onUseSpell: () => void
}

function ActiveSkills({ shieldBashCooldown, onShieldBash, isCombatActive, spellItem, equippedSpellCooldown, onUseSpell }: ActiveSkillsProps) {
  const bashReady = shieldBashCooldown <= 0
  const bashDisabled = !isCombatActive || !bashReady

  const spellReady = equippedSpellCooldown <= 0
  const spellDisabled = !isCombatActive || !spellReady

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 flex flex-col gap-3">
      <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest">
        Active Skills
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={onShieldBash}
          disabled={bashDisabled}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors
            ${bashReady && isCombatActive
              ? 'border border-amber-500 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 ring-1 ring-amber-400/50'
              : 'border border-gray-700 bg-gray-800 text-gray-500 opacity-60 cursor-not-allowed'
            }`}
        >
          <Shield size={16} />
          {bashReady ? 'Shield Bash' : `${(shieldBashCooldown / 1000).toFixed(1)}s`}
        </button>

        {spellItem?.ability ? (
          <button
            onClick={onUseSpell}
            disabled={spellDisabled}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors
              ${spellReady && isCombatActive
                ? 'border border-orange-500 bg-orange-500/10 text-orange-300 hover:bg-orange-500/20 ring-1 ring-orange-400/50'
                : 'border border-gray-700 bg-gray-800 text-gray-500 opacity-60 cursor-not-allowed'
              }`}
          >
            <Flame size={16} />
            {spellReady ? spellItem.ability.name : `${(equippedSpellCooldown / 1000).toFixed(1)}s`}
          </button>
        ) : (
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border border-dashed border-gray-700 text-gray-600 opacity-40 cursor-not-allowed select-none">
            <Plus size={16} />
            Empty Slot
          </div>
        )}
      </div>
    </div>
  )
}

// ─── CombatArena ─────────────────────────────────────────────────────────────

function CombatArena() {
  const {
    player,
    equipment,
    currentMob,
    playerAttackProgress,
    mobAttackProgress,
    isCombatActive,
    shieldBashCooldown,
    equippedSpellCooldown,
    useShieldBash,
    useEquippedSpell,
    resetRun,
    talents,
  } = useGameStore()

  const eff = getEffectiveStats(player, equipment, talents)
  const displayPlayer = { ...player, maxHp: eff.maxHp, baseDamage: eff.damage, attackSpeed: eff.attackSpeed }

  useEffect(() => {
    if (!isCombatActive) return
    const id = setInterval(() => useGameStore.getState().tickCombat(), 50)
    return () => clearInterval(id)
  }, [isCombatActive])

  const playerLost = !isCombatActive && player.currentHp <= 0

  return (
    <div className="flex flex-col items-center justify-center min-h-full p-4 gap-6">
      <div className="flex items-center gap-3">
        <Swords className="text-amber-400" size={28} />
        <h1 className="text-2xl font-bold tracking-widest uppercase text-white">
          Battle Arena
        </h1>
        <Swords className="text-amber-400 scale-x-[-1]" size={28} />
      </div>

      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-3xl">
        <div className="flex flex-col gap-4 flex-1">
          <CombatantPanel
            combatant={displayPlayer}
            attackProgress={playerAttackProgress}
            atkBarColor="amber"
            icon={<Swords size={20} />}
          />
          <ActiveSkills
            shieldBashCooldown={shieldBashCooldown}
            onShieldBash={useShieldBash}
            isCombatActive={isCombatActive}
            spellItem={equipment.spell}
            equippedSpellCooldown={equippedSpellCooldown}
            onUseSpell={useEquippedSpell}
          />
        </div>

        <div className="flex-1">
          <CombatantPanel
            combatant={currentMob}
            attackProgress={mobAttackProgress}
            atkBarColor="orange"
            icon={<Shield size={20} />}
          />
        </div>
      </div>

      {playerLost && (
        <>
          <p className="text-red-500 text-xl font-bold tracking-widest uppercase animate-pulse">
            💀 Defeated!
          </p>
          <button
            onClick={resetRun}
            className="border border-red-800 text-red-400 px-8 py-3 rounded-lg uppercase tracking-widest font-bold hover:bg-red-900/20 transition-colors"
          >
            Return to Hub
          </button>
        </>
      )}
    </div>
  )
}

// ─── LootCard ─────────────────────────────────────────────────────────────────

function LootCard({ item, onSelect }: { item: Item; onSelect: () => void }) {
  const Icon = SLOT_ICONS[item.equipSlot]
  const rc = RARITY_COLORS[item.rarity]
  return (
    <div
      onClick={onSelect}
      className={`bg-gray-900 border rounded-2xl p-6 w-full sm:w-56 flex flex-col gap-4
                  hover:bg-gray-800/80 transition-all duration-200 cursor-pointer group
                  ${rc.border} ${rc.glow}`}
    >
      <div className="flex justify-center">
        <div className="w-20 h-20 rounded-xl bg-amber-500/10 border border-amber-500/30
                        flex items-center justify-center text-amber-400
                        group-hover:bg-amber-500/20 transition-colors">
          <Icon size={40} />
        </div>
      </div>

      <div className="text-center">
        <p className={`font-bold text-lg leading-tight ${rc.text}`}>{item.name}</p>
        <p className="text-gray-500 text-xs">{SLOT_LABELS[item.equipSlot]}</p>
        <p className={`text-xs font-bold uppercase tracking-widest mt-0.5 ${rc.text}`}>{item.rarity}</p>
      </div>

      <p className="text-gray-400 text-sm italic text-center leading-snug">{item.description}</p>

      <div className="flex flex-col gap-1">
        {item.stats.damage      !== undefined && <p className="text-red-400 text-sm font-semibold">+{item.stats.damage} Damage</p>}
        {item.stats.hp          !== undefined && <p className="text-green-400 text-sm font-semibold">+{item.stats.hp} Max HP</p>}
        {item.stats.attackSpeed !== undefined && <p className="text-blue-400 text-sm font-semibold">+{item.stats.attackSpeed.toFixed(1)} Atk Speed</p>}
        {item.ability && <p className="text-orange-400 text-sm font-semibold">✦ {item.ability.name}: {item.ability.description}</p>}
      </div>

      <button className="mt-auto w-full bg-amber-500/20 border border-amber-500 text-amber-300
                         py-2 rounded-lg font-bold text-sm uppercase tracking-widest
                         hover:bg-amber-500/30 transition-colors">
        Claim
      </button>
    </div>
  )
}

// ─── LootSelectionOverlay ─────────────────────────────────────────────────────

function LootSelectionOverlay() {
  const { lootChoices, isLootPickerVisible, selectLoot } = useGameStore()
  if (!isLootPickerVisible) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-6 py-8">
      <div className="text-center px-4">
        <p className="text-xs text-amber-400/60 uppercase tracking-widest mb-1">Treasure Found</p>
        <h2 className="text-3xl font-bold tracking-widest uppercase text-white">Choose Your Reward</h2>
      </div>

      {/* Mobile: horizontal snap carousel */}
      <div className="sm:hidden w-full flex overflow-x-auto snap-x snap-mandatory gap-4 px-8">
        {lootChoices.map((item) => (
          <div key={item.id} className="snap-center shrink-0 w-[75vw] max-w-xs">
            <LootCard item={item} onSelect={() => selectLoot(item)} />
          </div>
        ))}
      </div>

      {/* Desktop: flex row */}
      <div className="hidden sm:flex gap-6 flex-wrap justify-center px-4">
        {lootChoices.map((item) => (
          <LootCard key={item.id} item={item} onSelect={() => selectLoot(item)} />
        ))}
      </div>
    </div>
  )
}

// ─── VictoryOverlay ───────────────────────────────────────────────────────────

function VictoryOverlay() {
  const { combatReward, collectCombatReward } = useGameStore()
  if (!combatReward) return null
  const { xp, item } = combatReward
  const rc = RARITY_COLORS[item.rarity]
  const Icon = SLOT_ICONS[item.equipSlot]
  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="flex flex-col items-center gap-6 text-center">
        <p className="text-xs text-amber-400/60 uppercase tracking-widest">Enemy Defeated</p>
        <h2 className="text-4xl font-bold tracking-widest uppercase text-amber-400 animate-pulse">
          Victory!
        </h2>
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg px-5 py-2">
          <span className="text-amber-300 font-bold text-sm">+{xp} XP</span>
        </div>
        <div className={`bg-gray-900 border rounded-2xl p-6 w-52 flex flex-col gap-3 ${rc.border} ${rc.glow}`}>
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Icon size={32} />
            </div>
          </div>
          <div className="text-center">
            <p className={`font-bold text-base leading-tight ${rc.text}`}>{item.name}</p>
            <p className="text-gray-500 text-xs">{SLOT_LABELS[item.equipSlot]}</p>
            <p className={`text-xs font-bold uppercase tracking-widest mt-0.5 ${rc.text}`}>{item.rarity}</p>
          </div>
          <div className="flex flex-col gap-0.5 text-left text-sm font-semibold">
            {item.stats.damage      !== undefined && <p className="text-red-400">+{item.stats.damage} Damage</p>}
            {item.stats.hp          !== undefined && <p className="text-green-400">+{item.stats.hp} Max HP</p>}
            {item.stats.attackSpeed !== undefined && <p className="text-blue-400">+{item.stats.attackSpeed.toFixed(1)} Atk Speed</p>}
            {item.ability && <p className="text-orange-400">✦ {item.ability.name}</p>}
          </div>
        </div>
        <button
          onClick={collectCombatReward}
          className="border border-amber-500 bg-amber-500/10 text-amber-300 px-10 py-3 rounded-lg uppercase tracking-widest font-bold hover:bg-amber-500/20 transition-colors"
        >
          Collect &amp; Continue
        </button>
      </div>
    </div>
  )
}

// ─── CampOverlay ──────────────────────────────────────────────────────────────

function CampOverlay() {
  const { restEvent, leaveCamp } = useGameStore()
  if (!restEvent) return null
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="flex flex-col items-center gap-6 text-center">
        <Tent className="text-green-400" size={56} />
        <div>
          <p className="text-xs text-green-400/50 uppercase tracking-widest mb-1">Rest Site</p>
          <h2 className="text-2xl font-bold tracking-widest uppercase text-white">You Rested Safely</h2>
          {restEvent.healedAmount > 0
            ? <p className="text-green-400 font-semibold mt-2">+{restEvent.healedAmount} HP restored</p>
            : <p className="text-gray-500 text-sm mt-2 italic">Already at full health.</p>
          }
        </div>
        <button
          onClick={leaveCamp}
          className="border border-green-700 text-green-400 px-10 py-3 rounded-lg uppercase tracking-widest font-bold hover:bg-green-900/20 transition-colors"
        >
          Continue Journey
        </button>
      </div>
    </div>
  )
}

// ─── CombatView (root) ────────────────────────────────────────────────────────

export default function CombatView() {
  const { act1Map, isMapVisible, generateMap } = useGameStore()

  // Generate map on first mount
  useEffect(() => {
    if (act1Map.length === 0) generateMap()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {isMapVisible ? <MapView /> : <CombatArena />}
      <LootSelectionOverlay />
      <VictoryOverlay />
      <CampOverlay />
    </>
  )
}
