"use client";

import { useCallback, useEffect, useState } from "react";
import {
  PHASE_LABELS,
  Phase,
  checkStaffKey,
  setEventPhase,
  supabase,
  useEventPhase,
} from "../event-phase";
import PlayersPanel from "./players-panel";

const KEY_STORAGE = "arboss-staff-key";
const PHASES: Phase[] = ["collect", "final", "ended"];

const PHASE_INFO: Record<Phase, { icon: string; step: string; short: string; description: string }> = {
  collect: {
    icon: "👾",
    step: "STEP 1",
    short: "小ボス",
    description: "合言葉で小ボスと戦う通常プレイ",
  },
  final: {
    icon: "😈",
    step: "STEP 2",
    short: "大ボス",
    description: "ステージイベント開始。全員が大ボス戦の画面へ",
  },
  ended: {
    icon: "🏆",
    step: "STEP 3",
    short: "結果",
    description: "結果発表とランキングを表示して終了",
  },
};

type Message = { text: string; tone: "success" | "error" };

const normalizeKey = (key: string) => key.trim().toUpperCase();

function rememberKey(key: string | null) {
  try {
    if (key) sessionStorage.setItem(KEY_STORAGE, key);
    else sessionStorage.removeItem(KEY_STORAGE);
  } catch {
    // storage unavailable — staff just log in again
  }
}

// Staff page: log in with the staff key, then switch every phone between
// the collect phase, the final boss and the results
export default function AdminPage() {
  const phase = useEventPhase();
  const [keyInput, setKeyInput] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [staffKey, setStaffKey] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);

  async function login(raw: string, silent = false) {
    const key = normalizeKey(raw);
    if (!key) return;
    setChecking(true);
    setMessage(null);
    try {
      if (await checkStaffKey(key)) {
        setStaffKey(key);
        rememberKey(key);
      } else {
        rememberKey(null);
        if (!silent) setMessage({ text: "スタッフキーが違います。", tone: "error" });
      }
    } catch {
      setMessage({ text: "キーを確認できませんでした。通信を確認してください。", tone: "error" });
    } finally {
      setChecking(false);
    }
  }

  // Same tab reloaded: log back in with the remembered key
  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = sessionStorage.getItem(KEY_STORAGE);
    } catch {}
    if (saved) login(saved, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logout = useCallback(() => {
    rememberKey(null);
    setStaffKey(null);
    setKeyInput("");
    setMessage(null);
  }, []);

  // Key was changed in Supabase while logged in
  const onInvalidKey = useCallback(() => {
    logout();
    setMessage({ text: "スタッフキーが変更されました。もう一度ログインしてください。", tone: "error" });
  }, [logout]);

  async function change(next: Phase) {
    if (!staffKey || next === phase) return;
    if (!window.confirm(`全員の画面を「${PHASE_LABELS[next]}」に切り替えますか？`)) return;
    setBusy(true);
    setMessage(null);
    try {
      await setEventPhase(next, staffKey);
      setMessage({ text: `「${PHASE_LABELS[next]}」に切り替えました。`, tone: "success" });
    } catch (e) {
      if (e && typeof e === "object" && "code" in e && e.code === "28000") {
        onInvalidKey();
      } else {
        setMessage({ text: "切り替えに失敗しました。通信を確認してください。", tone: "error" });
      }
    } finally {
      setBusy(false);
    }
  }

  const current = PHASES.indexOf(phase);
  const info = PHASE_INFO[phase];

  return (
    <main className="admin-page">
      <div className="admin-shell">
        <header className="admin-header">
          <div>
            <span className="admin-badge">🛡️ STAFF ONLY</span>
            <h1>
              AR シューティング
              <span>管理パネル</span>
            </h1>
          </div>
          {staffKey && (
            <button className="admin-logout" onClick={logout} disabled={busy}>
              ログアウト
            </button>
          )}
        </header>

        {!supabase && (
          <p className="admin-message error" role="alert">
            Supabase が設定されていません（.env.local を確認してください）。
          </p>
        )}

        <section className={`admin-live phase-${phase}`} aria-live="polite">
          <div className="admin-live-label">
            <span className="live-dot" aria-hidden="true" />
            LIVE・参加者の画面
          </div>
          <div className="admin-live-phase">
            <span className="admin-live-icon" aria-hidden="true">
              {info.icon}
            </span>
            <div>
              <strong>{PHASE_LABELS[phase]}</strong>
              <span>{info.description}</span>
            </div>
          </div>
          <ol className="admin-steps">
            {PHASES.map((p, i) => (
              <li
                key={p}
                className={i < current ? "done" : i === current ? "current" : ""}
                aria-current={i === current ? "step" : undefined}
              >
                <span className="admin-step-dot">{i < current ? "✓" : i + 1}</span>
                {PHASE_INFO[p].short}
              </li>
            ))}
          </ol>
        </section>

        {staffKey ? (
          <section className="admin-phases" aria-label="フェーズ切り替え">
            <h2>画面を切り替える</h2>
            {PHASES.map((p) => {
              const isCurrent = p === phase;
              const pi = PHASE_INFO[p];
              return (
                <button
                  key={p}
                  className={`admin-phase-card phase-${p} ${isCurrent ? "current" : ""}`}
                  disabled={busy || isCurrent}
                  onClick={() => change(p)}
                >
                  <span className="admin-phase-icon" aria-hidden="true">
                    {pi.icon}
                  </span>
                  <span className="admin-phase-text">
                    <small>{pi.step}</small>
                    <strong>{PHASE_LABELS[p]}</strong>
                    <span>{pi.description}</span>
                  </span>
                  <span className="admin-phase-action">
                    {isCurrent ? "現在" : busy ? "…" : "切替 →"}
                  </span>
                </button>
              );
            })}
          </section>
        ) : (
          <form
            className="admin-login"
            onSubmit={(e) => {
              e.preventDefault();
              login(keyInput);
            }}
          >
            <div className="admin-login-head">
              <span className="admin-lock" aria-hidden="true">
                🔒
              </span>
              <div>
                <strong>スタッフログイン</strong>
                <span>キーを入れると切り替えボタンが表示されます</span>
              </div>
            </div>
            <label className="admin-key-field">
              <span className="sr-only">スタッフキー</span>
              <input
                type={showKey ? "text" : "password"}
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="スタッフキーを入力"
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
              />
              <button
                type="button"
                className="admin-key-toggle"
                onClick={() => setShowKey((v) => !v)}
                aria-label={showKey ? "キーを隠す" : "キーを表示"}
              >
                {showKey ? "隠す" : "表示"}
              </button>
            </label>
            <button
              type="submit"
              className="admin-login-btn"
              disabled={checking || !keyInput.trim() || !supabase}
            >
              {checking ? "確認中..." : "ログイン"}
            </button>
          </form>
        )}

        {message && (
          <p className={`admin-message ${message.tone}`} role="status">
            {message.tone === "success" ? "✅ " : "⚠️ "}
            {message.text}
          </p>
        )}

        {staffKey && <PlayersPanel staffKey={staffKey} onInvalidKey={onInvalidKey} />}
      </div>
    </main>
  );
}
