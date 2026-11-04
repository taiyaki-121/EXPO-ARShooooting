"use client";

import { useEffect, useState } from "react";
import {
  BASE_STATS,
  BOSSES,
  BossDef,
  EQUIP_SLOTS,
  ITEMS,
  MATERIALS,
  MAX_TEACHER_LEVEL,
  MaterialId,
  Progress,
  STAGE_EVENT_HOUR,
  STAGE_EVENT_MINUTE,
  STAT_LABELS,
  Stats,
  TEACHERS,
  TITLES,
  levelUpCost,
} from "./game-data";
import {
  canLevelUp,
  collectionRate,
  finisherMultiplier,
  levelUpTeacher,
  toggleEquip,
} from "./progress";
import { RankEntry, getLeaderboard, playfabEnabled } from "./playfab";

type Tab = "status" | "dex" | "bag" | "titles" | "ranking";

const TABS: { id: Tab; label: string }[] = [
  { id: "status", label: "装備" },
  { id: "dex", label: "図鑑" },
  { id: "bag", label: "バッグ" },
  { id: "titles", label: "称号" },
  ...(playfabEnabled ? [{ id: "ranking" as const, label: "順位" }] : []),
];

const TUTORIAL_STEPS = [
  {
    emoji: "📷",
    title: "QRコードを読み込もう",
    body: "会場のあちこちにQRコードがあります。ホームの「QR読込」から読み込むと、小ボスが現れたり先生が仲間になったりします。",
  },
  {
    emoji: "🗺️",
    title: "マップで小ボスを探そう",
    body: "「マップ」から周りにいる小ボスを選んでバトル。攻撃ボタンで攻撃、回避ボタンで敵の攻撃をかわします。",
  },
  {
    emoji: "🎒",
    title: "集めて強くなろう",
    body: "小ボスを倒すとゴールド・素材・アイテムが手に入ります。レアアイテムも落とすかも！図鑑や称号も集めましょう。",
  },
  {
    emoji: "🧑‍🏫",
    title: "先生を装備しよう",
    body: `仲間になった先生は最大${EQUIP_SLOTS}人まで装備でき、ステータスが上がります。ゴールドと素材で先生を強化できます。`,
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
  const [tab, setTab] = useState<Tab>("status");
  const [showTutorial, setShowTutorial] = useState(!progress.tutorialDone);
  const rate = collectionRate(progress);
  const activeTitle = TITLES.find((t) => t.id === progress.activeTitle);

  function closeTutorial() {
    setShowTutorial(false);
    if (!progress.tutorialDone) update((p) => ({ ...p, tutorialDone: true }));
  }

  return (
    <div className="home-screen">
      <header className="map-header">
        <div className="map-brand">
          <span className="brand-mark" aria-hidden="true">✦</span>
          <div>
            <strong>AR BOSS SHOOTING</strong>
            <span>個人チャレンジ</span>
          </div>
        </div>
        <div className="map-player">
          <span className="player-avatar" aria-hidden="true">🧑</span>
          <div className="player-details">
            <strong>{progress.nickname}</strong>
            <span className="player-title">{activeTitle?.name ?? "称号なし"}</span>
          </div>
        </div>
        <button
          className="btn exit-button"
          onClick={() => setShowTutorial(true)}
          aria-label="遊び方"
        >
          ？
        </button>
      </header>

      <main className="home-main">
        <Countdown />

        <section className="home-card summary-card">
          <div className="summary-rate">
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
          <div className="summary-stats">
            <div>
              <span className="stat-label">ゴールド</span>
              <strong>💰 {progress.gold.toLocaleString()}</strong>
            </div>
            <div>
              <span className="stat-label">スコア</span>
              <strong>★ {progress.score.toLocaleString()}</strong>
            </div>
          </div>
        </section>

        <div className="home-actions">
          <button className="btn primary home-action" onClick={onMap}>
            <span aria-hidden="true">🗺️</span>
            マップ
          </button>
          <button className="btn primary home-action scan-action" onClick={onScan}>
            <span aria-hidden="true">📷</span>
            QR読込
          </button>
        </div>

        <nav
          className="home-tabs"
          role="tablist"
          style={{ gridTemplateColumns: `repeat(${TABS.length}, 1fr)` }}
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              className={`home-tab ${tab === t.id ? "active" : ""}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <section className="home-card tab-panel" role="tabpanel">
          {tab === "status" && <StatusTab progress={progress} stats={stats} update={update} />}
          {tab === "dex" && <DexTab progress={progress} />}
          {tab === "bag" && <BagTab progress={progress} />}
          {tab === "titles" && <TitlesTab progress={progress} update={update} />}
          {tab === "ranking" && <RankingTab />}
        </section>

        <button className="btn sign-out" onClick={onSignOut}>
          データを消して最初から
        </button>
      </main>

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

      <h3>
        先生（装備 {progress.equipped.length}/{EQUIP_SLOTS}）
      </h3>
      <ul className="teacher-list">
        {TEACHERS.map((t) => {
          const level = progress.teachers[t.id];
          if (!level) {
            return (
              <li key={t.id} className="teacher locked">
                <span className="teacher-emoji" aria-hidden="true">？</span>
                <div>
                  <strong>？？？の先生</strong>
                  <span>会場のQRコードで仲間にしよう</span>
                </div>
              </li>
            );
          }
          const equipped = progress.equipped.includes(t.id);
          const cost = levelUpCost(level);
          const material = MATERIALS[t.material];
          return (
            <li key={t.id} className={`teacher ${equipped ? "equipped" : ""}`}>
              <span className="teacher-emoji" aria-hidden="true">{t.emoji}</span>
              <div>
                <strong>
                  {t.name} <small>Lv.{level}</small>
                </strong>
                <span>{t.description}</span>
                {level < MAX_TEACHER_LEVEL && (
                  <span className="teacher-cost">
                    強化：💰{cost.gold} ・ {material.emoji}
                    {material.name}×{cost.materials}
                  </span>
                )}
              </div>
              <div className="teacher-buttons">
                <button
                  className={`btn small ${equipped ? "" : "primary"}`}
                  onClick={() => update(toggleEquip(t.id))}
                  disabled={!equipped && progress.equipped.length >= EQUIP_SLOTS}
                >
                  {equipped ? "外す" : "装備"}
                </button>
                <button
                  className="btn small"
                  onClick={() => update(levelUpTeacher(t.id))}
                  disabled={!canLevelUp(progress, t.id)}
                >
                  {level >= MAX_TEACHER_LEVEL ? "MAX" : "強化"}
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
        小ボス図鑑 {found}/{BOSSES.length}
      </h3>
      <div className="dex-grid">
        {BOSSES.map((b, i) => {
          const wins = progress.defeated[b.id] ?? 0;
          const seen = progress.seen.includes(b.id);
          return (
            <button
              key={b.id}
              className={`dex-cell ${wins ? "caught" : seen ? "seen" : ""}`}
              onClick={() => wins && setOpen(b)}
              disabled={!wins}
            >
              <span className="dex-no">No.{String(i + 1).padStart(2, "0")}</span>
              <span className="dex-emoji" aria-hidden="true">
                {wins ? b.emoji : seen ? "❔" : "？"}
              </span>
              <span className="dex-name">{seen ? b.name : "？？？"}</span>
              {wins > 0 && <span className="dex-wins">撃破 {wins}</span>}
            </button>
          );
        })}
      </div>

      {open && (
        <div className="modal-backdrop" onClick={() => setOpen(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="dex-portrait" onClick={() => speak(open.voice)}>
              <span aria-hidden="true">{open.emoji}</span>
              <small>タッチでボイス 🔊</small>
            </button>
            <h3>{open.name}</h3>
            <p className="dex-voice">「{open.voice}」</p>
            <p>{open.description}</p>
            <dl className="stat-list">
              <div>
                <dt>HP</dt>
                <dd>{open.hp}</dd>
              </div>
              <div>
                <dt>落とす素材</dt>
                <dd>
                  {MATERIALS[open.material].emoji} {MATERIALS[open.material].name}
                </dd>
              </div>
              <div>
                <dt>撃破数</dt>
                <dd>{progress.defeated[open.id]}</dd>
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
      <h3>素材</h3>
      <ul className="bag-list">
        {(Object.keys(MATERIALS) as MaterialId[]).map((id) => (
          <li key={id}>
            <span aria-hidden="true">{MATERIALS[id].emoji}</span>
            <span>{MATERIALS[id].name}</span>
            <strong>×{progress.materials[id] ?? 0}</strong>
          </li>
        ))}
      </ul>

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

function RankingTab() {
  const [entries, setEntries] = useState<RankEntry[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    getLeaderboard()
      .then(setEntries)
      .catch(() => setFailed(true));
  }, []);

  return (
    <>
      <h3>スコアランキング</h3>
      {failed ? (
        <p className="error">ランキングを読み込めませんでした。</p>
      ) : !entries ? (
        <p>読み込み中...</p>
      ) : entries.length === 0 ? (
        <p>まだ記録がありません。</p>
      ) : (
        <ol className="title-list">
          {entries.map((e) => (
            <li key={e.position} className={e.me ? "active" : ""}>
              <strong>{e.position}位</strong>
              <div>
                <strong>{e.name}</strong>
              </div>
              <strong>★ {e.score.toLocaleString()}</strong>
            </li>
          ))}
        </ol>
      )}
    </>
  );
}

function TitlesTab({ progress, update }: { progress: Progress; update: Props["update"] }) {
  return (
    <>
      <h3>
        称号 {progress.titles.length}/{TITLES.length}
      </h3>
      <ul className="title-list">
        {TITLES.map((t) => {
          const owned = progress.titles.includes(t.id);
          const active = progress.activeTitle === t.id;
          return (
            <li key={t.id} className={owned ? (active ? "active" : "") : "locked"}>
              <div>
                <strong>{owned ? t.name : "？？？"}</strong>
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
