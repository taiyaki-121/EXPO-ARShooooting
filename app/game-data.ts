export type Rarity = "N" | "R" | "SR";

// Player HP is fixed: enemy hits take a % of it (BossDef.attackPercent), so HP isn't a stat.
export const PLAYER_MAX_HP = 100;

export type Stats = {
  attack: number;
  dodgeCooldownMs: number;
  goldBonus: number; // percent
  rareBonus: number; // percent, multiplies item drop chances
};

export const BASE_STATS: Stats = {
  attack: 10,
  dodgeCooldownMs: 3500,
  goldBonus: 0,
  rareBonus: 0,
};

export const STAT_LABELS: Record<keyof Stats, string> = {
  attack: "攻撃力",
  dodgeCooldownMs: "回避クールタイム",
  goldBonus: "ゴールドボーナス",
  rareBonus: "レアドロップ率",
};

export type ItemDef = {
  id: string;
  name: string;
  emoji: string;
  rarity: Rarity;
  description: string;
};

// Placeholder items: one per teacher plus a few shared ones. Rename freely.
export const ITEMS: ItemDef[] = [
  { id: "candy", name: "ふしぎなアメ", emoji: "🍬", rarity: "N", description: "どの先生もポケットに入れている。" },
  { id: "badge", name: "探検家バッジ", emoji: "📛", rarity: "N", description: "会場を歩き回った証。" },
  { id: "whistle", name: "ホイッスル", emoji: "📯", rarity: "R", description: "ピッと鳴らすと背筋がのびる。" },
  { id: "flask", name: "メガネ", emoji: "👓", rarity: "R", description: "八木先生が実際にかけているメガネ。" },
  { id: "compass", name: "コンパス", emoji: "🧭", rarity: "R", description: "きれいな円が描ける。" },
  { id: "apron", name: "エプロン", emoji: "🧺", rarity: "R", description: "ほんのりカレーのにおいがする。" },
  { id: "brush", name: "書道の筆", emoji: "🖌️", rarity: "R", description: "とめ・はね・はらい。" },
  { id: "passport", name: "パスポート", emoji: "🛂", rarity: "R", description: "どこへでも行けそうな気がする。" },
  { id: "wrench", name: "星空の写真", emoji: "🌌", rarity: "R", description: "狩野先生がドライブ先で撮った一枚。" },
  { id: "crown", name: "教頭の王冠", emoji: "👑", rarity: "SR", description: "選ばれし探検家だけが手にする。" },
];

export type BossDef = {
  id: string;
  name: string;
  emoji: string;
  subject: string;
  hp: number;
  attackPercent: number; // each enemy hit takes this % of the player's max HP
  gold: [number, number];
  drops: { itemId: string; chance: number }[];
  description: string;
  voice: string;
  skill: { name: string; description: string; boostPerLevel: Partial<Stats> };
  // Optional art in public/: a transparent sprite shown in battle (used when there's no
  // 3D model) and a finished 図鑑 card shown in the 図鑑 detail view.
  image?: string;
  card?: string;
};

const drops = (itemId: string) => [
  { itemId: "candy", chance: 0.4 },
  { itemId, chance: 0.2 },
  { itemId: "crown", chance: 0.02 },
];

// The mini-bosses are the teachers, fought via the venue 合言葉. Beating one earns its
// skill; beating it again raises the skill level (SKILL_LEVEL_WINS). Placeholder values.
export const BOSSES: BossDef[] = [
  {
    id: "suzuki",
    name: "鈴木先生",
    emoji: "🧑‍🏫",
    subject: "鈴木",
    hp: 50,
    attackPercent: 8,
    gold: [30, 50],
    drops: drops("brush"),
    description: "（紹介文を入れてください）",
    voice: "（セリフを入れてください）",
    skill: { name: "言霊", description: "攻撃力が上がる", boostPerLevel: { attack: 2 } },
  },
  {
    id: "osawa",
    name: "大澤先生",
    emoji: "👨‍🏫",
    subject: "大澤",
    hp: 60,
    attackPercent: 10,
    gold: [30, 50],
    drops: drops("whistle"),
    description: "（紹介文を入れてください）",
    voice: "（セリフを入れてください）",
    skill: { name: "全力ダッシュ", description: "回避が速くなる", boostPerLevel: { dodgeCooldownMs: -250 } },
  },
  {
    id: "yagi",
    name: "八木先生",
    emoji: "🧔",
    subject: "八木",
    hp: 90,
    attackPercent: 14,
    gold: [60, 90],
    drops: drops("flask"),
    description:
      "投資と家族への愛で構成されている極めてシンプルな生き物。物欲センサーが完全に欠落している。最近の悩みは娘にパパよりママのほうが好きと言われていること。",
    voice: "物欲？ ないですね。あるのは投資と家族への愛だけです。",
    skill: { name: "弱点分析", description: "攻撃力が上がる", boostPerLevel: { attack: 3 } },
    image: "/teachers/yagi.png",
    card: "/teachers/yagi-card.png",
  },
  {
    id: "ohashi",
    name: "大橋先生",
    emoji: "👩‍🏫",
    subject: "大橋",
    hp: 50,
    attackPercent: 9,
    gold: [30, 50],
    drops: drops("apron"),
    description: "（紹介文を入れてください）",
    voice: "（セリフを入れてください）",
    skill: { name: "やりくり上手", description: "ゴールドとレア率が上がる", boostPerLevel: { goldBonus: 10, rareBonus: 10 } },
  },
  {
    id: "shibata",
    name: "柴田先生",
    emoji: "🧑‍🔬",
    subject: "柴田",
    hp: 70,
    attackPercent: 12,
    gold: [40, 60],
    drops: drops("compass"),
    description: "（紹介文を入れてください）",
    voice: "（セリフを入れてください）",
    skill: { name: "最適解", description: "回避が速くなる", boostPerLevel: { dodgeCooldownMs: -300 } },
  },
  {
    id: "futamura",
    name: "二村先生",
    emoji: "🧑‍💻",
    subject: "二村",
    hp: 60,
    attackPercent: 10,
    gold: [30, 50],
    drops: drops("passport"),
    description: "（紹介文を入れてください）",
    voice: "（セリフを入れてください）",
    skill: { name: "グローバル", description: "レア率が上がる", boostPerLevel: { rareBonus: 15 } },
  },
  {
    id: "kano",
    name: "狩野先生",
    emoji: "🧑‍🔧",
    subject: "狩野",
    hp: 70,
    attackPercent: 12,
    gold: [40, 60],
    drops: drops("wrench"),
    description:
      "星空を求めてドライブに行くロマンチスト。最近の悩みは12時間は寝ないと寝た気がしないという驚異のロングスリーパー。",
    voice: "星空、見に行かない？ …でもその前に12時間寝かせて。",
    skill: { name: "ものづくり", description: "攻撃力とゴールドが上がる", boostPerLevel: { attack: 1, goldBonus: 5 } },
    image: "/teachers/kano.png",
    card: "/teachers/kano-card.png",
  },
];

// Total wins against a teacher needed for each skill level (index 0 = Lv.1)
export const SKILL_LEVEL_WINS = [1, 3, 6, 10, 15];
export const MAX_SKILL_LEVEL = SKILL_LEVEL_WINS.length;
export const EQUIP_SLOTS = 2;

export function skillLevel(wins: number) {
  return SKILL_LEVEL_WINS.filter((w) => wins >= w).length;
}

// Wins still needed for the next skill level (null at max)
export function winsToNextLevel(wins: number) {
  const next = SKILL_LEVEL_WINS.find((w) => wins < w);
  return next === undefined ? null : next - wins;
}

// Equipment. A player's very first clear lets them pick one "full" piece (all strong,
// each different). The others drop later as weaker "lite" versions, so farming adds
// variety without widening the gap to players who arrive late.
export type GearTier = "full" | "lite";

export type GearDef = {
  id: string;
  name: string;
  emoji: string;
  description: string;
  boost: Record<GearTier, Partial<Stats>>;
};

export const GEAR: GearDef[] = [
  {
    id: "sword",
    name: "勇者の剣",
    emoji: "🗡️",
    description: "攻撃力が大きく上がる。",
    boost: { full: { attack: 8 }, lite: { attack: 3 } },
  },
  {
    id: "boots",
    name: "疾風のくつ",
    emoji: "👟",
    description: "回避のクールタイムが短くなる。",
    boost: { full: { dodgeCooldownMs: -1200 }, lite: { dodgeCooldownMs: -500 } },
  },
  {
    id: "charm",
    name: "幸運のお守り",
    emoji: "🍀",
    description: "ゴールドとレアドロップ率が上がる。",
    boost: { full: { goldBonus: 30, rareBonus: 30 }, lite: { goldBonus: 10, rareBonus: 10 } },
  },
];

// Chance per win (after the starter pick) that a lite piece you don't own yet drops
export const GEAR_DROP_CHANCE = 0.1;

export type Progress = {
  nickname: string;
  score: number;
  gold: number;
  items: Record<string, number>;
  seen: string[];
  defeated: Record<string, number>;
  equipped: string[]; // equipped skills (teacher ids)
  gear: Record<string, GearTier>;
  equippedGear: string | null;
  titles: string[];
  activeTitle: string | null;
  tutorialDone: boolean;
};

const totalWins = (p: Progress) =>
  BOSSES.reduce((sum, b) => sum + (p.defeated[b.id] ?? 0), 0);

export function needsStarterGear(p: Progress) {
  return totalWins(p) > 0 && Object.keys(p.gear).length === 0;
}

export type TitleDef = {
  id: string;
  name: string;
  description: string;
  unlocked: (p: Progress) => boolean;
};

const FAN_WINS = 10;

// The teacher this player has beaten most (at least FAN_WINS times), for "〇〇愛好家"
function favoriteBoss(p: Progress) {
  const best = BOSSES.reduce<BossDef | null>(
    (top, b) => ((p.defeated[b.id] ?? 0) > (top ? p.defeated[top.id] ?? 0 : 0) ? b : top),
    null
  );
  return best && (p.defeated[best.id] ?? 0) >= FAN_WINS ? best : null;
}

// Earning every other title unlocks "collector" (withTitles re-checks until nothing new)
export const TITLES: TitleDef[] = [
  { id: "rookie", name: "はじめの一歩", description: "先生を初めて倒した", unlocked: (p) => totalWins(p) >= 1 },
  {
    id: "scholar",
    name: "救世主",
    description: "すべての先生を倒す",
    unlocked: (p) => BOSSES.every((b) => p.defeated[b.id]),
  },
  {
    id: "master",
    name: "免許皆伝",
    description: `スキルをLv.${MAX_SKILL_LEVEL}にする`,
    unlocked: (p) => BOSSES.some((b) => skillLevel(p.defeated[b.id] ?? 0) >= MAX_SKILL_LEVEL),
  },
  { id: "veteran", name: "百戦錬磨", description: "先生を100回倒す", unlocked: (p) => totalWins(p) >= 100 },
  {
    id: "lucky",
    name: "お宝ハンター",
    description: "SRアイテムを集める",
    unlocked: (p) => ITEMS.some((i) => i.rarity === "SR" && p.items[i.id]),
  },
  {
    id: "first-item",
    name: "みならいコレクター",
    description: "はじめてアイテムをゲットする",
    unlocked: (p) => ITEMS.some((i) => p.items[i.id]),
  },
  {
    id: "all-items",
    name: "一流コレクター",
    description: "すべてのアイテムをゲットする",
    unlocked: (p) => ITEMS.every((i) => p.items[i.id]),
  },
  {
    id: "all-gear",
    name: "フル装備",
    description: "すべての装備を集める",
    unlocked: (p) => GEAR.every((g) => p.gear[g.id]),
  },
  { id: "rich", name: "貯キング", description: "ゴールドを1000G集める", unlocked: (p) => p.gold >= 1000 },
  {
    id: "fan",
    name: "〇〇愛好家",
    description: `同じ先生を${FAN_WINS}回倒す`,
    unlocked: (p) => favoriteBoss(p) !== null,
  },
  {
    id: "collector",
    name: "称号コレクター",
    description: "すべての称号を集める",
    unlocked: (p) => TITLES.every((t) => t.id === "collector" || p.titles.includes(t.id)),
  },
];

// Display name; "〇〇愛好家" becomes e.g. "鈴木先生愛好家"
export function titleName(t: TitleDef, p: Progress) {
  if (t.id === "fan") {
    const boss = favoriteBoss(p);
    return boss ? `${boss.name}愛好家` : t.name;
  }
  return t.name;
}

// Stage event start (local time). The last boss fight begins here.
export const STAGE_EVENT_HOUR = 14;
export const STAGE_EVENT_MINUTE = 0;

// Venue 合言葉 (written on posters next to each teacher). Change the words here.
// Matching ignores hiragana/katakana, full/half width, case, spaces and punctuation.
// Placeholder words carried over from the old subject teachers — replace before printing posters.
export const BOSS_CODEWORDS: Record<string, string> = {
  suzuki: "ことのは",
  osawa: "たいいく",
  yagi: "じっけん",
  ohashi: "さいほう",
  shibata: "けいさん",
  futamura: "はろー",
  kano: "はぐるま",
};

export function normalizeCodeword(text: string) {
  return text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60))
    .replace(/[\s!?！？。、・.,~〜]/g, "");
}

// Accepts a venue 合言葉, or the older "ARBOSS:BOSS:<id>" / "ARBOSS:TEACHER:<id>" codes
// (also inside a URL as ?qr=<code>), so links printed earlier keep working.
export function parseCode(text: string): BossDef | null {
  const word = normalizeCodeword(text);
  if (word) {
    const bossId = Object.keys(BOSS_CODEWORDS).find(
      (id) => normalizeCodeword(BOSS_CODEWORDS[id]) === word
    );
    const boss = BOSSES.find((b) => b.id === bossId);
    if (boss) return boss;
  }

  let payload = text.trim();
  try {
    const fromUrl = new URL(payload).searchParams.get("qr");
    if (fromUrl) payload = fromUrl;
  } catch {
    // not a URL
  }
  const [prefix, kind, id] = payload.split(":");
  if (prefix?.toUpperCase() !== "ARBOSS") return null;
  if (!["BOSS", "TEACHER"].includes(kind?.toUpperCase() ?? "")) return null;
  return BOSSES.find((b) => b.id === id) ?? null;
}
