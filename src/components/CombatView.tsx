import { useEffect, useRef, useState } from 'react'
import { Swords, Shield, Plus, Skull, Tent, Archive, Flame, Crown, Shirt, Layers, Award, Circle, Zap, Heart, Coins, ShoppingCart, FlaskConical, Hammer, Sparkles, ChevronsUp, ChevronRight, X } from 'lucide-react'
import { useGameStore, getEffectiveStats, getItemSellValue, RARITY_COLORS, computePlayerLevel, calculateLevelFromXp } from '../stores/useGameStore'
import type { Player, Mob, MapNode, Item, EquipSlot, ItemSlot, MobTier, MobTrait, DamageIndicator, ActiveBuff } from '../stores/useGameStore'
import { getStatDiff, DiffBadge, DiffBadgeF } from '../utils/statDiff'
import ItemComparisonPanel from './ItemComparisonPanel'

// ─── Slot icon maps (shared by LootCard) ──────────────────────────────────────

const SLOT_ICONS: Record<EquipSlot, React.ElementType> = {
  head: Crown, chest: Shirt, legs: Layers,
  mainHand: Swords, offHand: Shield,
  amulet: Award, ring1: Circle, ring2: Circle, spell: Zap,
}

const SLOT_LABELS: Record<EquipSlot, string> = {
  head: 'Head', chest: 'Chest', legs: 'Legs',
  mainHand: 'Main Hand', offHand: 'Off Hand',
  amulet: 'Amulet', ring1: 'Ring 1', ring2: 'Ring 2', spell: 'Spell',
}

function getSlotIcon(slot: ItemSlot): React.ElementType {
  if (slot === 'potion') return FlaskConical
  return SLOT_ICONS[slot]
}

function getSlotLabel(slot: ItemSlot): string {
  if (slot === 'potion') return 'Potion'
  return SLOT_LABELS[slot]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CONTAINER_W = 320
const FLOOR_H = 60
const NODE_R = 24 // radius of node circle

function nodeX(nodesOnFloor: number, index: number): number {
  return (CONTAINER_W / (nodesOnFloor + 1)) * (index + 1)
}

function nodeY(floor: number): number {
  return (20 - floor) * FLOOR_H + FLOOR_H / 2
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hpColor(pct: number): string {
  if (pct > 50) return 'bg-green-500'
  if (pct > 25) return 'bg-yellow-500'
  return 'bg-red-500'
}

function NodeIcon({ type, size = 16 }: { type: MapNode['type']; size?: number }) {
  if (type === 'mob')    return <Swords size={size} />
  if (type === 'elite')  return <Skull size={size} />
  if (type === 'boss')   return <Crown size={size} />
  if (type === 'rest')   return <Tent size={size} />
  if (type === 'chest')  return <Archive size={size} />
  if (type === 'market') return <ShoppingCart size={size} />
  return null
}

// ─── PlayerStatsBar ───────────────────────────────────────────────────────────

function PlayerStatsBar() {
  const { player, equipment, playerXp, talents, slotUpgrades, ironScrap, voidDust } = useGameStore()
  const eff = getEffectiveStats(player, equipment, talents, slotUpgrades)
  const unspentPoints = calculateLevelFromXp(playerXp).level - Object.values(talents).reduce((a, b) => a + b, 0)
  return (
    <div className="w-full max-w-sm bg-gray-900/80 border border-gray-800 rounded-xl px-4 py-2 flex items-center gap-4 text-xs font-semibold">
      <div className="flex items-center gap-1.5 text-green-400">
        <Heart size={13} />
        <span>{player.currentHp} / {eff.maxHp}</span>
      </div>
      <div className="flex items-center gap-1.5 text-amber-400">
        <Hammer size={13} />
        <span>{ironScrap}</span>
      </div>
      <div className="flex items-center gap-1.5 text-purple-400">
        <Sparkles size={13} />
        <span>{voidDust}</span>
      </div>
      <div className="ml-auto flex items-center gap-3">
        {unspentPoints > 0 && (
          <span className="flex items-center gap-1 text-emerald-400 font-bold bg-emerald-900/30 border border-emerald-500/50 px-2 py-0.5 rounded-full">
            <ChevronsUp size={12} />
            {unspentPoints} PT
          </span>
        )}
        <span className="text-amber-400">⭐ {playerXp} XP</span>
        <span className="flex items-center gap-1 text-yellow-400">
          <Coins size={12} />
          {player.gold}g
        </span>
      </div>
    </div>
  )
}

// ─── MapView ──────────────────────────────────────────────────────────────────

function MapView() {
  const { act1Map, currentFloor, currentMapNodeId, playerXp, chooseNode } = useGameStore()

  const allNodes = act1Map.flat()
  const prevNode = allNodes.find((n) => n.id === currentMapNodeId) ?? null
  const totalH = 20 * FLOOR_H

  const scrollRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!scrollRef.current) return
    const y = nodeY(currentFloor)
    const viewH = scrollRef.current.offsetHeight
    scrollRef.current.scrollTop = y - viewH / 2
  }, [currentFloor])

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

  const actComplete = currentFloor > 20

  return (
    <div className="flex flex-col items-center w-full h-full p-4 gap-3">
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
          <span>Floor {Math.min(currentFloor, 20)} / 20</span>
        </div>
      </div>

      {actComplete && (
        <p className="text-amber-400 text-xl font-bold tracking-widest uppercase animate-pulse">
          ✨ Act 1 Complete!
        </p>
      )}

      {/* Scrollable map area */}
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 w-full max-w-xs mx-auto overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
      <div
        className="relative mx-auto bg-gray-950 border border-gray-800 rounded-xl"
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
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-3 text-xs text-gray-500 max-w-sm">
        {([['mob','Mob'],['elite','Elite'],['boss','Boss'],['rest','Rest'],['chest','Chest'],['market','Market']] as const).map(([type, label]) => (
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
  tier?: MobTier
  damageIndicators?: DamageIndicator[]
  isKillingBlow?: boolean
  traits?: MobTrait[]
  bossPhase?: 'void' | 'exposed'
  bossPhaseTimerMs?: number
}

function CombatantPanel({ combatant, attackProgress, atkBarColor, icon, tier, damageIndicators, isKillingBlow, traits, bossPhase, bossPhaseTimerMs }: PanelProps) {
  const hpPct = Math.max(0, (combatant.currentHp / combatant.maxHp) * 100)
  const atkPct = Math.min(100, attackProgress)
  const atkFill = atkBarColor === 'amber' ? 'bg-amber-400' : 'bg-orange-500'

  return (
    <div className="relative bg-gray-900 border border-gray-700 rounded-xl p-4 flex flex-col gap-4">

      {/* Floating damage numbers */}
      {damageIndicators?.map((d) => (
        <span
          key={d.id}
          className={`animate-float-up absolute select-none font-extrabold tabular-nums z-10
            ${d.isHeal
              ? 'text-base text-green-400 top-0'
              : d.isSkill
              ? 'text-lg text-blue-300 drop-shadow-[0_0_6px_rgb(147_197_253)] top-0'
              : d.isCrit
              ? 'text-2xl text-yellow-300 drop-shadow-[0_0_8px_rgb(253_224_71)] -top-3'
              : 'text-base text-red-400 top-0'
            }`}
          style={{ left: `${(Math.floor(d.id) * 37 % 50) + 20}%` }}
        >
          {d.isHeal ? `+${d.value}` : d.isSkill ? `✦${d.value}` : d.isCrit ? `⚡${d.value}` : `-${d.value}`}
        </span>
      ))}

      {/* Killing blow flash overlay */}
      {isKillingBlow && (
        <div className="animate-killing-blow absolute inset-0 rounded-xl bg-red-500/20 pointer-events-none z-20" />
      )}
      <div className="flex flex-col gap-1">
        {tier === 'elite' && (
          <span className="self-start text-[10px] font-bold tracking-widest uppercase
                           text-red-400 bg-red-900/40 border border-red-700/50 px-2 py-0.5 rounded">
            ⚡ ELITE
          </span>
        )}
        {tier === 'boss' && (
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">BOSS</p>
        )}
        <div className="flex items-center gap-2">
          <span className="text-amber-400">{icon}</span>
          <h2 className={`font-bold tracking-widest uppercase ${
            tier === 'boss'  ? 'text-2xl text-purple-300 drop-shadow-[0_0_12px_rgb(168_85_247)]' :
            tier === 'elite' ? 'text-lg text-red-400 drop-shadow-[0_0_8px_rgb(239_68_68)]' :
                               'text-lg text-white'
          }`}>
            {combatant.name}
          </h2>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex justify-between text-xs text-gray-400 font-semibold uppercase tracking-wider">
          <span>HP</span>
          <span>{combatant.currentHp} / {combatant.maxHp}</span>
        </div>
        <div className="bg-gray-700 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${hpColor(hpPct)}`}
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

      {/* Boss Phase Panel — only for Void Warden */}
      {bossPhase && (
        <div className={`flex flex-col gap-2 rounded-lg p-3 border ${
          bossPhase === 'void'
            ? 'border-purple-600 bg-purple-900/20'
            : 'border-red-500 bg-red-900/20'
        }`}>
          <div className="flex items-center gap-2">
            <span className="text-base">{bossPhase === 'void' ? '🛡️' : '💥'}</span>
            <div>
              <p className={`text-xs font-bold uppercase tracking-widest ${
                bossPhase === 'void' ? 'text-purple-300' : 'text-red-300'
              }`}>
                {bossPhase === 'void' ? 'Void Armor' : 'Exposed'}
              </p>
              <p className="text-[10px] text-gray-400 leading-snug">
                {bossPhase === 'void'
                  ? 'Takes and deals 50% less damage.'
                  : 'Takes and deals 50% EXTRA damage!'}
              </p>
            </div>
          </div>
          <div className="bg-gray-700/60 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-[50ms] ease-linear ${
                bossPhase === 'void' ? 'bg-purple-500' : 'bg-red-500'
              }`}
              style={{ width: `${((bossPhaseTimerMs ?? 8000) / 8000) * 100}%` }}
            />
          </div>
        </div>
      )}

      {traits && traits.length > 0 && (
        <div className="flex flex-col gap-1.5 border border-red-900/60 bg-red-950/30 rounded-lg p-2.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-red-400/70">Traits</p>
          {traits.map(t => (
            <div key={t.id} className="flex items-start gap-2">
              <span className="text-sm leading-none mt-0.5">{t.icon}</span>
              <div>
                <p className="text-xs font-bold text-red-300">{t.name}</p>
                <p className="text-[10px] text-gray-400 leading-snug">{t.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-500 tracking-wide">
        {combatant.baseDamage} dmg &nbsp;·&nbsp; {combatant.attackSpeed.toFixed(2)}/s
      </p>
    </div>
  )
}

// ─── ActiveSkills ─────────────────────────────────────────────────────────────

interface ActiveSkillsProps {
  powerStrikeCooldown: number
  onPowerStrike: () => void
  isCombatActive: boolean
  spellItem: Item | null
  equippedSpellCooldown: number
  onUseSpell: () => void
  potionBelt: { item: Item; count: number }[]
  onUsePotion: (index: number) => void
}

function ActiveSkills({ powerStrikeCooldown, onPowerStrike, isCombatActive, spellItem, equippedSpellCooldown, onUseSpell, potionBelt, onUsePotion }: ActiveSkillsProps) {
  const bashReady = powerStrikeCooldown <= 0
  const bashDisabled = !isCombatActive || !bashReady

  const spellReady = equippedSpellCooldown <= 0
  const spellDisabled = !isCombatActive || !spellReady

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 flex flex-col gap-3">
      <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest">
        Active Skills
      </p>
      <div className="flex w-full justify-between items-center gap-4">
        {/* LEFT — Healing */}
        <div className="flex gap-2 items-center">
          {potionBelt.length > 0 ? potionBelt.map((slot, i) => (
            <button
              key={i}
              onClick={() => onUsePotion(i)}
              disabled={!isCombatActive}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors
                ${isCombatActive
                  ? 'border border-purple-500 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 ring-1 ring-purple-400/50'
                  : 'border border-gray-700 bg-gray-800 text-gray-500 opacity-60 cursor-not-allowed'
                }`}
            >
              <FlaskConical size={16} />
              {slot.item.name.split(' ')[0]} ×{slot.count}
            </button>
          )) : (
            <div className="w-14 h-14 rounded-lg border-2 border-dashed border-gray-600 bg-gray-800/50
                            flex flex-col items-center justify-center opacity-50 select-none">
              <FlaskConical size={14} className="text-gray-500" />
              <span className="text-[9px] text-gray-500 mt-0.5">No Potion</span>
            </div>
          )}
        </div>

        {/* RIGHT — Attack Skills */}
        <div className="flex gap-2 items-center justify-end flex-wrap">
          <button
            onClick={onPowerStrike}
            disabled={bashDisabled}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors min-w-[130px]
              ${bashReady && isCombatActive
                ? 'border border-amber-500 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 ring-1 ring-amber-400/50'
                : 'border border-gray-700 bg-gray-800 text-gray-500 opacity-60 cursor-not-allowed'
              }`}
          >
            <Swords size={16} />
            {bashReady ? 'Power Strike' : `${(powerStrikeCooldown / 1000).toFixed(1)}s`}
          </button>

          {spellItem?.ability ? (
            <button
              onClick={onUseSpell}
              disabled={spellDisabled}
              className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors min-w-[130px]
                ${spellReady && isCombatActive
                  ? 'border border-orange-500 bg-orange-500/10 text-orange-300 hover:bg-orange-500/20 ring-1 ring-orange-400/50'
                  : 'border border-gray-700 bg-gray-800 text-gray-500 opacity-60 cursor-not-allowed'
                }`}
            >
              <Flame size={16} />
              <span className="flex flex-col items-start leading-tight">
                <span>{spellReady ? spellItem.ability.name : `${(equippedSpellCooldown / 1000).toFixed(1)}s`}</span>
                {spellReady && (
                  <span className="text-[10px] opacity-70">{spellItem.ability.value} Dmg</span>
                )}
              </span>
            </button>
          ) : (
            <div className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border border-dashed border-gray-700 text-gray-600 opacity-40 cursor-not-allowed select-none min-w-[130px]">
              <Plus size={16} />
              Empty Slot
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── ActiveBuffsBar ───────────────────────────────────────────────────────────

function ActiveBuffsBar({ activeBuffs }: { activeBuffs: ActiveBuff[] }) {
  if (activeBuffs.length === 0) return null
  return (
    <div className="flex flex-wrap gap-1.5 justify-center">
      {activeBuffs.map((b, i) => {
        let label = ''
        let color = ''
        if (b.type === 'freezeEnemy') {
          const secs = b.expiresAt ? Math.max(0, Math.ceil((b.expiresAt - Date.now()) / 1000)) : 0
          label = `❄ Enemy Frozen (${secs}s)`
          color = 'text-cyan-300 bg-cyan-900/40 border-cyan-700/50'
        } else if (b.type === 'berserk') {
          const secs = b.expiresAt ? Math.max(0, Math.ceil((b.expiresAt - Date.now()) / 1000)) : 0
          label = `🔥 Berserk! (${secs}s)`
          color = 'text-orange-300 bg-orange-900/40 border-orange-700/50'
        } else if (b.type === 'lifestealBuff') {
          label = `🩸 Vampire ×${b.charges ?? 0}`
          color = 'text-emerald-300 bg-emerald-900/40 border-emerald-700/50'
        } else if (b.type === 'midas') {
          const secs = b.expiresAt ? Math.max(0, Math.ceil((b.expiresAt - Date.now()) / 1000)) : 0
          label = `💰 Midas (${secs}s)`
          color = 'text-yellow-300 bg-yellow-900/40 border-yellow-700/50'
        }
        return (
          <span key={i} className={`text-[11px] font-bold px-2 py-0.5 rounded border ${color}`}>
            {label}
          </span>
        )
      })}
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
    powerStrikeCooldown,
    equippedSpellCooldown,
    usePowerStrike,
    useEquippedSpell,
    resetRun,
    talents,
    combatReward,
    engageCombat,
    combatEventKey,
    combatEventText,
    damageIndicators,
    isKillingBlowActive,
    potionBelt,
    activeBuffs,
    usePotion,
    totalXp,
    runSummary,
    bossPhase,
    bossPhaseTimerMs,
    slotUpgrades,
  } = useGameStore()

  if (!currentMob) return null

  const playerLevel = computePlayerLevel(totalXp)

  const [displayText, setDisplayText] = useState<string | null>(null)
  useEffect(() => {
    if (!combatEventText) return
    setDisplayText(combatEventText)
    const t = setTimeout(() => setDisplayText(null), 1500)
    return () => clearTimeout(t)
  }, [combatEventKey])

  const eff = getEffectiveStats(player, equipment, talents, slotUpgrades)
  const displayPlayer = { ...player, maxHp: eff.maxHp, baseDamage: eff.damage, attackSpeed: eff.attackSpeed }

  useEffect(() => {
    if (!isCombatActive) return
    const id = setInterval(() => useGameStore.getState().tickCombat(), 50)
    return () => clearInterval(id)
  }, [isCombatActive])

  const playerLost  = !isCombatActive && player.currentHp <= 0
  const isPrepPhase = !isCombatActive && player.currentHp > 0 && combatReward === null && !isKillingBlowActive

  return (
    <div
      className="relative flex flex-col items-center justify-center min-h-full p-4 gap-4"
      style={{ background: 'radial-gradient(ellipse at 50% 0%, #1a0530 0%, #05050a 60%)' }}
    >
      {/* Arena View — face-to-face portraits */}
      <div className="flex items-center justify-center gap-2 w-full">
        {displayPlayer.portraitUrl && (
          <img
            src={displayPlayer.portraitUrl}
            alt={displayPlayer.name}
            className="w-36 h-36 rounded-lg border-4 border-gray-700 object-cover object-top flex-shrink-0"
            style={{ transform: 'scaleX(-1)' }}
          />
        )}

        <div className="flex flex-col items-center justify-center gap-0 flex-shrink-0 px-1">
          <div className="w-[2px] h-9 bg-gradient-to-b from-transparent to-violet-500" />
          <span className="text-sm font-black tracking-[0.25em] text-gray-200
                           drop-shadow-[0_0_8px_rgb(139_92_246)] py-1 select-none">
            VS
          </span>
          <div className="w-[2px] h-9 bg-gradient-to-b from-red-500 to-transparent" />
        </div>

        {currentMob.portraitUrl && (
          <img
            src={currentMob.portraitUrl}
            alt={currentMob.name}
            className={`w-36 h-36 rounded-lg border-4 object-cover object-top flex-shrink-0 ${
              currentMob.tier === 'boss'  ? 'border-fuchsia-600 shadow-lg shadow-fuchsia-600/40' :
              currentMob.tier === 'elite' ? 'border-red-500 shadow-lg shadow-red-500/40' :
                                            'border-gray-700'
            }`}
          />
        )}
      </div>

      {/* Combat event label */}
      <div className="h-7 flex items-center justify-center">
        {displayText && (
          <span className={`text-sm font-bold tracking-widest uppercase ${
            displayText.includes('Critical') ? 'text-yellow-400' :
            displayText.includes('Dodged')   ? 'text-cyan-400'   :
            displayText.includes('Executed') ? 'text-purple-400' :
            'text-amber-300'
          }`}>
            {displayText}
          </span>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-3xl">
        <div className="flex flex-col gap-4 flex-1">
          <div className="flex flex-col gap-1">
            <p className="text-[9px] text-center text-amber-400/40 font-semibold tracking-widest uppercase">
              Lv.{playerLevel} Fighter
            </p>
            <CombatantPanel
              combatant={displayPlayer}
              attackProgress={playerAttackProgress}
              atkBarColor="amber"
              icon={<Swords size={20} />}
              damageIndicators={damageIndicators.filter(d => d.target === 'player')}
            />
          </div>
          <ActiveBuffsBar activeBuffs={activeBuffs} />
          <ActiveSkills
            powerStrikeCooldown={powerStrikeCooldown}
            onPowerStrike={usePowerStrike}
            isCombatActive={isCombatActive}
            spellItem={equipment.spell}
            equippedSpellCooldown={equippedSpellCooldown}
            onUseSpell={useEquippedSpell}
            potionBelt={potionBelt}
            onUsePotion={usePotion}
          />
        </div>

        <div className="flex-1">
          <CombatantPanel
            combatant={currentMob}
            attackProgress={mobAttackProgress}
            atkBarColor="orange"
            icon={
              currentMob.tier === 'boss'  ? <Crown  size={20} className="text-amber-500" /> :
              currentMob.tier === 'elite' ? <Skull  size={20} className="text-red-400"   /> :
                                            <Shield size={20} className="text-gray-500"  />
            }
            tier={currentMob.tier}
            damageIndicators={damageIndicators.filter(d => d.target === 'enemy')}
            isKillingBlow={isKillingBlowActive}
            traits={currentMob.traits}
            bossPhase={currentMob.name === 'The Void Warden' ? bossPhase : undefined}
            bossPhaseTimerMs={currentMob.name === 'The Void Warden' ? bossPhaseTimerMs : undefined}
          />
        </div>
      </div>

      {playerLost && !runSummary?.active && (
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

      {isPrepPhase && (
        <div className="absolute inset-0 z-10 bg-gray-950/80 backdrop-blur-[2px]
                        flex flex-col items-center justify-center gap-6 p-6">
          <div className="text-center">
            <p className="text-xs text-amber-400/50 uppercase tracking-widest mb-1">Enemy Spotted</p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-widest uppercase text-white">
              Prepare for Battle
            </h2>
          </div>

          {/* Target Preview */}
          <div className="w-full max-w-xs bg-gray-900/80 border border-gray-700 rounded-xl p-4 flex flex-col gap-3">
            <div className="flex items-start gap-3">
              {currentMob.portraitUrl && (
                <img
                  src={currentMob.portraitUrl}
                  alt={currentMob.name}
                  className={`w-20 h-20 rounded-md object-cover border-2 flex-shrink-0 ${
                    currentMob.tier === 'boss'  ? 'border-fuchsia-600 shadow-sm shadow-fuchsia-600/50' :
                    currentMob.tier === 'elite' ? 'border-red-500 shadow-sm shadow-red-500/50' :
                                                  'border-gray-600'
                  }`}
                />
              )}
              <div className="flex flex-col gap-1">
                {currentMob.tier === 'elite' && (
                  <span className="self-start text-[10px] font-bold tracking-widest uppercase
                                   text-red-400 bg-red-900/40 border border-red-700/50 px-2 py-0.5 rounded">
                    ⚡ ELITE
                  </span>
                )}
                {currentMob.tier === 'boss' && (
                  <span className="self-start flex items-center gap-1 text-[10px] font-bold tracking-widest uppercase
                                   text-purple-300 bg-purple-900/40 border border-purple-600/50 px-2 py-0.5 rounded animate-pulse">
                    <Crown size={10} /> BOSS
                  </span>
                )}
                <p className={`font-bold tracking-widest uppercase ${
                  currentMob.tier === 'boss'
                    ? 'text-xl text-purple-300 drop-shadow-[0_0_12px_rgb(168_85_247)]'
                    : currentMob.tier === 'elite'
                    ? 'text-lg text-red-400 drop-shadow-[0_0_8px_rgb(239_68_68)]'
                    : 'text-lg text-white'
                }`}>
                  {currentMob.name}
                </p>
              </div>
            </div>

            <div className="flex gap-4 text-xs text-gray-400">
              <span>❤ {currentMob.maxHp} HP</span>
              <span>⚔ {currentMob.baseDamage} dmg</span>
              <span>⚡ {currentMob.attackSpeed.toFixed(2)}/s</span>
            </div>

            {currentMob.traits && currentMob.traits.length > 0 && (
              <div className="flex flex-col gap-1.5 border border-red-900/60 bg-red-950/30 rounded-lg p-2.5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-red-400/70">Traits</p>
                {currentMob.traits.map(t => (
                  <div key={t.id} className="flex items-start gap-2">
                    <span className="text-sm leading-none mt-0.5">{t.icon}</span>
                    <div>
                      <p className="text-xs font-bold text-red-300">{t.name}</p>
                      <p className="text-[10px] text-gray-400 leading-snug">{t.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={engageCombat}
            className="px-10 py-4 rounded-xl border-2 border-amber-500 bg-amber-500/20
                       text-amber-300 text-xl font-bold uppercase tracking-widest
                       hover:bg-amber-500/30 active:bg-amber-500/40 transition-colors animate-pulse"
          >
            ⚔ FIGHT!
          </button>
        </div>
      )}
    </div>
  )
}

// ─── LootCard ─────────────────────────────────────────────────────────────────

function LootCard({ item, onSelect, equipment }: { item: Item; onSelect: () => void; equipment: Record<EquipSlot, Item | null> }) {
  const Icon = getSlotIcon(item.equipSlot)
  const rc = RARITY_COLORS[item.rarity]
  const diff = getStatDiff(item, item.equipSlot === 'potion' ? null : equipment[item.equipSlot as EquipSlot])
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
        <p className="text-gray-500 text-xs">{getSlotLabel(item.equipSlot)}</p>
        <p className={`text-xs font-bold uppercase tracking-widest mt-0.5 ${rc.text}`}>{item.rarity}</p>
      </div>

      <p className="text-gray-400 text-sm italic text-center leading-snug">{item.description}</p>

      <div className="flex flex-col gap-1">
        {item.equipSlot !== 'potion' && !equipment[item.equipSlot as EquipSlot] && (
          <p className="text-amber-400 text-xs font-bold uppercase tracking-wide">Slot: Empty</p>
        )}
        {item.stats.damage          !== undefined && <p className="text-red-400 text-sm font-semibold">+{item.stats.damage} Damage<DiffBadge diff={diff.damage} /></p>}
        {item.stats.hp              !== undefined && <p className="text-green-400 text-sm font-semibold">+{item.stats.hp} Max HP<DiffBadge diff={diff.hp} /></p>}
        {item.stats.attackSpeed     !== undefined && <p className="text-blue-400 text-sm font-semibold">{item.stats.attackSpeed >= 0 ? '+' : ''}{item.stats.attackSpeed.toFixed(2)} Atk Speed<DiffBadgeF diff={diff.attackSpeed} decimals={2} /></p>}
        {item.stats.critChance      !== undefined && <p className="text-yellow-400 text-sm font-semibold">+{(item.stats.critChance * 100).toFixed(0)}% Crit<DiffBadge diff={Math.round(diff.critChance * 100)} /></p>}
        {item.stats.dodgeChance     !== undefined && <p className="text-cyan-400 text-sm font-semibold">+{(item.stats.dodgeChance * 100).toFixed(0)}% Dodge<DiffBadge diff={Math.round(diff.dodgeChance * 100)} /></p>}
        {item.stats.lifesteal       !== undefined && <p className="text-emerald-400 text-sm font-semibold">+{item.stats.lifesteal} Lifesteal<DiffBadge diff={diff.lifesteal} /></p>}
        {item.stats.damageReduction !== undefined && <p className="text-orange-400 text-sm font-semibold">+{item.stats.damageReduction} DR<DiffBadge diff={diff.damageReduction} /></p>}
        {item.stats.hp              === undefined && (equipment[item.equipSlot]?.stats.hp              ?? 0) > 0   && <p className="text-green-400/50 text-sm font-semibold">Max HP <DiffBadge diff={diff.hp} /></p>}
        {item.stats.damage          === undefined && (equipment[item.equipSlot]?.stats.damage          ?? 0) > 0   && <p className="text-red-400/50 text-sm font-semibold">Damage <DiffBadge diff={diff.damage} /></p>}
        {item.stats.attackSpeed     === undefined && (equipment[item.equipSlot]?.stats.attackSpeed     ?? 0) !== 0 && <p className="text-blue-400/50 text-sm font-semibold">Atk Speed <DiffBadgeF diff={diff.attackSpeed} decimals={2} /></p>}
        {item.stats.critChance      === undefined && (equipment[item.equipSlot]?.stats.critChance      ?? 0) > 0   && <p className="text-yellow-400/50 text-sm font-semibold">Crit <DiffBadge diff={Math.round(diff.critChance * 100)} /></p>}
        {item.stats.dodgeChance     === undefined && (equipment[item.equipSlot]?.stats.dodgeChance     ?? 0) > 0   && <p className="text-cyan-400/50 text-sm font-semibold">Dodge <DiffBadge diff={Math.round(diff.dodgeChance * 100)} /></p>}
        {item.stats.lifesteal       === undefined && (equipment[item.equipSlot]?.stats.lifesteal       ?? 0) > 0   && <p className="text-emerald-400/50 text-sm font-semibold">Lifesteal <DiffBadge diff={diff.lifesteal} /></p>}
        {item.stats.damageReduction === undefined && (equipment[item.equipSlot]?.stats.damageReduction ?? 0) > 0   && <p className="text-orange-400/50 text-sm font-semibold">DR <DiffBadge diff={diff.damageReduction} /></p>}
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
  const { lootChoices, isLootPickerVisible, selectLoot, equipment } = useGameStore()
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
            <LootCard item={item} onSelect={() => selectLoot(item)} equipment={equipment} />
          </div>
        ))}
      </div>

      {/* Desktop: flex row */}
      <div className="hidden sm:flex gap-6 flex-wrap justify-center px-4">
        {lootChoices.map((item) => (
          <LootCard key={item.id} item={item} onSelect={() => selectLoot(item)} equipment={equipment} />
        ))}
      </div>
    </div>
  )
}

// ─── InspectionModal ──────────────────────────────────────────────────────────

function InspectionModal() {
  const {
    inspectedItem, setInspectedItem,
    combatReward, collectCombatReward,
    equipItem, equipItemToSlot, equipPotion,
  } = useGameStore()
  if (!inspectedItem || !combatReward) return null

  const handleEquip = (slot?: EquipSlot) => {
    collectCombatReward()
    if (inspectedItem.equipSlot === 'potion') {
      equipPotion(inspectedItem)
    } else if (slot) {
      equipItemToSlot(inspectedItem, slot)
    } else {
      equipItem(inspectedItem)
    }
  }

  return (
    <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-xs max-h-[85dvh] flex flex-col bg-gray-900 border border-gray-700 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 shrink-0">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Item Details</p>
          <button
            onClick={() => setInspectedItem(null)}
            className="text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <ItemComparisonPanel item={inspectedItem} onEquip={handleEquip} />
        </div>
      </div>
    </div>
  )
}

// ─── VictoryOverlay ───────────────────────────────────────────────────────────

function VictoryOverlay() {
  const { combatReward, collectCombatReward, setInspectedItem } = useGameStore()
  if (!combatReward) return null
  const { xp, gold, item } = combatReward
  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="flex flex-col items-center gap-6 text-center w-full max-w-xs">
        <p className="text-xs text-amber-400/60 uppercase tracking-widest">Enemy Defeated</p>
        <h2 className="text-4xl font-bold tracking-widest uppercase text-amber-400 animate-pulse">
          Victory!
        </h2>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-2">
            <span className="text-amber-300 font-bold text-sm">+{xp} XP</span>
          </div>
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-4 py-2 flex items-center gap-1.5">
            <Coins size={14} className="text-yellow-400" />
            <span className="text-yellow-300 font-bold text-sm">+{gold}g</span>
          </div>
          {combatReward.scrap > 0 && (
            <div className="bg-gray-500/10 border border-gray-500/30 rounded-lg px-4 py-2 flex items-center gap-1.5">
              <Hammer size={12} className="text-gray-300" />
              <span className="text-gray-300 font-bold text-sm">+{combatReward.scrap}</span>
            </div>
          )}
          {combatReward.leveledUp && (
            <div className="border border-emerald-500 bg-emerald-500/10 rounded-lg px-4 py-2 animate-pulse">
              <span className="text-emerald-400 font-bold text-sm uppercase tracking-widest">Level Up! +1 Talent Point</span>
            </div>
          )}
        </div>
        {/* Loot row */}
        {item.equipSlot === 'potion' ? (
          <button
            onClick={() => setInspectedItem(item)}
            className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 flex items-center gap-3 text-left hover:bg-gray-800 active:bg-gray-800 transition-colors cursor-pointer"
          >
            <FlaskConical size={24} className="text-green-400 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="font-bold text-sm text-white leading-tight">{item.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>
            </div>
            <ChevronRight size={16} className="text-gray-600 shrink-0" />
          </button>
        ) : (
          <button
            onClick={() => setInspectedItem(item)}
            className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 flex items-center gap-3 text-left hover:bg-gray-800 active:bg-gray-800 transition-colors cursor-pointer"
          >
            {(() => {
              const Icon = SLOT_ICONS[item.equipSlot as EquipSlot]
              const rc   = RARITY_COLORS[item.rarity]
              return (
                <>
                  <Icon size={24} className={`${rc.text} shrink-0`} />
                  <div className="min-w-0 flex-1">
                    <p className={`font-bold text-sm leading-tight ${rc.text}`}>{item.name}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{SLOT_LABELS[item.equipSlot as EquipSlot]} · {item.rarity}</p>
                  </div>
                  <ChevronRight size={16} className="text-gray-600 shrink-0" />
                </>
              )
            })()}
          </button>
        )}
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

// ─── MarketOverlay ────────────────────────────────────────────────────────────

function MarketOverlay() {
  const { marketItems, player, equipment, backpack, buyItem, rerollMarket, leaveMarket, sellAllBackpack } = useGameStore()
  const backpackSellTotal = backpack.reduce((sum, i) => sum + getItemSellValue(i.rarity), 0)
  if (!marketItems) return null

  const canReroll = player.gold >= 15

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-4 gap-5 overflow-y-auto">
      {/* Header */}
      <div className="text-center shrink-0">
        <p className="text-xs text-amber-400/60 uppercase tracking-widest mb-1">Merchant</p>
        <h2 className="text-3xl font-bold tracking-widest uppercase text-white">The Market</h2>
      </div>

      {/* Gold display */}
      <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-5 py-2 shrink-0">
        <Coins size={18} className="text-yellow-400" />
        <span className="text-yellow-300 font-bold text-lg">{player.gold} Gold</span>
      </div>

      {/* Item grid — 2 cols on mobile, 4 on sm+ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-3xl">
        {marketItems.map(({ item, price }) => {
          const canAfford = player.gold >= price
          const rc = RARITY_COLORS[item.rarity]
          const Icon = getSlotIcon(item.equipSlot)
          const diff = getStatDiff(item, item.equipSlot === 'potion' ? null : equipment[item.equipSlot as EquipSlot])
          return (
            <div key={item.id} className={`bg-gray-900 border rounded-xl p-3 flex flex-col gap-2 ${rc.border} ${rc.glow}`}>
              <div className="flex items-center gap-2">
                <Icon size={18} className="text-amber-400 shrink-0" />
                <div>
                  <p className={`font-bold text-sm leading-tight ${rc.text}`}>{item.name}</p>
                  <p className={`text-[10px] font-bold uppercase tracking-widest ${rc.text}`}>{item.rarity}</p>
                </div>
              </div>
              <p className="text-gray-400 text-xs italic leading-snug flex-1">{item.description}</p>
              <div className="flex flex-col gap-0.5 text-xs font-semibold">
                {item.equipSlot !== 'potion' && !equipment[item.equipSlot as EquipSlot] && (
                  <p className="text-amber-400 text-[9px] font-bold uppercase tracking-wide">Slot: Empty</p>
                )}
                {item.stats.damage          !== undefined && <p className="text-red-400">+{item.stats.damage} Damage<DiffBadge diff={diff.damage} /></p>}
                {item.stats.hp              !== undefined && <p className="text-green-400">+{item.stats.hp} HP<DiffBadge diff={diff.hp} /></p>}
                {item.stats.attackSpeed     !== undefined && <p className="text-blue-400">{item.stats.attackSpeed >= 0 ? '+' : ''}{item.stats.attackSpeed.toFixed(2)} Spd<DiffBadgeF diff={diff.attackSpeed} decimals={2} /></p>}
                {item.stats.critChance      !== undefined && <p className="text-yellow-400">+{(item.stats.critChance * 100).toFixed(0)}% Crit<DiffBadge diff={Math.round(diff.critChance * 100)} /></p>}
                {item.stats.dodgeChance     !== undefined && <p className="text-cyan-400">+{(item.stats.dodgeChance * 100).toFixed(0)}% Dodge<DiffBadge diff={Math.round(diff.dodgeChance * 100)} /></p>}
                {item.stats.lifesteal       !== undefined && <p className="text-emerald-400">+{item.stats.lifesteal} LS<DiffBadge diff={diff.lifesteal} /></p>}
                {item.stats.damageReduction !== undefined && <p className="text-orange-400">+{item.stats.damageReduction} DR<DiffBadge diff={diff.damageReduction} /></p>}
                {item.stats.hp              === undefined && (equipment[item.equipSlot]?.stats.hp              ?? 0) > 0   && <p className="text-green-400/50">HP <DiffBadge diff={diff.hp} /></p>}
                {item.stats.damage          === undefined && (equipment[item.equipSlot]?.stats.damage          ?? 0) > 0   && <p className="text-red-400/50">Damage <DiffBadge diff={diff.damage} /></p>}
                {item.stats.attackSpeed     === undefined && (equipment[item.equipSlot]?.stats.attackSpeed     ?? 0) !== 0 && <p className="text-blue-400/50">Spd <DiffBadgeF diff={diff.attackSpeed} decimals={2} /></p>}
                {item.stats.critChance      === undefined && (equipment[item.equipSlot]?.stats.critChance      ?? 0) > 0   && <p className="text-yellow-400/50">Crit <DiffBadge diff={Math.round(diff.critChance * 100)} /></p>}
                {item.stats.dodgeChance     === undefined && (equipment[item.equipSlot]?.stats.dodgeChance     ?? 0) > 0   && <p className="text-cyan-400/50">Dodge <DiffBadge diff={Math.round(diff.dodgeChance * 100)} /></p>}
                {item.stats.lifesteal       === undefined && (equipment[item.equipSlot]?.stats.lifesteal       ?? 0) > 0   && <p className="text-emerald-400/50">LS <DiffBadge diff={diff.lifesteal} /></p>}
                {item.stats.damageReduction === undefined && (equipment[item.equipSlot]?.stats.damageReduction ?? 0) > 0   && <p className="text-orange-400/50">DR <DiffBadge diff={diff.damageReduction} /></p>}
                {item.ability && <p className="text-orange-400">✦ {item.ability.name}</p>}
              </div>
              <button
                onClick={() => buyItem(item, price)}
                disabled={!canAfford}
                className={`mt-auto w-full py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-1
                  ${canAfford
                    ? 'border border-yellow-500 bg-yellow-500/10 text-yellow-300 hover:bg-yellow-500/20'
                    : 'border border-gray-700 bg-gray-800 text-gray-600 cursor-not-allowed opacity-60'
                  }`}
              >
                <Coins size={11} />
                {price}g
              </button>
            </div>
          )
        })}
      </div>

      {/* Sell All backpack */}
      {backpack.length > 0 && (
        <button
          onClick={sellAllBackpack}
          className="w-full max-w-xs py-3 rounded-xl border border-yellow-600 bg-yellow-600/10 text-yellow-300 text-sm font-bold uppercase tracking-widest hover:bg-yellow-600/20 transition-colors flex items-center justify-center gap-2 shrink-0"
        >
          <Coins size={14} />
          Sell All Backpack ({backpackSellTotal}g)
        </button>
      )}

      {/* Bottom actions */}
      <div className="flex gap-3 w-full max-w-xs shrink-0">
        <button
          onClick={leaveMarket}
          className="flex-1 py-3 rounded-xl border border-gray-600 text-gray-300 text-sm font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors"
        >
          Leave Shop
        </button>
        <button
          onClick={rerollMarket}
          disabled={!canReroll}
          className={`flex-1 py-3 rounded-xl text-sm font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5
            ${canReroll
              ? 'border border-amber-500 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
              : 'border border-gray-700 bg-gray-800 text-gray-600 cursor-not-allowed opacity-60'
            }`}
        >
          <Coins size={13} />
          Reroll (15g)
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
      <InspectionModal />
      <CampOverlay />
      <MarketOverlay />
    </>
  )
}
