"use client";

import { useEffect, useState } from "react";
import type { Progress, Stats } from "./game-data";
import { RankEntry, getLeaderboard, playfabEnabled } from "./playfab";
import { collectionRate, finisherMultiplier } from "./progress";

// Shown to every phone once staff start the final boss.
// The shared battle itself comes next; for now this shows what the player brings into it.
export function FinalBossScreen({ progress, stats }: { progress: Progress; stats: Stats }) {
  const rate = Math.round(collectionRate(progress) * 100);
  const multiplier = finisherMultiplier(progress).toFixed(1);

  return (
    <main className="center-screen">
      <div className="card">
        <h1>😈 大ボス戦</h1>
        <p className="sub">ステージイベントが始まりました！ステージに注目してください。</p>
        <ul className="stat-list">
          <li>
            <span className="stat-label">プレイヤー</span> {progress.nickname}
          </li>
          <li>
            <span className="stat-label">攻撃力</span> {stats.attack}
          </li>
          <li>
            <span className="stat-label">収集度</span> {rate}%
          </li>
          <li>
            <span className="stat-label">必殺技倍率</span> ×{multiplier}
          </li>
        </ul>
      </div>
    </main>
  );
}

export function ResultsScreen({ progress }: { progress: Progress }) {
  const [ranking, setRanking] = useState<RankEntry[] | null>(null);

  useEffect(() => {
    if (!playfabEnabled) return;
    getLeaderboard(10)
      .then(setRanking)
      .catch((e) => {
        console.warn("Leaderboard fetch failed", e);
        setRanking([]);
      });
  }, []);

  return (
    <main className="center-screen">
      <div className="card">
        <h1>🏆 結果発表</h1>
        <p className="sub">
          {progress.nickname} さんのスコア：<strong>{progress.score.toLocaleString()} pt</strong>
        </p>
        {playfabEnabled && (
          <ol className="stat-list">
            {ranking === null && <li>ランキングを読み込み中...</li>}
            {ranking?.length === 0 && <li>ランキングを表示できません。</li>}
            {ranking?.map((r) => (
              <li key={r.position}>
                {r.me ? <strong>{r.position}位 {r.name}</strong> : `${r.position}位 ${r.name}`}
                {" — "}
                {r.score.toLocaleString()} pt
              </li>
            ))}
          </ol>
        )}
        <p className="sub">ご参加ありがとうございました！</p>
      </div>
    </main>
  );
}
