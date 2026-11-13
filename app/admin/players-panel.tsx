"use client";

import { useCallback, useEffect, useState } from "react";
import type { AdminPlayer, AdminPlayersResponse } from "../api/admin/players/route";

const REFRESH_MS = 30_000;

type LoadError = "not_configured" | "failed" | null;

function timeAgo(iso: string | null, now: number) {
  if (!iso) return "—";
  const sec = Math.max(0, Math.round((now - Date.parse(iso)) / 1000));
  if (sec < 60) return "たった今";
  if (sec < 3600) return `${Math.floor(sec / 60)}分前`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}時間前`;
  return `${Math.floor(sec / 86400)}日前`;
}

// Staff view of every player on the PlayFab "scores" leaderboard
export default function PlayersPanel({
  staffKey,
  onInvalidKey,
}: {
  staffKey: string;
  onInvalidKey: () => void;
}) {
  const [data, setData] = useState<AdminPlayersResponse | null>(null);
  const [error, setError] = useState<LoadError>(null);
  const [loading, setLoading] = useState(false);
  const [loadedAt, setLoadedAt] = useState<number | null>(null);
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staffKey }),
      });
      if (res.status === 401) {
        onInvalidKey();
        return;
      }
      const body = await res.json();
      if (!res.ok) {
        setError(body.error === "not_configured" ? "not_configured" : "failed");
        return;
      }
      setData(body as AdminPlayersResponse);
      setError(null);
      setLoadedAt(Date.now());
    } catch {
      setError("failed");
    } finally {
      setLoading(false);
    }
  }, [staffKey, onInvalidKey]);

  // Load now, then keep it fresh while the page is open and visible
  useEffect(() => {
    load();
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [load]);

  const players = data?.players ?? [];
  const q = query.trim().toLowerCase();
  const shown: AdminPlayer[] = q ? players.filter((p) => p.name.toLowerCase().includes(q)) : players;
  const top = players[0]?.score ?? 0;
  const avg = players.length
    ? Math.round(players.reduce((s, p) => s + p.score, 0) / players.length)
    : 0;
  const now = Date.now();

  return (
    <section className="admin-players" aria-label="プレイヤー一覧">
      <div className="admin-players-head">
        <h2>プレイヤー</h2>
        <button className="admin-refresh" onClick={load} disabled={loading}>
          {loading ? "更新中…" : "↻ 更新"}
        </button>
      </div>

      {error === "not_configured" ? (
        <p className="admin-message error">
          ⚠️ プレイヤー一覧の設定がまだです。Vercel の環境変数に <code>PLAYFAB_SECRET_KEY</code>{" "}
          を追加してください。
        </p>
      ) : (
        <>
          <div className="admin-stats">
            <div>
              <span>参加者</span>
              <strong>{data ? data.total.toLocaleString() : "—"}</strong>
              <small>人</small>
            </div>
            <div>
              <span>最高スコア</span>
              <strong>{data ? top.toLocaleString() : "—"}</strong>
              <small>pt</small>
            </div>
            <div>
              <span>平均スコア</span>
              <strong>{data ? avg.toLocaleString() : "—"}</strong>
              <small>pt</small>
            </div>
          </div>

          <input
            className="admin-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ニックネームで検索"
            aria-label="ニックネームで検索"
          />

          {error === "failed" && (
            <p className="admin-message error">⚠️ 読み込みに失敗しました。少し待って「更新」を押してください。</p>
          )}

          {!data && !error ? (
            <p className="admin-players-empty">読み込み中...</p>
          ) : shown.length === 0 ? (
            <p className="admin-players-empty">
              {q ? "見つかりませんでした。" : "まだプレイヤーがいません。"}
            </p>
          ) : (
            <ol className="admin-player-list">
              {shown.map((p) => (
                <li key={`${p.rank}-${p.name}`} className={p.rank <= 3 ? `top top-${p.rank}` : ""}>
                  <span className="admin-player-rank">{p.rank}</span>
                  <span className="admin-player-name">
                    <strong>{p.name}</strong>
                    <small>{timeAgo(p.lastUpdated, now)}</small>
                  </span>
                  <span className="admin-player-score">
                    {p.score.toLocaleString()}
                    <small>pt</small>
                  </span>
                </li>
              ))}
            </ol>
          )}

          {loadedAt && (
            <p className="admin-players-foot">
              最終更新 {new Date(loadedAt).toLocaleTimeString("ja-JP")}・30秒ごとに自動更新
            </p>
          )}
        </>
      )}
    </section>
  );
}
