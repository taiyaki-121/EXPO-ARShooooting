"use client";

import { createClient } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

// Live event state shared by every phone. Player accounts and saves stay on PlayFab;
// Supabase only carries what must change on all phones at once.
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

export const supabase = URL && KEY ? createClient(URL, KEY) : null;

export type Phase = "collect" | "final" | "ended";

export const PHASE_LABELS: Record<Phase, string> = {
  collect: "収集フェーズ（小ボス）",
  final: "大ボス戦",
  ended: "終了・結果発表",
};

async function fetchPhase(): Promise<Phase | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from("event_state").select("phase").eq("id", 1).single();
  if (error) throw error;
  return data.phase as Phase;
}

// Follows the phase in real time. Without Supabase configured the game stays in "collect".
export function useEventPhase(): Phase {
  const [phase, setPhase] = useState<Phase>("collect");

  useEffect(() => {
    if (!supabase) return;
    const client = supabase;
    const refresh = () =>
      fetchPhase()
        .then((p) => p && setPhase(p))
        .catch((e) => console.warn("Event phase fetch failed", e));

    const channel = client
      .channel("event_state")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "event_state" },
        (payload) => setPhase((payload.new as { phase: Phase }).phase)
      )
      // Re-read after (re)connecting so a change missed while offline is picked up
      .subscribe((status) => status === "SUBSCRIBED" && refresh());

    // Phones sleep and drop the socket, so re-check whenever the page comes back
    const onVisible = () => document.visibilityState === "visible" && refresh();
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      client.removeChannel(channel);
    };
  }, []);

  return phase;
}

// Staff only: the database rejects the call unless staffKey matches.
export async function setEventPhase(phase: Phase, staffKey: string) {
  if (!supabase) throw new Error("Supabase is not configured");
  const { error } = await supabase.rpc("set_event_phase", {
    new_phase: phase,
    staff_key: staffKey,
  });
  if (error) throw error;
}
