"use client";

import { useEffect, useMemo, useState } from "react";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { BOSSES, BossDef, Progress } from "./game-data";

type LatLng = [number, number];

type Monster = BossDef & { position: LatLng };

// Tokyo Station area (fallback when GPS is unavailable)
const DEMO_POSITION: LatLng = [35.681236, 139.767125];

// Map offsets for each boss around the player
const BOSS_OFFSETS: Record<string, [number, number]> = {
  slime: [0.0007, 0.0004],
  dragon: [-0.0006, 0.0008],
  ghost: [0.0003, -0.0009],
  robot: [-0.0008, -0.0005],
};

// label is our own data (boss names), never user input, so it is safe to inline as HTML
function emojiIcon(emoji: string, className: string, label?: string) {
  return L.divIcon({
    html: `<span>${emoji}</span>${label ? `<em class="marker-label">${label}</em>` : ""}`,
    className: `emoji-marker ${className}`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
}

function Recenter({ position }: { position: LatLng }) {
  const map = useMap();
  useEffect(() => {
    map.setView(position);
  }, [map, position]);
  return null;
}

type GpsState = "loading" | "ok" | "demo";

type Props = {
  progress: Progress;
  onCodeword: () => void;
  onHome: () => void;
};

// View-only map: shows where the mini-bosses are. Battles start from the venue 合言葉.
export default function Explore({ progress, onCodeword, onHome }: Props) {
  const nickname = progress.nickname;
  const [position, setPosition] = useState<LatLng>(DEMO_POSITION);
  const [gps, setGps] = useState<GpsState>("loading");

  useEffect(() => {
    if (!navigator.geolocation) {
      setGps("demo");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition([pos.coords.latitude, pos.coords.longitude]);
        setGps("ok");
      },
      () => setGps("demo"),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  const monsters = useMemo<Monster[]>(
    () =>
      BOSSES.map((b) => {
        const [dLat, dLng] = BOSS_OFFSETS[b.id] ?? [0, 0];
        return { ...b, position: [position[0] + dLat, position[1] + dLng] as LatLng };
      }),
    [position]
  );

  const playerIcon = useMemo(() => emojiIcon("🧑", "player-marker"), []);
  const defeatedCount = BOSSES.filter((b) => progress.defeated[b.id]).length;

  return (
    <div className="map-screen">
      <header className="map-header">
        <div className="map-brand">
          <span className="brand-mark" aria-hidden="true">✦</span>
          <div>
            <strong>AR BOSS SHOOTING</strong>
            <span>個人チャレンジ</span>
          </div>
        </div>
        <div className="map-player">
          <span className="player-avatar" aria-hidden="true">🧑</span>
          <div className="player-details">
            <strong>{nickname}</strong>
            <span className={`gps-status gps-${gps}`}>
              <span className="status-dot" />
              {gps === "loading" && "現在地を取得中"}
              {gps === "ok" && "現在地を取得しました"}
              {gps === "demo" && "デモ位置でプレイ中"}
            </span>
          </div>
        </div>
        <button className="btn exit-button" onClick={onHome}>
          ホーム
        </button>
      </header>

      <div className="map-wrap">
        <div className="map-hint">
          <span aria-hidden="true">📍</span>
          合言葉を見つけて小ボスと戦おう
        </div>
        <MapContainer center={position} zoom={17} scrollWheelZoom className="map">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          <Recenter position={position} />
          <Marker position={position} icon={playerIcon}>
            <Popup>{nickname}（あなた）</Popup>
          </Marker>
          {monsters.map((m) => (
            <Marker
              key={m.id}
              position={m.position}
              icon={emojiIcon(m.emoji, "monster-marker", m.name)}
            >
              <Popup>
                <strong>{m.name}</strong>
                <br />
                {progress.defeated[m.id] ? "たおした！ " : ""}
                このあたりの合言葉を見つけて戦おう
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <footer className="map-footer">
        <div className="map-stat">
          <span className="stat-icon score-icon" aria-hidden="true">★</span>
          <div>
            <span className="stat-label">スコア</span>
            <strong>{progress.score.toLocaleString()} <small>pt</small></strong>
          </div>
        </div>
        <div className="map-stat monster-stat">
          <span className="stat-icon monster-icon" aria-hidden="true">👾</span>
          <div>
            <span className="stat-label">たおした小ボス</span>
            <strong>
              {defeatedCount} <small>/ {BOSSES.length} 体</small>
            </strong>
          </div>
        </div>
        <button className="btn primary" onClick={onCodeword}>
          <span aria-hidden="true">🔑</span>
          合言葉を入力
        </button>
      </footer>
    </div>
  );
}
