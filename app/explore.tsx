"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { PLAYER_MAX_HP, useBattle } from "./use-battle";

type LatLng = [number, number];

type Monster = {
  id: string;
  name: string;
  emoji: string;
  hp: number;
  position: LatLng;
};

// Tokyo Station area (fallback when GPS is unavailable)
const DEMO_POSITION: LatLng = [35.681236, 139.767125];

const MONSTER_TEMPLATES = [
  { name: "スライム", emoji: "👾", hp: 50, dLat: 0.0007, dLng: 0.0004 },
  { name: "ドラゴン", emoji: "🐉", hp: 80, dLat: -0.0006, dLng: 0.0008 },
  { name: "ゴースト", emoji: "👻", hp: 60, dLat: 0.0003, dLng: -0.0009 },
  { name: "ロボット", emoji: "🤖", hp: 70, dLat: -0.0008, dLng: -0.0005 },
];

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
  nickname: string;
  onExit: () => void;
};

export default function Explore({ nickname, onExit }: Props) {
  const [position, setPosition] = useState<LatLng>(DEMO_POSITION);
  const [gps, setGps] = useState<GpsState>("loading");
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
      MONSTER_TEMPLATES.map((t, i) => ({
        id: `m${i}`,
        name: t.name,
        emoji: t.emoji,
        hp: t.hp,
        position: [position[0] + t.dLat, position[1] + t.dLng] as LatLng,
      })),
    [position]
  );

  const remaining = monsters.filter((m) => !defeated.includes(m.id));

  const playerIcon = useMemo(() => emojiIcon("🧑", "player-marker"), []);

  function startRandomBattle() {
    if (remaining.length === 0) return;
    setSelected(remaining[Math.floor(Math.random() * remaining.length)]);
  }

  if (selected) {
    return (
      <Battle
        key={selected.id}
        monster={selected}
        nickname={nickname}
        onFinish={(won) => {
          if (won) setDefeated((d) => [...d, selected.id]);
          setSelected(null);
        }}
      />
    );
  }

  return (
    <div className="map-screen">
      <header className="map-header">
        <span>🧑 {nickname}</span>
        <span className="gps-status">
          {gps === "loading" && "現在地を取得中..."}
          {gps === "ok" && "GPS: 現在地"}
          {gps === "demo" && "GPS 不可: デモ位置（東京駅周辺）"}
        </span>
        <button className="btn small" onClick={onExit}>
          終了
        </button>
      </header>

      <div className="map-wrap">
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
              eventHandlers={{ click: () => setSelected(m) }}
            >
              <Popup>{m.name}</Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <footer className="map-footer">
        <span>残りモンスター: {remaining.length}</span>
        <button
          className="btn primary"
          onClick={startRandomBattle}
          disabled={remaining.length === 0}
        >
          Start monster battle
        </button>
      </footer>
    </div>
  );
}

function Battle({
  monster,
  nickname,
  onFinish,
}: {
  monster: Monster;
  nickname: string;
  onFinish: (won: boolean) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const battle = useBattle(monster.hp);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;

    async function startCamera() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError("このブラウザではカメラを利用できません。");
        return;
      }
      try {
        // Prefer the rear camera on phones
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
      } catch {
        try {
          // Fall back to any available (e.g. PC webcam)
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        } catch {
          setCameraError("カメラを利用できません。カメラなしでバトルできます。");
          return;
        }
      }
      if (cancelled) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    }

    startCamera();
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const monsterPct = (battle.monsterHp / battle.monsterMaxHp) * 100;
  const playerPct = (battle.playerHp / PLAYER_MAX_HP) * 100;

  return (
    <div className="battle-screen">
      <video ref={videoRef} className="battle-video" playsInline muted />
      {cameraError && <div className="camera-error">{cameraError}</div>}

      <div className="battle-hud">
        <div className="hp-block">
          <div className="hp-label">
            {monster.name} {battle.monsterHp}/{battle.monsterMaxHp}
          </div>
          <div className="hp-bar">
            <div className="hp-fill monster" style={{ width: `${monsterPct}%` }} />
          </div>
        </div>
        <div className="hp-block">
          <div className="hp-label">
            {nickname} {battle.playerHp}/{PLAYER_MAX_HP}
          </div>
          <div className="hp-bar">
            <div className="hp-fill player" style={{ width: `${playerPct}%` }} />
          </div>
        </div>
      </div>

      <div className={`battle-monster ${battle.dodging ? "dodging" : ""}`}>
        {monster.emoji}
      </div>

      <div className="battle-message">{battle.message}</div>

      {battle.status === "fighting" ? (
        <div className="battle-controls">
          <button
            className="btn attack"
            onClick={battle.attack}
            disabled={!battle.attackReady}
          >
            ⚔️ 攻撃
          </button>
          <button
            className="btn dodge"
            onClick={battle.dodge}
            disabled={!battle.dodgeReady}
          >
            💨 回避
          </button>
        </div>
      ) : (
        <div className="result-overlay">
          <h2>{battle.status === "won" ? "🎉 勝利！" : "💀 敗北..."}</h2>
          <p>
            {battle.status === "won"
              ? `${monster.name}を倒した！`
              : `${monster.name}に負けてしまった。`}
          </p>
          <div className="result-buttons">
            {battle.status === "lost" && (
              <button className="btn" onClick={battle.reset}>
                もう一度
              </button>
            )}
            <button
              className="btn primary"
              onClick={() => onFinish(battle.status === "won")}
            >
              マップへ戻る
            </button>
          </div>
        </div>
      )}
    </div>
  );
}