"use client";

import type { Progress } from "./game-data";

// PlayFab Client API over REST. Set NEXT_PUBLIC_PLAYFAB_TITLE_ID in .env.local;
// without it the game runs offline on localStorage only.
const TITLE_ID = process.env.NEXT_PUBLIC_PLAYFAB_TITLE_ID ?? "";
const DEVICE_KEY = "arboss-playfab-id";
const PROGRESS_KEY = "progress";
export const SCORE_STAT = "score";

export const playfabEnabled = TITLE_ID !== "";

export class PlayFabError extends Error {
  constructor(public code: string, message: string) {
    super(message);
  }
}

type Session = { ticket: string; playFabId: string };
let session: Promise<Session> | null = null;

async function call<T>(api: string, body: object, ticket?: string): Promise<T> {
  const res = await fetch(`https://${TITLE_ID}.playfabapi.com/Client/${api}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(ticket ? { "X-Authorization": ticket } : {}),
    },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (json.code !== 200) throw new PlayFabError(json.error, json.errorMessage);
  return json.data as T;
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
  const request = {
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
    return await call<LoginResult>("LoginWithCustomID", request);
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
  await call("LinkCustomID", { CustomId: request.CustomId }, registered.SessionTicket);
  return call<LoginResult>("LoginWithCustomID", { ...request, CreateAccount: false });
}

// Logs in, claims the nickname as the PlayFab display name and returns the cloud save.
export async function login(nickname: string): Promise<Progress | null> {
  const pending = loginWithDevice();
  session = pending.then((r) => ({ ticket: r.SessionTicket, playFabId: r.PlayFabId }));
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
  const { ticket } = await session;
  await Promise.all([
    call("UpdateUserData", { Data: { [PROGRESS_KEY]: JSON.stringify(p) } }, ticket),
    call(
      "UpdatePlayerStatistics",
      { Statistics: [{ StatisticName: SCORE_STAT, Value: p.score }] },
      ticket
    ),
  ]);
}

export type RankEntry = { position: number; name: string; score: number; me: boolean };

export async function getLeaderboard(max = 20): Promise<RankEntry[]> {
  if (!session) return [];
  const { ticket, playFabId } = await session;
  const data = await call<{
    Leaderboard: {
      Position: number;
      StatValue: number;
      DisplayName?: string;
      PlayFabId: string;
    }[];
  }>("GetLeaderboard", { StatisticName: SCORE_STAT, StartPosition: 0, MaxResultsCount: max }, ticket);
  return data.Leaderboard.map((e) => ({
    position: e.Position + 1,
    name: e.DisplayName ?? "???",
    score: e.StatValue,
    me: e.PlayFabId === playFabId,
  }));
}
