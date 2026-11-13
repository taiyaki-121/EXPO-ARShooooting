import { createClient } from "@supabase/supabase-js";

// Staff-only player list for /admin. Runs on the server so the PlayFab secret key
// never reaches a browser; the caller must send a valid staff key.
const TITLE_ID = process.env.NEXT_PUBLIC_PLAYFAB_TITLE_ID ?? "";
const SECRET_KEY = process.env.PLAYFAB_SECRET_KEY ?? "";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
const LEADERBOARD = "scores"; // same name as SCORE_STAT in app/playfab.ts
const PAGE_SIZE = 100; // PlayFab maximum per request
const MAX_PLAYERS = 1000;

export type AdminPlayer = { rank: number; name: string; score: number; lastUpdated: string | null };
export type AdminPlayersResponse = { total: number; players: AdminPlayer[] };

const json = (body: unknown, status = 200) => Response.json(body, { status });

async function playfab<T>(path: string, body: object, headers: Record<string, string>) {
  const res = await fetch(`https://${TITLE_ID}.playfabapi.com/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const data = await res.json();
  if (data.code !== 200) throw new Error(`${path}: ${data.error ?? res.status} ${data.errorMessage ?? ""}`);
  return data.data as T;
}

// Title-level entity token, reused until shortly before it expires
let titleToken: { token: string; expires: number } | null = null;

async function getTitleToken() {
  if (titleToken && titleToken.expires - Date.now() > 60_000) return titleToken.token;
  const data = await playfab<{ EntityToken: string; TokenExpiration: string }>(
    "Authentication/GetEntityToken",
    {},
    { "X-SecretKey": SECRET_KEY }
  );
  titleToken = { token: data.EntityToken, expires: Date.parse(data.TokenExpiration) || Date.now() + 3_600_000 };
  return titleToken.token;
}

type Ranking = { Rank: number; DisplayName?: string; Scores: string[]; LastUpdated?: string };

export async function POST(request: Request) {
  if (!TITLE_ID || !SECRET_KEY || !SUPABASE_URL || !SUPABASE_KEY) {
    return json({ error: "not_configured" }, 503);
  }

  const { staffKey } = (await request.json().catch(() => ({}))) as { staffKey?: unknown };
  if (typeof staffKey !== "string" || !staffKey.trim()) return json({ error: "invalid_key" }, 401);

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });
  const { data: ok, error } = await supabase.rpc("check_staff_key", {
    staff_key: staffKey.trim().toUpperCase(),
  });
  if (error) return json({ error: "key_check_failed" }, 502);
  if (ok !== true) return json({ error: "invalid_key" }, 401);

  try {
    const token = await getTitleToken();
    const players: AdminPlayer[] = [];
    let total = 0;
    for (let start = 1; start <= MAX_PLAYERS; start += PAGE_SIZE) {
      const page = await playfab<{ EntryCount?: number; Rankings?: Ranking[] }>(
        "Leaderboard/GetLeaderboard",
        { LeaderboardName: LEADERBOARD, StartingPosition: start, PageSize: PAGE_SIZE },
        { "X-EntityToken": token }
      );
      total = page.EntryCount ?? total;
      const rows = page.Rankings ?? [];
      for (const r of rows) {
        players.push({
          rank: r.Rank,
          name: r.DisplayName ?? "???",
          score: Number(r.Scores?.[0] ?? 0),
          lastUpdated: r.LastUpdated ?? null,
        });
      }
      if (rows.length < PAGE_SIZE || players.length >= total) break;
    }
    return json({ total: Math.max(total, players.length), players } satisfies AdminPlayersResponse);
  } catch (e) {
    console.error("Admin player list failed", e);
    titleToken = null;
    return json({ error: "playfab_failed" }, 502);
  }
}
