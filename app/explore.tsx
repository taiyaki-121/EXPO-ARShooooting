"use client";

import { useEffect, useMemo, useState } from "react";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import Battle from "./battle";
import { BOSSES, BossDef, Progress, Stats } from "./game-data";
import { Drops } from "./progress";

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

function emojiIcon(emoji: string, className: string) {
  return L.divIcon({
    html: `<span>${emoji}</span>`,
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
  stats: Stats;
  onEncounter: (bossId: string) => void;
  onWin: (boss: BossDef, drops: Drops) => void;
  onHome: () => void;
};

export default function Explore({ progress, stats, onEncounter, onWin, onHome }: Props) {
  const nickname = progress.nickname;
  const [position, setPosition] = useState<LatLng>(DEMO_POSITION);
  const [gps, setGps] = useState<GpsState>("loading");
  // Bosses defeated during this map visit; they respawn after returning home
  const [defeated, setDefeated] = useState<string[]>([]);
  const [selected, setSelected] = useState<Monster | null>(null);

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

  const remaining = monsters.filter((m) => !defeated.includes(m.id));

  const playerIcon = useMemo(() => emojiIcon("🧑", "player-marker"), []);

  function challenge(monster: Monster) {
    onEncounter(monster.id);
    setSelected(monster);
  }

  function startRandomBattle() {
    if (remaining.length === 0) return;
    challenge(remaining[Math.floor(Math.random() * remaining.length)]);
  }

  if (selected) {
    return (
      <Battle
        key={selected.id}
        monster={selected}
        nickname={nickname}
        score={progress.score}
        stats={stats}
        onFinish={(drops) => {
          if (drops) {
            setDefeated((d) => [...d, selected.id]);
            onWin(selected, drops);
          }
          setSelected(null);
        }}
      />
    );
  }

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
          マップのモンスターをタップして挑戦
        </div>
        <MapContainer center={position} zoom={17} scrollWheelZoom className="map">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Recenter position={position} />
          <Marker position={position} icon={playerIcon}>
            <Popup>{nickname}（あなた）</Popup>
          </Marker>
          {remaining.map((m) => (
            <Marker
              key={m.id}
              position={m.position}
              icon={emojiIcon(m.emoji, "monster-marker")}
              eventHandlers={{ click: () => challenge(m) }}
            >
              <Popup>{m.name}</Popup>
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
            <span className="stat-label">残り小ボス</span>
            <strong>{remaining.length} <small>体</small></strong>
          </div>
        </div>
        <button
          className="btn primary"
          onClick={startRandomBattle}
          disabled={remaining.length === 0}
        >
          <span aria-hidden="true">⚔️</span>
          ボスに挑戦
        </button>
      </footer>
    </div>
  );
}
