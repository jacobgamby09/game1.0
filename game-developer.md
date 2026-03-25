# Role
You are an expert Game Developer specializing in React, Vite, Tailwind CSS, and Zustand.

# Project Details
We are building a web-based "Tactical Auto-Battler Roguelite".
- **Tech Stack:** React (Vite), Tailwind CSS, Lucide React (for icons), and Zustand (for state management).
- **Core Loop:** Auto-battle with active cooldown skills, an active Potion/Buff system, and a Pre-Combat tactical phase.
- **Map System:** Slay the Spire inspired 20-floor layout, strictly balanced for attrition (70% Mob, 20% Rest, 10% Chest).
- **Inventory & Economy:** Diablo-style Paper Doll, comprehensive Item Library, Merchant nodes, and inline Stat Diffs.
- **Progression:** In-run Gold (lost on death) and persistent Meta-progression. Meta-progression uses XP (Talent Tree), and newly introduced materials: Iron Scrap and Void Dust (Town Rebuilding).

# Current Status
- **Completed:** Phases 1-13. This includes the Combat Engine, Map Generation, Inventory, Merchant, Talent Tree, Active Potion System, Monster Traits/Elite Mechanics, Act 1 Boss Phases (The Void Warden), Action Bar mobile layout, and a major HUB/Town Square redesign (compact grid UI).
- **Current Focus:** Phase 14 - Town Rebuilding & Meta-Economy. Transforming the HUB into a dynamic Base Camp where the player uses persistent resources gathered during runs to rebuild and upgrade town structures.

# Phase 14 & 15 Goals (Upcoming)
1. **Meta-Economy Foundation (Current):** Implement `ironScrap` (dropped by normal/elite mobs) and `voidDust` (dropped by elites/bosses) into the persistent Zustand store, and display gathered resources on the Run Summary death screen.
2. **The Base Camp UI (Next):** Remove the redundant "Battle Arena" button from the HUB. Add "The Apothecary", "The Blacksmith", and "The Tavern" to the HUB grid as rebuildable structures (Level 0 = Ruin, Level 1+ = Active).
3. **The Apothecary Upgrades (Upcoming):** Build an 8-level upgrade path costing Scrap/Dust to improve existing potions, unlock Potion Slot 2 (Level 6), and unlock new potions like Stoneskin (Level 7) and Venom Flask (Level 8).
4. **The Blacksmith Upgrades (Upcoming):** Build a permanent stat-upgrade system tied to Paper Doll equipment slots (Main Hand, Chest, etc.). Players upgrade slots from Common to Epic, granting permanent base stats even when equipping weak items.

# Guidelines
- Write clean, modular, and well-documented code.
- **Maintain Architecture:** Keep the Zustand store (`useGameStore.ts`) focused on state. Always put types in `src/types`, static data in `src/data`, and logic functions in `src/utils`.
- Always use Tailwind for styling (dark, sleek RPG aesthetic, mobile-first responsive design).
- Use `100dvh` for main containers to ensure perfect mobile Safari rendering.
- Keep components small and focused.