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

export type MaterialId = "gel" | "scale" | "cloth" | "gear";

export const MATERIALS: Record<MaterialId, { name: string; emoji: string }> = {
  gel: { name: "ぷるぷるゼリー", emoji: "🟢" },
  scale: { name: "竜のウロコ", emoji: "🔶" },
  cloth: { name: "まぼろしの布", emoji: "🌫️" },
  gear: { name: "古びた歯車", emoji: "⚙️" },
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
  material: MaterialId;
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
    material: "gel",
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
    material: "scale",
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
    material: "cloth",
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
    material: "gear",
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
  material: MaterialId;
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
    material: "gel",
  },
  {
    id: "science",
    name: "理科の先生",
    emoji: "🔬",
    subject: "理科",
    description: "弱点を分析して攻撃力アップ。",
    boostPerLevel: { attack: 3 },
    material: "gear",
  },
  {
    id: "math",
    name: "数学の先生",
    emoji: "📐",
    subject: "数学",
    description: "計算で回避のタイミングを短縮。",
    boostPerLevel: { dodgeCooldownMs: -300 },
    material: "scale",
  },
  {
    id: "home",
    name: "家庭科の先生",
    emoji: "🧵",
    subject: "家庭科",
    description: "やりくり上手。ゴールドとレア率が上がる。",
    boostPerLevel: { goldBonus: 10, rareBonus: 10 },
    material: "cloth",
  },
];

export const MAX_TEACHER_LEVEL = 5;
export const EQUIP_SLOTS = 2;

export function levelUpCost(level: number) {
  return { gold: level * 100, materials: level * 2 };
}

export type Progress = {
  nickname: string;
  score: number;
  gold: number;
  materials: Partial<Record<MaterialId, number>>;
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

export const TITLES: TitleDef[] = [
  { id: "rookie", name: "かけだし探検家", description: "小ボスを初めて倒す", unlocked: (p) => totalWins(p) >= 1 },
  { id: "hunter", name: "ボスハンター", description: "小ボスを10回倒す", unlocked: (p) => totalWins(p) >= 10 },
  {
    id: "scholar",
    name: "図鑑博士",
    description: "すべての小ボスを倒す",
    unlocked: (p) => BOSSES.every((b) => p.defeated[b.id]),
  },
  {
    id: "lucky",
    name: "強運の持ち主",
    description: "SRアイテムを手に入れる",
    unlocked: (p) => ITEMS.some((i) => i.rarity === "SR" && p.items[i.id]),
  },
  { id: "rich", name: "大富豪", description: "ゴールドを1000以上持つ", unlocked: (p) => p.gold >= 1000 },
  {
    id: "friend",
    name: "先生のお気に入り",
    description: "先生を仲間にする",
    unlocked: (p) => Object.keys(p.teachers).length >= 1,
  },
];

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
