"use client";

import dynamic from "next/dynamic";

// Leaflet, camera and saved progress all need the browser, so load the game on the client only
const Game = dynamic(() => import("./game"), {
  ssr: false,
  loading: () => <div className="center-screen">読み込み中...</div>,
});

export default function Page() {
  return <Game />;
}
