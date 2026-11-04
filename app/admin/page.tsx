"use client";

import { useEffect, useState } from "react";
import { PHASE_LABELS, Phase, setEventPhase, supabase, useEventPhase } from "../event-phase";

const KEY_STORAGE = "arboss-staff-key";
const PHASES: Phase[] = ["collect", "final", "ended"];

// Staff page: switches every phone between the collect phase, the final boss and the results
export default function AdminPage() {
  const phase = useEventPhase();
  const [staffKey, setStaffKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      setStaffKey(sessionStorage.getItem(KEY_STORAGE) ?? "");
    } catch {
      // storage unavailable — staff just retype the key
    }
  }, []);

  async function change(next: Phase) {
    if (next === phase) return;
    if (!window.confirm(`全員の画面を「${PHASE_LABELS[next]}」に切り替えますか？`)) return;
    setBusy(true);
    setMessage(null);
    try {
      await setEventPhase(next, staffKey.trim().toUpperCase());
      try {
        sessionStorage.setItem(KEY_STORAGE, staffKey);
      } catch {}
      setMessage(`「${PHASE_LABELS[next]}」に切り替えました。`);
    } catch (e) {
      const invalid = e && typeof e === "object" && "code" in e && e.code === "28000";
      setMessage(invalid ? "スタッフキーが違います。" : "切り替えに失敗しました。通信を確認してください。");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="center-screen">
      <div className="card">
        <h1>スタッフ画面</h1>
        <p className="sub">ボタンを押すと、参加者全員の画面が切り替わります。</p>

        {!supabase && (
          <p className="error" role="alert">
            Supabase が設定されていません（.env.local を確認してください）。
          </p>
        )}

        <p className="sub">
          現在：<strong>{PHASE_LABELS[phase]}</strong>
        </p>

        <label>
          スタッフキー
          <input
            value={staffKey}
            onChange={(e) => setStaffKey(e.target.value)}
            placeholder="スタッフキーを入力"
            autoComplete="off"
          />
        </label>

        {PHASES.map((p) => (
          <button
            key={p}
            className={`btn ${p === "final" ? "primary" : ""}`}
            disabled={busy || !staffKey.trim() || p === phase}
            onClick={() => change(p)}
          >
            {p === phase ? `✓ ${PHASE_LABELS[p]}（現在）` : `${PHASE_LABELS[p]}にする`}
          </button>
        ))}

        {message && (
          <p className="sub" role="status">
            {message}
          </p>
        )}
      </div>
    </main>
  );
}
