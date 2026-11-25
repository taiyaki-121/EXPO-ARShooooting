"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  BASE_STATS,
  BOSSES,
  BossDef,
  EQUIP_SLOTS,
  GEAR,
  GEAR_DROP_CHANCE,
  ITEMS,
  Progress,
  Stats,
  TITLES,
  needsStarterGear,
  skillLevel,
} from "./game-data";
import { PlayFabError, login, playfabEnabled, saveProgress } from "./playfab";

const STORAGE_KEY = "arboss-progress-v1";
// Battles fire many updates in a row, so cloud saves are batched
const CLOUD_SAVE_DELAY_MS = 2000;

export function newProgress(nickname: string): Progress {
  return {
    nickname,
    score: 0,
    gold: 0,
    items: {},
    seen: [],
    defeated: {},
    equipped: [],
    gear: {},
    equippedGear: null,
    titles: [],
    activeTitle: null,
    tutorialDone: false,
  };
}

function load(): Progress | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...newProgress(""), ...JSON.parse(raw) } : null;
  } catch {
    return null;
  }
}

function save(p: Progress | null) {
  try {
    if (p) localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // storage unavailable (private mode etc.) — progress stays in memory
  }
}

function withTitles(p: Progress): Progress {
  // Loop so a title that depends on other titles ("collector") unlocks in the same update
  let next = p;
  for (;;) {
    const earned = TITLES.filter((t) => !next.titles.includes(t.id) && t.unlocked(next));
    if (earned.length === 0) return next;
    next = { ...next, titles: [...next.titles, ...earned.map((t) => t.id)] };
  }
}

export function useProgress() {
  const [progress, setProgress] = useState<Progress | null>(load);
  const [newTitles, setNewTitles] = useState<string[]>([]);
  const saveTimer = useRef<number | undefined>(undefined);

  const persist = useCallback((p: Progress | null) => {
    save(p);
    window.clearTimeout(saveTimer.current);
    if (!p || !playfabEnabled) return;
    saveTimer.current = window.setTimeout(() => {
      saveProgress(p).catch((e) => console.warn("PlayFab save failed", e));
    }, CLOUD_SAVE_DELAY_MS);
  }, []);

  // A returning player (progress restored from localStorage) needs a fresh session
  useEffect(() => {
    if (progress && playfabEnabled) {
      login(progress.nickname).catch((e) => console.warn("PlayFab login failed", e));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Updates are event-driven (one per tap / battle result), so reading the
  // rendered progress keeps title detection outside of a state updater.
  const update = useCallback(
    (fn: (p: Progress) => Progress) => {
      if (!progress) return;
      const next = withTitles(fn(progress));
      const earned = next.titles.filter((t) => !progress.titles.includes(t));
      if (earned.length) setNewTitles((q) => [...q, ...earned]);
      persist(next);
      setProgress(next);
    },
    [progress, persist]
  );

  // Throws PlayFabError (e.g. NameNotAvailable) so the entry screen can show it.
  // Network failures fall back to offline play.
  const start = useCallback(
    async (nickname: string) => {
      let cloud: Progress | null = null;
      if (playfabEnabled) {
        try {
          cloud = await login(nickname);
        } catch (e) {
          if (e instanceof PlayFabError) throw e;
          console.warn("PlayFab unreachable, playing offline", e);
        }
      }
      const existing = cloud ?? load();
      const next =
        existing && existing.nickname === nickname
          ? { ...newProgress(nickname), ...existing }
          : newProgress(nickname);
      persist(next);
      setProgress(next);
    },
    [persist]
  );

  // Also wipes the cloud save, otherwise rejoining with the same nickname restores it
  const signOut = useCallback(() => {
    if (progress && playfabEnabled) {
      saveProgress(newProgress(progress.nickname)).catch((e) =>
        console.warn("PlayFab reset failed", e)
      );
    }
    persist(null);
    setProgress(null);
  }, [progress, persist]);

  const dismissTitle = useCallback(() => setNewTitles((q) => q.slice(1)), []);

  return {
    progress,
    update,
    start,
    signOut,
    newTitle: newTitles[0] ?? null,
    dismissTitle,
  };
}

function addBoost(stats: Stats, boost: Partial<Stats>, times = 1) {
  for (const [key, value] of Object.entries(boost)) {
    stats[key as keyof Stats] += (value ?? 0) * times;
  }
}

export function computeStats(p: Progress): Stats {
  const stats = { ...BASE_STATS };
  for (const id of p.equipped) {
    const boss = BOSSES.find((b) => b.id === id);
    if (boss) addBoost(stats, boss.skill.boostPerLevel, skillLevel(p.defeated[id] ?? 0));
  }
  const gear = GEAR.find((g) => g.id === p.equippedGear);
  const tier = gear && p.gear[gear.id];
  if (gear && tier) addBoost(stats, gear.boost[tier]);
  stats.dodgeCooldownMs = Math.max(1000, stats.dodgeCooldownMs);
  return stats;
}

// Collection rate (0–1). Drives the shared finisher multiplier at the stage event.
export function collectionRate(p: Progress) {
  const owned =
    BOSSES.filter((b) => p.defeated[b.id]).length +
    ITEMS.filter((i) => p.items[i.id]).length +
    GEAR.filter((g) => p.gear[g.id]).length +
    TITLES.filter((t) => p.titles.includes(t.id)).length;
  const total = BOSSES.length + ITEMS.length + GEAR.length + TITLES.length;
  return owned / total;
}

export function finisherMultiplier(p: Progress) {
  return 1 + collectionRate(p) * 2;
}

export type Drops = {
  gold: number;
  items: string[];
  gear: string | null; // a lite piece, only after the starter pick
};

export function rollDrops(boss: BossDef, stats: Stats, p: Progress): Drops {
  const [min, max] = boss.gold;
  const baseGold = min + Math.floor(Math.random() * (max - min + 1));
  const missingGear = GEAR.filter((g) => !p.gear[g.id]);
  const canDropGear = Object.keys(p.gear).length > 0 && missingGear.length > 0;
  return {
    gold: Math.round(baseGold * (1 + stats.goldBonus / 100)),
    items: boss.drops
      .filter((d) => Math.random() < d.chance * (1 + stats.rareBonus / 100))
      .map((d) => d.itemId),
    gear:
      canDropGear && Math.random() < GEAR_DROP_CHANCE
        ? missingGear[Math.floor(Math.random() * missingGear.length)].id
        : null,
  };
}

export function applyWin(boss: BossDef, drops: Drops) {
  return (p: Progress): Progress => {
    const items = { ...p.items };
    for (const id of drops.items) items[id] = (items[id] ?? 0) + 1;
    const firstWin = !p.defeated[boss.id];
    // A newly earned skill goes straight into a free slot
    const equipped =
      firstWin && p.equipped.length < EQUIP_SLOTS && !p.equipped.includes(boss.id)
        ? [...p.equipped, boss.id]
        : p.equipped;
    return {
      ...p,
      score: p.score + boss.hp * 10,
      gold: p.gold + drops.gold,
      items,
      gear: drops.gear && !p.gear[drops.gear] ? { ...p.gear, [drops.gear]: "lite" } : p.gear,
      equipped,
      seen: p.seen.includes(boss.id) ? p.seen : [...p.seen, boss.id],
      defeated: { ...p.defeated, [boss.id]: (p.defeated[boss.id] ?? 0) + 1 },
    };
  };
}

export function markSeen(bossId: string) {
  return (p: Progress): Progress =>
    p.seen.includes(bossId) ? p : { ...p, seen: [...p.seen, bossId] };
}

export function chooseStarterGear(gearId: string) {
  return (p: Progress): Progress =>
    needsStarterGear(p) && GEAR.some((g) => g.id === gearId)
      ? { ...p, gear: { [gearId]: "full" }, equippedGear: gearId }
      : p;
}

export function equipGear(gearId: string) {
  return (p: Progress): Progress => {
    if (p.equippedGear === gearId) return { ...p, equippedGear: null };
    return p.gear[gearId] ? { ...p, equippedGear: gearId } : p;
  };
}

export function toggleEquip(skillId: string) {
  return (p: Progress): Progress => {
    if (p.equipped.includes(skillId)) {
      return { ...p, equipped: p.equipped.filter((id) => id !== skillId) };
    }
    if (!p.defeated[skillId] || p.equipped.length >= EQUIP_SLOTS) return p;
    return { ...p, equipped: [...p.equipped, skillId] };
  };
}
