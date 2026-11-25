"use client";

import { useEffect, useRef, useState } from "react";
import {
  BossDef,
  GEAR,
  ITEMS,
  MAX_SKILL_LEVEL,
  Progress,
  Stats,
  skillLevel,
} from "./game-data";
import { Drops, rollDrops } from "./progress";
import TeacherModel from "./teacher-model";
import { useBattle } from "./use-battle";

export default function Battle({
  monster,
  progress,
  stats,
  onFinish,
}: {
  monster: BossDef;
  progress: Progress;
  stats: Stats;
  onFinish: (drops: Drops | null) => void;
}) {
  const { nickname, score } = progress;
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [drops, setDrops] = useState<Drops | null>(null);
  const battle = useBattle(monster.hp, stats, monster.attackPercent);
  const won = battle.status === "won";
  const reward = monster.hp * 10;
  // progress only updates after もどる, so these describe the state before this win
  const winsBefore = progress.defeated[monster.id] ?? 0;
  const levelBefore = skillLevel(winsBefore);
  const levelAfter = skillLevel(winsBefore + 1);

  useEffect(() => {
    if (won) setDrops((d) => d ?? rollDrops(monster, stats, progress));
  }, [won, monster, stats, progress]);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;

    async function startCamera() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError("このブラウザではカメラを利用できません。");
        return;
      }
      try {
        // Prefer the rear camera on phones
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
      } catch {
        try {
          // Fall back to any available (e.g. PC webcam)
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        } catch {
          setCameraError("カメラを利用できません。カメラなしでバトルできます。");
          return;
        }
      }
      if (cancelled) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    }

    startCamera();
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const monsterPct = (battle.monsterHp / battle.monsterMaxHp) * 100;
  const playerPct = (battle.playerHp / battle.playerMaxHp) * 100;

  return (
    <div className="battle-screen">
      <video ref={videoRef} className="battle-video" playsInline muted />
      <div className="battle-shade" />
      {cameraError && <div className="camera-error">{cameraError}</div>}

      <div className="battle-hud">
        <div className="battle-score">
          <span>スコア</span>
          <strong>{score.toLocaleString()} <small>pt</small></strong>
        </div>
        <div className="hp-block">
          <div className="hp-heading">
            <span className="hp-badge monster-badge" aria-hidden="true">
              {monster.emoji}
            </span>
            <div className="hp-label">
              <strong>{monster.name}</strong>
              <span>
                {battle.monsterHp} / {battle.monsterMaxHp} HP
              </span>
            </div>
          </div>
          <div className="hp-bar">
            <div className="hp-fill monster" style={{ width: `${monsterPct}%` }} />
          </div>
        </div>
        <div className="hp-block">
          <div className="hp-heading">
            <span className="hp-badge player-badge" aria-hidden="true">
              🧑
            </span>
            <div className="hp-label">
              <strong>{nickname}</strong>
              <span>
                {battle.playerHp} / {battle.playerMaxHp} HP
              </span>
            </div>
          </div>
          <div className="hp-bar">
            <div className="hp-fill player" style={{ width: `${playerPct}%` }} />
          </div>
        </div>
      </div>

      <TeacherModel boss={monster} dodging={battle.dodging} />

      <div className="battle-message">{battle.message}</div>

      {battle.status === "fighting" ? (
        <div className="battle-controls">
          <button
            className="btn attack"
            onClick={battle.attack}
            disabled={!battle.attackReady}
          >
            ⚔️ 攻撃
          </button>
          <button
            className="btn dodge"
            onClick={battle.dodge}
            disabled={!battle.dodgeReady}
          >
            💨 回避
          </button>
        </div>
      ) : (
        <div className="result-overlay">
          <h2>{won ? "🎉 勝利！" : "💀 敗北..."}</h2>
          <p>
            {won
              ? `${monster.name}を倒した！ +${reward} pt`
              : `${monster.name}に負けてしまった。`}
          </p>
          {won && drops && (
            <ul className="drop-list">
              {levelAfter > levelBefore && (
                <li className="rarity-SR">
                  <span aria-hidden="true">✨</span>
                  {levelBefore === 0
                    ? `スキル「${monster.skill.name}」をゲット！`
                    : `「${monster.skill.name}」が Lv.${levelAfter}${levelAfter >= MAX_SKILL_LEVEL ? "（MAX）" : ""} に上がった！`}
                </li>
              )}
              {drops.gear && (() => {
                const gear = GEAR.find((g) => g.id === drops.gear)!;
                return (
                  <li className="rarity-R">
                    <span aria-hidden="true">{gear.emoji}</span> {gear.name}（ライト版）
                    <span className="rarity-badge">装備</span>
                  </li>
                );
              })()}
              <li>
                <span aria-hidden="true">💰</span> {drops.gold} G
              </li>
              {drops.items.map((id) => {
                const item = ITEMS.find((i) => i.id === id)!;
                return (
                  <li key={id} className={`rarity-${item.rarity}`}>
                    <span aria-hidden="true">{item.emoji}</span> {item.name}
                    <span className="rarity-badge">{item.rarity}</span>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="result-score">
            <span>スコア</span>
            <strong>{(score + (won ? reward : 0)).toLocaleString()} pt</strong>
          </div>
          <div className="result-buttons">
            {battle.status === "lost" && (
              <button className="btn" onClick={battle.reset}>
                もう一度
              </button>
            )}
            <button
              className="btn primary"
              onClick={() => onFinish(won ? drops : null)}
              disabled={won && !drops}
            >
              もどる
            </button>
          </div>
        </div>
      )}
    </div>
  );
}