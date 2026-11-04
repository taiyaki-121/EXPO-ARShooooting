"use client";

import { FormEvent, useState } from "react";
import { PlayFabError } from "./playfab";

// Demo passphrase (visible in front-end code — not for production auth)
const DEMO_PASSPHRASE = "CIDEXPO";

// The venue QR code opens the site with ?join=<passphrase>, so it is pre-filled
function passphraseFromUrl() {
  return new URLSearchParams(window.location.search).get("join") ?? "";
}

export default function Entry({ onJoin }: { onJoin: (nickname: string) => Promise<void> }) {
  const [nickname, setNickname] = useState("");
  const [passphrase, setPassphrase] = useState(passphraseFromUrl);
  const [error, setError] = useState("");
  const [joining, setJoining] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const name = nickname.trim();
    // PlayFab display names need at least 3 characters
    if (name.length < 3 || name.length > 12) {
      setError("ニックネームは3〜12文字で入力してください。");
      return;
    }
    // Ignore case and spaces, so "cid expo" and "CIDEXPO" both match
    if (passphrase.replace(/\s/g, "").toUpperCase() !== DEMO_PASSPHRASE) {
      setError("合言葉が違います。");
      return;
    }
    setError("");
    setJoining(true);
    try {
      await onJoin(name);
    } catch (err) {
      setJoining(false);
      setError(
        err instanceof PlayFabError && err.code === "NameNotAvailable"
          ? "そのニックネームはすでに使われています。"
          : "参加できませんでした。もう一度お試しください。"
      );
    }
  }

  return (
    <main className="entry-page">
      <div className="entry-layout">
        <section className="event-panel">
          <h1>
            AR <span>SHOOTING</span>
          </h1>
        </section>

        <form className="entry-card" onSubmit={handleSubmit}>
          <div className="entry-card-heading">
            <span className="section-number">01</span>
            <div>
              <h2>ゲームに参加</h2>
              <p>プレイヤー情報を入力してください</p>
            </div>
          </div>

          <label>
            ニックネーム
            <span className="field-hint">3〜12文字</span>
            <input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={12}
              placeholder="例：ほしの"
              autoComplete="nickname"
            />
          </label>

          <label>
            合言葉
            <input
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              placeholder="合言葉を入力"
              autoComplete="off"
            />
          </label>

          {error && <p className="error" role="alert">{error}</p>}

          <button type="submit" className="btn primary entry-submit" disabled={joining}>
            {joining ? "接続中..." : "探索をスタート"} <span aria-hidden="true">→</span>
          </button>
        </form>
      </div>
    </main>
  );
}