"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  BASE_STATS,
  BOSSES,
  BossDef,
  EQUIP_SLOTS,
  ITEMS,
  MAX_TEACHER_LEVEL,
  Progress,
  Stats,
  TEACHERS,
  TITLES,
  levelUpCost,
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
    materials: {},
    items: {},
    seen: [],
    defeated: {},
    teachers: {},
    equipped: [],
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
  const earned = TITLES.filter((t) => !p.titles.includes(t.id) && t.unlocked(p));
  if (earned.length === 0) return p;
  return { ...p, titles: [...p.titles, ...earned.map((t) => t.id)] };
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

export function computeStats(p: Progress): Stats {
  const stats = { ...BASE_STATS };
  for (const id of p.equipped) {
    const teacher = TEACHERS.find((t) => t.id === id);
    const level = p.teachers[id] ?? 0;
    if (!teacher) continue;
    for (const [key, value] of Object.entries(teacher.boostPerLevel)) {
      stats[key as keyof Stats] += (value ?? 0) * level;
    }
  }
  stats.dodgeCooldownMs = Math.max(1000, stats.dodgeCooldownMs);
  return stats;
}

// Collection rate (0–1). Drives the shared finisher multiplier at the stage event.
export function collectionRate(p: Progress) {
  const owned =
    BOSSES.filter((b) => p.defeated[b.id]).length +
    ITEMS.filter((i) => p.items[i.id]).length +
    TEACHERS.filter((t) => p.teachers[t.id]).length +
    TITLES.filter((t) => p.titles.includes(t.id)).length;
  const total = BOSSES.length + ITEMS.length + TEACHERS.length + TITLES.length;
  return owned / total;
}

export function finisherMultiplier(p: Progress) {
  return 1 + collectionRate(p) * 2;
}

export type Drops = {
  gold: number;
  material: number;
  items: string[];
};

export function rollDrops(boss: BossDef, stats: Stats): Drops {
  const [min, max] = boss.gold;
  const baseGold = min + Math.floor(Math.random() * (max - min + 1));
  return {
    gold: Math.round(baseGold * (1 + stats.goldBonus / 100)),
    material: 1 + (Math.random() < 0.3 ? 1 : 0),
    items: boss.drops
      .filter((d) => Math.random() < d.chance * (1 + stats.rareBonus / 100))
      .map((d) => d.itemId),
  };
}

export function applyWin(boss: BossDef, drops: Drops) {
  return (p: Progress): Progress => {
    const items = { ...p.items };
    for (const id of drops.items) items[id] = (items[id] ?? 0) + 1;
    return {
      ...p,
      score: p.score + boss.hp * 10,
      gold: p.gold + drops.gold,
      materials: {
        ...p.materials,
        [boss.material]: (p.materials[boss.material] ?? 0) + drops.material,
      },
      items,
      seen: p.seen.includes(boss.id) ? p.seen : [...p.seen, boss.id],
      defeated: { ...p.defeated, [boss.id]: (p.defeated[boss.id] ?? 0) + 1 },
    };
  };
}

export function markSeen(bossId: string) {
  return (p: Progress): Progress =>
    p.seen.includes(bossId) ? p : { ...p, seen: [...p.seen, bossId] };
}

export function recruitTeacher(teacherId: string) {
  return (p: Progress): Progress => {
    if (p.teachers[teacherId]) return p;
    const equipped =
      p.equipped.length < EQUIP_SLOTS ? [...p.equipped, teacherId] : p.equipped;
    return { ...p, teachers: { ...p.teachers, [teacherId]: 1 }, equipped };
  };
}

export function toggleEquip(teacherId: string) {
  return (p: Progress): Progress => {
    if (p.equipped.includes(teacherId)) {
      return { ...p, equipped: p.equipped.filter((id) => id !== teacherId) };
    }
    if (!p.teachers[teacherId] || p.equipped.length >= EQUIP_SLOTS) return p;
    return { ...p, equipped: [...p.equipped, teacherId] };
  };
}

export function canLevelUp(p: Progress, teacherId: string) {
  const teacher = TEACHERS.find((t) => t.id === teacherId);
  const level = p.teachers[teacherId] ?? 0;
  if (!teacher || level === 0 || level >= MAX_TEACHER_LEVEL) return false;
  const cost = levelUpCost(level);
  return p.gold >= cost.gold && (p.materials[teacher.material] ?? 0) >= cost.materials;
}

export function levelUpTeacher(teacherId: string) {
  return (p: Progress): Progress => {
    if (!canLevelUp(p, teacherId)) return p;
    const teacher = TEACHERS.find((t) => t.id === teacherId)!;
    const level = p.teachers[teacherId];
    const cost = levelUpCost(level);
    return {
      ...p,
      gold: p.gold - cost.gold,
      materials: {
        ...p.materials,
        [teacher.material]: (p.materials[teacher.material] ?? 0) - cost.materials,
      },
      teachers: { ...p.teachers, [teacherId]: level + 1 },
    };
  };
}
