export type Rarity = "N" | "R" | "SR";

export type Stats = {
  attack: number;
  maxHp: number;
  dodgeCooldownMs: number;
  goldBonus: number; // percent
  rareBonus: number; // percent, multiplies item drop chances
};

export const BASE_STATS: Stats = {
  attack: 10,
  maxHp: 100,
  dodgeCooldownMs: 3500,
  goldBonus: 0,
  rareBonus: 0,
};

export const STAT_LABELS: Record<keyof Stats, string> = {
  attack: "攻撃力",
  maxHp: "最大HP",
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

export const ITEMS: ItemDef[] = [
  { id: "candy", name: "ふしぎなアメ", emoji: "🍬", rarity: "N", description: "甘くてちょっと元気が出る。" },
  { id: "badge", name: "探検家バッジ", emoji: "📛", rarity: "N", description: "会場を歩き回った証。" },
  { id: "crystal", name: "スライム結晶", emoji: "💎", rarity: "R", description: "スライムの中心で光っていた結晶。" },
  { id: "flame", name: "竜の炎玉", emoji: "🔥", rarity: "R", description: "触るとほんのり温かい。" },
  { id: "lantern", name: "幽霊ランタン", emoji: "🏮", rarity: "R", description: "青白い光がゆらめく。" },
  { id: "chip", name: "黄金チップ", emoji: "🪙", rarity: "SR", description: "ロボットの頭脳。めったに手に入らない。" },
  { id: "crown", name: "ボスの王冠", emoji: "👑", rarity: "SR", description: "選ばれし探検家だけが手にする。" },
];

export type BossDef = {
  id: string;
  name: string;
  emoji: string;
  hp: number;
  gold: [number, number];
  drops: { itemId: string; chance: number }[];
  description: string;
  voice: string;
};

export const BOSSES: BossDef[] = [
  {
    id: "slime",
    name: "スライム",
    emoji: "👾",
    hp: 50,
    gold: [20, 40],
    drops: [
      { itemId: "candy", chance: 0.5 },
      { itemId: "crystal", chance: 0.15 },
      { itemId: "crown", chance: 0.02 },
    ],
    description: "会場の入口付近によく出る。弱いが数が多い。",
    voice: "ぷるぷる…ぼく、わるいスライムじゃないよ！",
  },
  {
    id: "dragon",
    name: "ドラゴン",
    emoji: "🐉",
    hp: 80,
    gold: [50, 80],
    drops: [
      { itemId: "badge", chance: 0.4 },
      { itemId: "flame", chance: 0.15 },
      { itemId: "crown", chance: 0.03 },
    ],
    description: "ステージ裏にひそむ。攻撃力が高い。",
    voice: "我が炎、受けてみよ！",
  },
  {
    id: "ghost",
    name: "ゴースト",
    emoji: "👻",
    hp: 60,
    gold: [30, 50],
    drops: [
      { itemId: "candy", chance: 0.4 },
      { itemId: "lantern", chance: 0.15 },
    ],
    description: "暗い展示ブースに現れる。すぐに姿を消す。",
    voice: "うらめしや〜…なんてね。",
  },
  {
    id: "robot",
    name: "ロボット",
    emoji: "🤖",
    hp: 70,
    gold: [40, 60],
    drops: [
      { itemId: "badge", chance: 0.4 },
      { itemId: "chip", chance: 0.05 },
    ],
    description: "研究展示のそばを巡回している。",
    voice: "ピピッ。シンニュウシャ、ハッケン。",
  },
];

export type TeacherDef = {
  id: string;
  name: string;
  emoji: string;
  subject: string;
  description: string;
  boostPerLevel: Partial<Stats>;
};

// Teachers act as equipment: each equipped teacher adds boostPerLevel × level
export const TEACHERS: TeacherDef[] = [
  {
    id: "pe",
    name: "体育の先生",
    emoji: "🏃",
    subject: "体育",
    description: "体力自慢。最大HPが上がる。",
    boostPerLevel: { maxHp: 20 },
  },
  {
    id: "science",
    name: "理科の先生",
    emoji: "🔬",
    subject: "理科",
    description: "弱点を分析して攻撃力アップ。",
    boostPerLevel: { attack: 3 },
  },
  {
    id: "math",
    name: "数学の先生",
    emoji: "📐",
    subject: "数学",
    description: "計算で回避のタイミングを短縮。",
    boostPerLevel: { dodgeCooldownMs: -300 },
  },
  {
    id: "home",
    name: "家庭科の先生",
    emoji: "🧵",
    subject: "家庭科",
    description: "やりくり上手。ゴールドとレア率が上がる。",
    boostPerLevel: { goldBonus: 10, rareBonus: 10 },
  },
  // Placeholder teachers (names, boosts and 合言葉 can be changed freely)
  {
    id: "japanese",
    name: "国語の先生",
    emoji: "📖",
    subject: "国語",
    description: "言葉の力で攻撃力アップ。",
    boostPerLevel: { attack: 2 },
  },
  {
    id: "english",
    name: "英語の先生",
    emoji: "🌍",
    subject: "英語",
    description: "世界の知識でレア率アップ。",
    boostPerLevel: { rareBonus: 15 },
  },
  {
    id: "social",
    name: "社会の先生",
    emoji: "🗾",
    subject: "社会",
    description: "経済にくわしくゴールドが増える。",
    boostPerLevel: { goldBonus: 15 },
  },
  {
    id: "music",
    name: "音楽の先生",
    emoji: "🎵",
    subject: "音楽",
    description: "リズム感で回避が速くなる。",
    boostPerLevel: { dodgeCooldownMs: -200 },
  },
  {
    id: "art",
    name: "美術の先生",
    emoji: "🎨",
    subject: "美術",
    description: "ひらめきでHPとレア率が少し上がる。",
    boostPerLevel: { maxHp: 10, rareBonus: 5 },
  },
  {
    id: "tech",
    name: "技術の先生",
    emoji: "🔧",
    subject: "技術",
    description: "ものづくりで攻撃力とHPが上がる。",
    boostPerLevel: { attack: 1, maxHp: 10 },
  },
];

export const MAX_TEACHER_LEVEL = 5;
export const EQUIP_SLOTS = 2;

export function levelUpCost(level: number) {
  return { gold: level * 100 };
}

export type Progress = {
  nickname: string;
  score: number;
  gold: number;
  items: Record<string, number>;
  seen: string[];
  defeated: Record<string, number>;
  teachers: Record<string, number>; // teacher id -> level
  equipped: string[];
  titles: string[];
  activeTitle: string | null;
  tutorialDone: boolean;
};

const totalWins = (p: Progress) =>
  Object.values(p.defeated).reduce((sum, n) => sum + n, 0);

export type TitleDef = {
  id: string;
  name: string;
  description: string;
  unlocked: (p: Progress) => boolean;
};

const FAN_WINS = 10;

// The mini-boss this player has beaten most (at least FAN_WINS times), for "〇〇愛好家"
function favoriteBoss(p: Progress) {
  const best = BOSSES.reduce<BossDef | null>(
    (top, b) => ((p.defeated[b.id] ?? 0) > (top ? p.defeated[top.id] ?? 0 : 0) ? b : top),
    null
  );
  return best && (p.defeated[best.id] ?? 0) >= FAN_WINS ? best : null;
}

// Earning every other title unlocks "collector" (withTitles re-checks until nothing new)
export const TITLES: TitleDef[] = [
  { id: "rookie", name: "はじめの一歩", description: "小ボスを初めて倒した", unlocked: (p) => totalWins(p) >= 1 },
  {
    id: "scholar",
    name: "救世主",
    description: "すべての小ボスを倒す",
    unlocked: (p) => BOSSES.every((b) => p.defeated[b.id]),
  },
  { id: "veteran", name: "百戦錬磨", description: "小ボスを100回倒す", unlocked: (p) => totalWins(p) >= 100 },
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
  { id: "rich", name: "貯キング", description: "ゴールドを1000G集める", unlocked: (p) => p.gold >= 1000 },
  {
    id: "fan",
    name: "〇〇愛好家",
    description: `同じ小ボスを${FAN_WINS}回倒す`,
    unlocked: (p) => favoriteBoss(p) !== null,
  },
  {
    id: "collector",
    name: "称号コレクター",
    description: "すべての称号を集める",
    unlocked: (p) => TITLES.every((t) => t.id === "collector" || p.titles.includes(t.id)),
  },
];

// Display name; "〇〇愛好家" becomes e.g. "スライム愛好家"
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

// Venue 合言葉 (written on posters around the venue). Change the words here.
// Matching ignores hiragana/katakana, full/half width, case, spaces and punctuation.
export const BOSS_CODEWORDS: Record<string, string> = {
  slime: "ぷるぷる",
  dragon: "ほのお",
  ghost: "うらめしや",
  robot: "ピピッ",
};

export const TEACHER_CODEWORDS: Record<string, string> = {
  pe: "たいいく",
  science: "じっけん",
  math: "けいさん",
  home: "さいほう",
  japanese: "ことのは",
  english: "はろー",
  social: "ちず",
  music: "どれみ",
  art: "えのぐ",
  tech: "はぐるま",
};

export function normalizeCodeword(text: string) {
  return text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60))
    .replace(/[\s!?！？。、・.,~〜]/g, "");
}

export type CodeAction =
  | { kind: "boss"; boss: BossDef }
  | { kind: "teacher"; teacher: TeacherDef };

// Accepts a venue 合言葉, or the older "ARBOSS:BOSS:<id>" / "ARBOSS:TEACHER:<id>" codes
// (also inside a URL as ?qr=<code>), so links printed earlier keep working.
export function parseCode(text: string): CodeAction | null {
  const word = normalizeCodeword(text);
  if (word) {
    const bossId = Object.keys(BOSS_CODEWORDS).find(
      (id) => normalizeCodeword(BOSS_CODEWORDS[id]) === word
    );
    const boss = BOSSES.find((b) => b.id === bossId);
    if (boss) return { kind: "boss", boss };
    const teacherId = Object.keys(TEACHER_CODEWORDS).find(
      (id) => normalizeCodeword(TEACHER_CODEWORDS[id]) === word
    );
    const teacher = TEACHERS.find((t) => t.id === teacherId);
    if (teacher) return { kind: "teacher", teacher };
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
  if (kind?.toUpperCase() === "BOSS") {
    const boss = BOSSES.find((b) => b.id === id);
    return boss ? { kind: "boss", boss } : null;
  }
  if (kind?.toUpperCase() === "TEACHER") {
    const teacher = TEACHERS.find((t) => t.id === id);
    return teacher ? { kind: "teacher", teacher } : null;
  }
  return null;
}
