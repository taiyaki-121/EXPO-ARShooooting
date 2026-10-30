"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useBattle } from "./use-battle";

type Screen = "name" | "lobby" | "battle" | "defeat" | "victory";

const DEMO_PASSPHRASE = "HOSHI";

export default function Home() {
  const [screen, setScreen] = useState<Screen>("name");
  const [nickname, setNickname] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [error, setError] = useState("");
  const {
    playerHp,
    enemyHp,
    dodging,
    dodgeReady,
    cooldownSeconds,
    attackEnemy,
    evade,
    reset: resetBattle,
  } = useBattle(screen === "battle");

  const visibleScreen = screen === "battle" && playerHp === 0
    ? "defeat"
    : screen === "battle" && enemyHp === 0
      ? "victory"
      : screen;

  function submitNickname(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = nickname.trim();
    const length = Array.from(name).length;

    if (length < 2 || length > 12) {
      setError("ニックネームは2〜12文字で入力してください。");
      return;
    }

    setNickname(name);
    setError("");
    setScreen("lobby");
  }

  function joinGame(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (passphrase.trim().toLocaleUpperCase() !== DEMO_PASSPHRASE) {
      setError("合言葉が違うようです。もう一度確認してください。");
      return;
    }

    setError("");
    startBattle();
  }

  function startBattle() {
    resetBattle();
    setScreen("battle");
  }

  function returnToMenu() {
    resetBattle();
    setPassphrase("");
    setError("");
    setScreen("lobby");
  }

  return (
    <main className="game-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <header className="topbar">
        <a className="brand" href="/" aria-label="STARFALL ホーム">
          <span className="brand-mark">✳</span>
          <span>STARFALL</span>
        </a>
        <span className="topbar-label">
          <span className="live-dot" />
          TEAM ARENA <span className="topbar-divider">/</span> BROWSER DEMO
        </span>
      </header>

      <div className="content">
        {visibleScreen === "name" && (
          <section className="welcome-card">
            <div className="eyebrow"><span>01</span> PILOT REGISTRATION</div>
            <div className="hero-emblem" aria-hidden="true">
              <span className="emblem-orbit orbit-one" />
              <span className="emblem-orbit orbit-two" />
              <span className="emblem-star">✳</span>
              <span className="emblem-spark spark-one">✦</span>
              <span className="emblem-spark spark-two">·</span>
            </div>
            <h1>戦場へ、<span>ようこそ。</span></h1>
            <p className="intro-copy">
              仲間と作戦を立てて、星のアリーナへ出撃しよう。
              <br />まずはパイロット名を登録してください。
            </p>
            <form className="form-panel" onSubmit={submitNickname}>
              <label className="field-label" htmlFor="nickname">PILOT NAME <span>ニックネーム</span></label>
              <input
                autoComplete="nickname"
                id="nickname"
                maxLength={24}
                onChange={(event) => {
                  setNickname(event.target.value);
                  setError("");
                }}
                placeholder="例：ほしの たろう"
                value={nickname}
              />
              <div className="field-hint">2〜12文字で入力してください</div>
              {error && <p className="form-error" role="alert">{error}</p>}
              <button className="primary-button" type="submit">
                <span>ゲームをはじめる</span><span aria-hidden="true">↗</span>
              </button>
            </form>
            <p className="privacy-note"><span>✦</span> 登録した名前はこのデモ内でのみ使用します</p>
          </section>
        )}

        {visibleScreen === "lobby" && (
          <section className="lobby-layout">
            <div className="lobby-copy">
              <div className="eyebrow"><span>02</span> MISSION BRIEFING</div>
              <p className="welcome-back">WELCOME ABOARD, <span>{nickname}</span></p>
              <h1>仲間と合流して<br /><span>出撃しよう。</span></h1>
              <p className="intro-copy">チームの合言葉を入力して、アリーナに参加してください。</p>
              <form className="form-panel lobby-form" onSubmit={joinGame}>
                <label className="field-label" htmlFor="passphrase">SQUAD PASSPHRASE <span>合言葉</span></label>
                <input
                  autoComplete="off"
                  id="passphrase"
                  onChange={(event) => {
                    setPassphrase(event.target.value);
                    setError("");
                  }}
                  placeholder="合言葉を入力"
                  value={passphrase}
                />
                <div className="field-hint">デモ用の合言葉：<strong>HOSHI</strong></div>
                {error && <p className="form-error" role="alert">{error}</p>}
                <button className="primary-button" type="submit">
                  <span>チームに参加する</span><span aria-hidden="true">↗</span>
                </button>
              </form>
              <button className="text-button" onClick={() => { setError(""); setScreen("name"); }} type="button">
                ← パイロット名を変更する
              </button>
            </div>
            <div className="mission-card">
              <div className="mission-card-top"><span>LIVE MISSION</span><span className="mission-status"><i /> OPEN</span></div>
              <div className="planet-scene" aria-hidden="true">
                <div className="planet-glow" />
                <div className="planet"><div className="planet-ring" /></div>
                <span className="scene-star star-a">✦</span><span className="scene-star star-b">·</span>
                <span className="scene-star star-c">✧</span><span className="scene-star star-d">·</span>
              </div>
              <div className="mission-info">
                <span className="mission-kicker">SECTOR 07 · DEEP SPACE</span>
                <h2>星影のアリーナ</h2>
                <p>未知のモンスターを撃退せよ</p>
                <div className="mission-meta"><span>◉ TRAINING</span><span>◷ 約2分</span></div>
              </div>
            </div>
          </section>
        )}

        {visibleScreen === "battle" && (
          <section className="battle-layout">
            <div className="battle-heading">
              <div>
                <div className="eyebrow"><span>03</span> BATTLE IN PROGRESS</div>
                <h1>星影のアリーナ</h1>
                <p className="battle-subtitle">パイロット <strong>{nickname}</strong> <span>·</span> 敵をタップして攻撃</p>
              </div>
              <div className="battle-badge"><i /> LIVE BATTLE</div>
            </div>
            <div className="arena">
              <div className="arena-grid" />
              <div className="arena-stars" aria-hidden="true">·　　✦　　　·　✧　　·　　✦　　·</div>
              <div className="enemy-status">
                <div className="hp-label"><span>VOID SLIME <small>LV. 01</small></span><strong>{enemyHp}<small> / 100</small></strong></div>
                <div className="hp-track enemy-track"><div style={{ width: `${enemyHp}%` }} /></div>
              </div>
              <button
                aria-label={`敵をタップして攻撃。敵HP ${enemyHp}`}
                className={`enemy ${enemyHp <= 35 ? "enemy-hit" : ""}`}
                disabled={enemyHp === 0}
                onClick={() => attackEnemy(35)}
                type="button"
              >
                <span className="enemy-face"><i /><i /></span>
                <span className="enemy-shadow" />
                <span className="tap-prompt">TAP TO ATTACK</span>
              </button>
              <div className={`dodge-flash ${dodging ? "dodge-active" : ""}`} />
              <div className="arena-floor" />
              <div className="player-avatar"><span>✦</span></div>
              <div className="player-caption">{nickname}<span>YOUR SHIP</span></div>
              {dodging && <div className="dodge-label">DODGE!</div>}
              <div className="arena-tip"><span>✦</span> 敵をタップして攻撃 / 必中攻撃で確実にダメージ</div>
            </div>
            <div className="battle-controls">
              <div className="player-health">
                <div className="hp-label"><span>YOUR HP <small>パイロット</small></span><strong>{playerHp}<small> / 100</small></strong></div>
                <div className="hp-track player-track"><div style={{ width: `${playerHp}%` }} /></div>
              </div>
              <button className="attack-button" disabled={enemyHp === 0} onClick={() => attackEnemy(25)} type="button">
                <span className="button-icon">✦</span><span><strong>必中攻撃</strong><small>GUARANTEED HIT · −25 HP</small></span><span className="button-arrow">↗</span>
              </button>
              <button className={`dodge-button ${!dodgeReady ? "on-cooldown" : ""}`} disabled={!dodgeReady} onClick={evade} type="button">
                <span className="button-icon">◈</span><span><strong>{dodgeReady ? "回避する" : `回避クールダウン ${cooldownSeconds}秒`}</strong><small>0.9秒間 無敵</small></span>
              </button>
            </div>
            <p className="battle-footnote">敵の攻撃は1.2秒ごとに発生します。回避のタイミングを見極めよう。</p>
          </section>
        )}

        {visibleScreen === "defeat" && (
          <section className="defeat-card">
            <div className="defeat-icon">✦</div>
            <div className="eyebrow"><span>MISSION END</span></div>
            <h1>今回はここまで。</h1>
            <p className="intro-copy">{nickname}、おつかれさま。<br />態勢を整えて、もう一度挑戦しよう。</p>
            <div className="result-row"><span>敵に与えたダメージ</span><strong>{100 - enemyHp} <small>DMG</small></strong></div>
            <button className="primary-button" onClick={returnToMenu} type="button">
              <span>メニューに戻る</span><span aria-hidden="true">↗</span>
            </button>
          </section>
        )}

        {visibleScreen === "victory" && (
          <section className="defeat-card victory-card">
            <div className="defeat-icon">✦</div>
            <div className="eyebrow"><span>MISSION CLEAR</span></div>
            <h1>勝利おめでとう！</h1>
            <p className="intro-copy">{nickname}の攻撃でモンスターを撃退した。<br />チームの勝利です！</p>
            <div className="result-row"><span>敵に与えたダメージ</span><strong>100 <small>DMG</small></strong></div>
            <button className="primary-button" onClick={returnToMenu} type="button">
              <span>メニューに戻る</span><span aria-hidden="true">↗</span>
            </button>
          </section>
        )}
      </div>

      <footer className="footer">
        <span>STARFALL <span className="footer-dot">·</span> TEAM ARENA</span>
        <span>BUILT FOR YOUR NEXT ADVENTURE</span>
      </footer>
    </main>
  );
}
