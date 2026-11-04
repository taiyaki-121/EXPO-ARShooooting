"use client";

import type { Progress } from "./game-data";

// PlayFab Client API over REST. Set NEXT_PUBLIC_PLAYFAB_TITLE_ID in .env.local;
// without it the game runs offline on localStorage only.
const TITLE_ID = process.env.NEXT_PUBLIC_PLAYFAB_TITLE_ID ?? "";
const DEVICE_KEY = "arboss-playfab-id";
const PROGRESS_KEY = "progress";
// Name of both the statistic and the leaderboard in Game Manager (Progression / Community)
export const SCORE_STAT = "scores";

export const playfabEnabled = TITLE_ID !== "";

export class PlayFabError extends Error {
  constructor(public code: string, message: string) {
    super(message);
  }
}

// ticket: Client API (login, user data). entityToken + entityId: the newer
// Statistics / Leaderboards API, which newer titles use instead of the legacy one.
type Session = { ticket: string; entityToken: string; entityId: string };
let session: Promise<Session> | null = null;

async function request<T>(path: string, body: object, headers: Record<string, string>) {
  const res = await fetch(`https://${TITLE_ID}.playfabapi.com/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (json.code !== 200) throw new PlayFabError(json.error, json.errorMessage);
  return json.data as T;
}

function call<T>(api: string, body: object, ticket?: string): Promise<T> {
  return request<T>(`Client/${api}`, body, ticket ? { "X-Authorization": ticket } : {});
}

function entityCall<T>(path: string, body: object, entityToken: string): Promise<T> {
  return request<T>(path, body, { "X-EntityToken": entityToken });
}

// One anonymous account per device, so no password is needed at the venue
function deviceId() {
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

type LoginResult = {
  SessionTicket: string;
  PlayFabId: string;
  EntityToken: { EntityToken: string; Entity: { Id: string; Type: string } };
  InfoResultPayload?: {
    PlayerProfile?: { DisplayName?: string };
    UserData?: Record<string, { Value: string }>;
  };
};

function randomHex(length: number) {
  const bytes = crypto.getRandomValues(new Uint8Array(Math.ceil(length / 2)));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("").slice(0, length);
}

// The title blocks account creation through the login APIs, but registration still works.
// So on first visit we register a throwaway account and link this device's custom ID to it;
// from then on LoginWithCustomID finds the existing account and never needs to create one.
async function loginWithDevice(): Promise<LoginResult> {
  const params = {
    TitleId: TITLE_ID,
    CustomId: deviceId(),
    CreateAccount: true,
    InfoRequestParameters: {
      GetPlayerProfile: true,
      GetUserData: true,
      UserDataKeys: [PROGRESS_KEY],
    },
  };
  try {
    return await call<LoginResult>("LoginWithCustomID", params);
  } catch (err) {
    if (!(err instanceof PlayFabError && err.code === "PlayerCreationDisabled")) throw err;
  }
  const registered = await call<{ SessionTicket: string; PlayFabId: string }>(
    "RegisterPlayFabUser",
    {
      TitleId: TITLE_ID,
      Username: `p${randomHex(19)}`,
      Password: randomHex(32),
      RequireBothUsernameAndEmail: false,
    }
  );
  await call("LinkCustomID", { CustomId: params.CustomId }, registered.SessionTicket);
  return call<LoginResult>("LoginWithCustomID", { ...params, CreateAccount: false });
}

// Logs in, claims the nickname as the PlayFab display name and returns the cloud save.
export async function login(nickname: string): Promise<Progress | null> {
  const pending = loginWithDevice();
  session = pending.then((r) => ({
    ticket: r.SessionTicket,
    entityToken: r.EntityToken.EntityToken,
    entityId: r.EntityToken.Entity.Id,
  }));
  session.catch(() => (session = null));

  const result = await pending;
  const info = result.InfoResultPayload;
  if (info?.PlayerProfile?.DisplayName !== nickname) {
    await call(
      "UpdateUserTitleDisplayName",
      { DisplayName: nickname },
      result.SessionTicket
    );
  }
  const raw = info?.UserData?.[PROGRESS_KEY]?.Value;
  return raw ? (JSON.parse(raw) as Progress) : null;
}

export async function saveProgress(p: Progress) {
  if (!session) return;
  const { ticket, entityToken } = await session;
  await Promise.all([
    call("UpdateUserData", { Data: { [PROGRESS_KEY]: JSON.stringify(p) } }, ticket),
    // Needs a "score" statistic and leaderboard defined under Progression in Game Manager
    entityCall(
      "Statistic/UpdateStatistics",
      { Statistics: [{ Name: SCORE_STAT, Scores: [String(p.score)] }] },
      entityToken
    ),
  ]);
}

export type RankEntry = { position: number; name: string; score: number; me: boolean };

export async function getLeaderboard(max = 20): Promise<RankEntry[]> {
  if (!session) return [];
  const { entityToken, entityId } = await session;
  const data = await entityCall<{
    Rankings?: {
      Rank: number;
      Scores: string[];
      DisplayName?: string;
      Entity: { Id: string };
    }[];
  }>("Leaderboard/GetLeaderboard", { LeaderboardName: SCORE_STAT, StartingPosition: 1, PageSize: max }, entityToken);
  return (data.Rankings ?? []).map((e) => ({
    position: e.Rank,
    name: e.DisplayName ?? "???",
    score: Number(e.Scores[0] ?? 0),
    me: e.Entity.Id === entityId,
  }));
}
