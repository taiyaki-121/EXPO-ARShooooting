"use client";

import { useEffect, useState, type CSSProperties } from "react";
import {
  BASE_STATS,
  BOSSES,
  BossDef,
  EQUIP_SLOTS,
  GEAR,
  ITEMS,
  MAX_SKILL_LEVEL,
  Progress,
  STAGE_EVENT_HOUR,
  STAGE_EVENT_MINUTE,
  STAT_LABELS,
  Stats,
  TITLES,
  skillLevel,
  titleName,
  winsToNextLevel,
} from "./game-data";
import { collectionRate, equipGear, finisherMultiplier, toggleEquip } from "./progress";
import { playfabEnabled } from "./playfab";
import { boostText } from "./starter-gear";

type MenuTab = "dex" | "bag" | "titles" | "ranking";

const MENU_TABS: { id: MenuTab; label: string }[] = [
  { id: "dex", label: "図鑑" },
  { id: "bag", label: "バッグ" },
  { id: "titles", label: "称号" },
  ...(playfabEnabled ? [{ id: "ranking" as const, label: "順位" }] : []),
];

const TUTORIAL_STEPS = [
  {
    emoji: "🔑",
    title: "合言葉を見つけよう",
    body: "会場のあちこちに先生がかくれています。そばの合言葉をホームの真ん中の「合言葉」から入力すると、先生とバトル！",
  },
  {
    emoji: "🗺️",
    title: "マップで先生を探そう",
    body: "「マップ」で先生のいる場所をチェック。攻撃ボタンで攻撃、回避ボタンで敵の攻撃をかわします。",
  },
  {
    emoji: "🎁",
    title: "初クリアで装備ゲット",
    body: "はじめて先生を倒すと、3つの中から好きな装備をひとつもらえます。どれを選んでも強いよ！",
  },
  {
    emoji: "✨",
    title: "先生を倒してスキルゲット",
    body: `先生は全部で${BOSSES.length}人。倒すとその先生のスキルが手に入り、何度も倒すとスキルレベルが上がります（最大Lv.${MAX_SKILL_LEVEL}）。スキルは「装備」から${EQUIP_SLOTS}つまでセットできます。`,
  },
  {
    emoji: "🎤",
    title: `${STAGE_EVENT_HOUR}時はステージへ！`,
    body: "ステージイベントでは参加者全員でラスボスに挑みます。収集度が高いほど、全員で放つ必殺技の倍率が上がります。",
  },
];

type Props = {
  progress: Progress;
  stats: Stats;
  update: (fn: (p: Progress) => Progress) => void;
  onMap: () => void;
  onScan: () => void;
  onSignOut: () => void;
};

export default function Home({ progress, stats, update, onMap, onScan, onSignOut }: Props) {
  const [sheet, setSheet] = useState<"equip" | "menu" | null>(null);
  const [menuTab, setMenuTab] = useState<MenuTab>("dex");
  const [showTutorial, setShowTutorial] = useState(!progress.tutorialDone);
  const rate = collectionRate(progress);
  const activeTitle = TITLES.find((t) => t.id === progress.activeTitle);
  const remaining = BOSSES.filter((t) => !progress.defeated[t.id]).length;

  function closeTutorial() {
    setShowTutorial(false);
    if (!progress.tutorialDone) update((p) => ({ ...p, tutorialDone: true }));
  }

  return (
    <div className="home-screen home2">
      <header className="home2-top">
        <div className="home2-logo">
          <span className="home2-logo-mark" aria-hidden="true">✦</span>
          <strong>
            AR <span>SHOOTING</span>
          </strong>
        </div>
        <button className="round-btn" onClick={onMap}>
          <span aria-hidden="true">🗺️</span>
          <small>マップ</small>
        </button>
      </header>

      <main className="home2-main">
        <div className="home2-player">
          <span className="player-avatar" aria-hidden="true">🧑</span>
          <div className="player-details">
            <strong>{progress.nickname}</strong>
            <span className="player-title">{activeTitle ? titleName(activeTitle, progress) : "称号なし"}</span>
          </div>
          <div className="home2-wallet">
            <span>💰 {progress.gold.toLocaleString()}</span>
            <span>★ {progress.score.toLocaleString()}</span>
          </div>
        </div>

        <Countdown />

        <section className="teacher-board">
          <h2>先生をたおそう</h2>
          <div className="teacher-grid">
            {BOSSES.map((t) => {
              const level = skillLevel(progress.defeated[t.id] ?? 0);
              const equipped = progress.equipped.includes(t.id);
              return (
                <button
                  key={t.id}
                  className={`teacher-slot ${level ? "got" : ""} ${equipped ? "equipped" : ""}`}
                  onClick={() => setSheet("equip")}
                  disabled={!level}
                  aria-label={level ? `${t.name} スキルLv.${level}` : "まだ倒していない先生"}
                >
                  <span className="teacher-slot-face" aria-hidden="true">
                    {level ? t.emoji : "？"}
                  </span>
                  <small>{level ? t.subject : "？？"}</small>
                  {equipped && <em>装備中</em>}
                </button>
              );
            })}
          </div>
          <p className="teacher-remaining">
            {remaining > 0 ? (
              <>
                残り <strong>{remaining}</strong> 人
              </>
            ) : (
              "全員そろった！🎉"
            )}
          </p>

          <div className="home2-rate">
            <div className="summary-rate-heading">
              <span>収集度</span>
              <strong>{Math.round(rate * 100)}%</strong>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${rate * 100}%` }} />
            </div>
            <p>
              必殺技の倍率 <strong>×{finisherMultiplier(progress).toFixed(1)}</strong>
            </p>
          </div>
        </section>
      </main>

      <nav className="home2-dock">
        <button className="round-btn" onClick={() => setSheet("equip")}>
          <span aria-hidden="true">🛡️</span>
          <small>装備</small>
        </button>
        <button className="round-btn big" onClick={onScan}>
          <span aria-hidden="true">🔑</span>
          <small>合言葉</small>
        </button>
        <button className="round-btn" onClick={() => setSheet("menu")}>
          <span aria-hidden="true">☰</span>
          <small>メニュー</small>
        </button>
      </nav>

      {sheet && (
        <div className="modal-backdrop sheet-backdrop" onClick={() => setSheet(null)}>
          <div
            className="modal sheet"
            role="dialog"
            aria-modal="true"
            aria-label={sheet === "equip" ? "装備" : "メニュー"}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sheet-head">
              <h2>{sheet === "equip" ? "🛡️ 装備" : "☰ メニュー"}</h2>
              <button className="btn small" onClick={() => setSheet(null)}>
                閉じる
              </button>
            </div>

            {sheet === "equip" ? (
              <StatusTab progress={progress} stats={stats} update={update} />
            ) : (
              <>
                <nav
                  className="home-tabs"
                  role="tablist"
                  style={{ gridTemplateColumns: `repeat(${MENU_TABS.length}, 1fr)` }}
                >
                  {MENU_TABS.map((t) => (
                    <button
                      key={t.id}
                      role="tab"
                      aria-selected={menuTab === t.id}
                      className={`home-tab ${menuTab === t.id ? "active" : ""}`}
                      onClick={() => setMenuTab(t.id)}
                    >
                      {t.label}
                    </button>
                  ))}
                </nav>
                <div role="tabpanel">
                  {menuTab === "dex" && <DexTab progress={progress} />}
                  {menuTab === "bag" && <BagTab progress={progress} />}
                  {menuTab === "titles" && <TitlesTab progress={progress} update={update} />}
                  {menuTab === "ranking" && <RankingTab progress={progress} />}
                </div>
                <div className="sheet-footer">
                  <button
                    className="btn"
                    onClick={() => {
                      setSheet(null);
                      setShowTutorial(true);
                    }}
                  >
                    ❓ 遊び方
                  </button>
                  <button className="btn sign-out" onClick={onSignOut}>
                    データを消して最初から
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {showTutorial && <Tutorial onClose={closeTutorial} />}
    </div>
  );
}

function Countdown() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const event = new Date(now);
  event.setHours(STAGE_EVENT_HOUR, STAGE_EVENT_MINUTE, 0, 0);
  const remaining = event.getTime() - now.getTime();
  const label = `${STAGE_EVENT_HOUR}:${String(STAGE_EVENT_MINUTE).padStart(2, "0")}`;

  if (remaining <= 0) {
    return (
      <div className="countdown live">
        <span aria-hidden="true">🎤</span>
        ステージイベント開催中！ステージに集まろう
      </div>
    );
  }

  const totalSeconds = Math.floor(remaining / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="countdown">
      <span>{label} ステージイベントまで</span>
      <strong>
        {h}:{pad(m)}:{pad(s)}
      </strong>
    </div>
  );
}

function formatStat(key: keyof Stats, value: number) {
  if (key === "dodgeCooldownMs") return `${(value / 1000).toFixed(1)}秒`;
  if (key === "goldBonus" || key === "rareBonus") return `+${value}%`;
  return String(value);
}

function StatusTab({
  progress,
  stats,
  update,
}: {
  progress: Progress;
  stats: Stats;
  update: Props["update"];
}) {
  return (
    <>
      <h3>ステータス</h3>
      <dl className="stat-list">
        {(Object.keys(STAT_LABELS) as (keyof Stats)[]).map((key) => (
          <div key={key} className={stats[key] !== BASE_STATS[key] ? "boosted" : ""}>
            <dt>{STAT_LABELS[key]}</dt>
            <dd>{formatStat(key, stats[key])}</dd>
          </div>
        ))}
      </dl>

      <h3>装備品</h3>
      <ul className="teacher-list">
        {GEAR.map((g) => {
          const tier = progress.gear[g.id];
          if (!tier) {
            return (
              <li key={g.id} className="teacher locked">
                <span className="teacher-emoji" aria-hidden="true">？</span>
                <div>
                  <strong>？？？</strong>
                  <span>先生を倒すと手に入るかも</span>
                </div>
              </li>
            );
          }
          const equipped = progress.equippedGear === g.id;
          return (
            <li key={g.id} className={`teacher ${equipped ? "equipped" : ""}`}>
              <span className="teacher-emoji" aria-hidden="true">{g.emoji}</span>
              <div>
                <strong>
                  {g.name} {tier === "lite" && <small>ライト版</small>}
                </strong>
                <span className="teacher-cost">{boostText(g.boost[tier])}</span>
              </div>
              <div className="teacher-buttons">
                <button
                  className={`btn small ${equipped ? "" : "primary"}`}
                  onClick={() => update(equipGear(g.id))}
                >
                  {equipped ? "外す" : "装備"}
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <h3>
        スキル（セット {progress.equipped.length}/{EQUIP_SLOTS}）
      </h3>
      <ul className="teacher-list">
        {BOSSES.map((t) => {
          const wins = progress.defeated[t.id] ?? 0;
          const level = skillLevel(wins);
          if (!level) {
            return (
              <li key={t.id} className="teacher locked">
                <span className="teacher-emoji" aria-hidden="true">？</span>
                <div>
                  <strong>？？？</strong>
                  <span>先生を倒すと手に入る</span>
                </div>
              </li>
            );
          }
          const equipped = progress.equipped.includes(t.id);
          const toNext = winsToNextLevel(wins);
          return (
            <li key={t.id} className={`teacher ${equipped ? "equipped" : ""}`}>
              <span className="teacher-emoji" aria-hidden="true">{t.emoji}</span>
              <div>
                <strong>
                  {t.skill.name} <small>Lv.{level}{level >= MAX_SKILL_LEVEL ? " MAX" : ""}</small>
                </strong>
                <span>
                  {t.name}：{t.skill.description}
                </span>
                <span className="teacher-cost">
                  {boostText(
                    Object.fromEntries(
                      Object.entries(t.skill.boostPerLevel).map(([k, v]) => [k, (v ?? 0) * level])
                    )
                  )}
                  {toNext !== null && `（あと${toNext}回でLv.${level + 1}）`}
                </span>
              </div>
              <div className="teacher-buttons">
                <button
                  className={`btn small ${equipped ? "" : "primary"}`}
                  onClick={() => update(toggleEquip(t.id))}
                  disabled={!equipped && progress.equipped.length >= EQUIP_SLOTS}
                >
                  {equipped ? "外す" : "セット"}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}

function speak(text: string) {
  // Placeholder until recorded voice lines are ready: read the line with speech synthesis
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ja-JP";
  window.speechSynthesis.speak(utterance);
}

function DexTab({ progress }: { progress: Progress }) {
  const [open, setOpen] = useState<BossDef | null>(null);
  const found = BOSSES.filter((b) => progress.defeated[b.id]).length;

  return (
    <>
      <h3>
        先生図鑑 {found}/{BOSSES.length}
      </h3>
      {/* Tile grid: tap a defeated teacher to open their card. Met-but-unbeaten teachers
          show as a silhouette; unmet ones as "?". Stars = skill level. */}
      <div className="dex-tiles">
        {BOSSES.map((b, i) => {
          const wins = progress.defeated[b.id] ?? 0;
          const seen = progress.seen.includes(b.id);
          const level = skillLevel(wins);
          const state = wins ? "caught" : seen ? "seen" : "unknown";
          return (
            <button
              key={b.id}
              className={`dex-tile ${state}`}
              style={{ "--h": b.hue ?? 230 } as CSSProperties}
              onClick={() => wins && setOpen(b)}
              disabled={!wins}
              aria-label={wins ? `${b.name}のカードを見る` : seen ? "まだ倒していない先生" : "まだ会っていない先生"}
            >
              <span className="dex-tile-art">
                <span className="dex-tile-no">{String(i + 1).padStart(3, "0")}</span>
                {state !== "unknown" && b.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={b.image} alt="" draggable={false} />
                ) : (
                  <span className="dex-tile-glyph" aria-hidden="true">
                    {state === "unknown" ? "？" : b.emoji}
                  </span>
                )}
              </span>
              <span className="dex-tile-stars" aria-hidden="true">
                {Array.from({ length: MAX_SKILL_LEVEL }, (_, k) => (k < level ? "★" : "☆")).join("")}
              </span>
            </button>
          );
        })}
      </div>

      {open && (
        <div className="modal-backdrop" onClick={() => setOpen(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            {open.card ? (
              <button className="dex-card" onClick={() => speak(open.voice)}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={open.card} alt={`${open.name}の図鑑カード`} />
                <small>タッチでボイス 🔊</small>
              </button>
            ) : (
              <button className="dex-portrait" onClick={() => speak(open.voice)}>
                <span aria-hidden="true">{open.emoji}</span>
                <small>タッチでボイス 🔊</small>
              </button>
            )}
            {/* The card already shows the name and 生態メモ */}
            {!open.card && <h3>{open.name}</h3>}
            <p className="dex-voice">「{open.voice}」</p>
            {!open.card && <p>{open.description}</p>}
            <dl className="stat-list">
              <div>
                <dt>HP</dt>
                <dd>{open.hp}</dd>
              </div>
              <div>
                <dt>撃破数</dt>
                <dd>{progress.defeated[open.id]}</dd>
              </div>
              <div>
                <dt>スキル</dt>
                <dd>
                  {open.skill.name} Lv.{skillLevel(progress.defeated[open.id] ?? 0)}
                </dd>
              </div>
            </dl>
            <button className="btn primary" onClick={() => setOpen(null)}>
              閉じる
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function BagTab({ progress }: { progress: Progress }) {
  return (
    <>
      <h3>
        アイテム {ITEMS.filter((i) => progress.items[i.id]).length}/{ITEMS.length}
      </h3>
      <ul className="bag-list">
        {ITEMS.map((item) => {
          const count = progress.items[item.id] ?? 0;
          return (
            <li key={item.id} className={count ? `rarity-${item.rarity}` : "locked"}>
              <span aria-hidden="true">{count ? item.emoji : "？"}</span>
              <span>
                {count ? item.name : "？？？"}
                {count > 0 && <small>{item.description}</small>}
              </span>
              <span className="rarity-badge">{item.rarity}</span>
              <strong>{count ? `×${count}` : ""}</strong>
            </li>
          );
        })}
      </ul>
    </>
  );
}

// The ranking stays secret until staff switch to the results phase (ResultsScreen in
// final-stage.tsx). This tab never fetches the leaderboard; it only shows your own score.
function RankingTab({ progress }: { progress: Progress }) {
  return (
    <>
      <h3>スコアランキング</h3>
      <div className="ranking-locked">
        <span className="ranking-locked-icon" aria-hidden="true">
          🔒
        </span>
        <strong>ランキングは最後の結果発表で公開！</strong>
        <p>だれが1位になるかは、ステージイベントのあとまでヒミツです。</p>
        <div className="ranking-locked-score">
          <span>あなたのスコア</span>
          <strong>★ {progress.score.toLocaleString()} pt</strong>
        </div>
      </div>
    </>
  );
}

function TitlesTab({ progress, update }: { progress: Progress; update: Props["update"] }) {
  return (
    <>
      <h3>
        称号 {TITLES.filter((t) => progress.titles.includes(t.id)).length}/{TITLES.length}
      </h3>
      <ul className="title-list">
        {TITLES.map((t) => {
          const owned = progress.titles.includes(t.id);
          const active = progress.activeTitle === t.id;
          return (
            <li key={t.id} className={owned ? (active ? "active" : "") : "locked"}>
              <div>
                <strong>{owned ? titleName(t, progress) : "？？？"}</strong>
                <span>{t.description}</span>
              </div>
              {owned && (
                <button
                  className={`btn small ${active ? "" : "primary"}`}
                  onClick={() =>
                    update((p) => ({ ...p, activeTitle: active ? null : t.id }))
                  }
                >
                  {active ? "外す" : "つける"}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}

function Tutorial({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const current = TUTORIAL_STEPS[step];
  const last = step === TUTORIAL_STEPS.length - 1;

  return (
    <div className="modal-backdrop">
      <div className="modal tutorial" role="dialog" aria-modal="true" aria-label="遊び方">
        <span className="tutorial-emoji" aria-hidden="true">{current.emoji}</span>
        <h3>{current.title}</h3>
        <p>{current.body}</p>
        <div className="tutorial-dots" aria-hidden="true">
          {TUTORIAL_STEPS.map((_, i) => (
            <span key={i} className={i === step ? "active" : ""} />
          ))}
        </div>
        <div className="tutorial-buttons">
          {step > 0 ? (
            <button className="btn" onClick={() => setStep(step - 1)}>
              戻る
            </button>
          ) : (
            <button className="btn" onClick={onClose}>
              スキップ
            </button>
          )}
          <button
            className="btn primary"
            onClick={() => (last ? onClose() : setStep(step + 1))}
          >
            {last ? "はじめる" : "次へ"}
          </button>
        </div>
      </div>
    </div>
  );
}
