"use client";

import { useEffect, useRef, useState } from "react";
import { PLAYER_MAX_HP, type Stats } from "./game-data";

const PLAYER_ATTACK_COOLDOWN_MS = 600;
const ENEMY_ATTACK_INTERVAL_MS = 1200;
const DODGE_DURATION_MS = 900;

// Enemy hits take a share of the player's max HP, so a fresh player and a
// fully equipped one survive the same number of hits.
export function useBattle(monsterMaxHp: number, stats: Stats, attackPercent: number) {
  const playerMaxHp = PLAYER_MAX_HP;
  const enemyDamage = Math.max(1, Math.ceil((playerMaxHp * attackPercent) / 100));
  const [playerHp, setPlayerHp] = useState(playerMaxHp);
  const [monsterHp, setMonsterHp] = useState(monsterMaxHp);
  const [clock, setClock] = useState(0);
  const [dodgeUntilTime, setDodgeUntilTime] = useState(0);
  const [dodgeCooldownUntilTime, setDodgeCooldownUntilTime] = useState(0);
  const [attackCooldownUntilTime, setAttackCooldownUntilTime] = useState(0);
  const dodgeUntil = useRef(0);
  const dodgeCooldownUntil = useRef(0);
  const attackCooldownUntil = useRef(0);
  const battleFinished = playerHp === 0 || monsterHp === 0;

  useEffect(() => {
    if (battleFinished) return;

    const clockTimer = window.setInterval(() => setClock(Date.now()), 100);
    const attackTimer = window.setInterval(() => {
      if (dodgeUntil.current > Date.now()) return;
      setPlayerHp((hp) => Math.max(0, hp - enemyDamage));
    }, ENEMY_ATTACK_INTERVAL_MS);

    return () => {
      window.clearInterval(clockTimer);
      window.clearInterval(attackTimer);
    };
  }, [battleFinished, enemyDamage]);

  function attack() {
    const now = Date.now();
    if (attackCooldownUntil.current > now || battleFinished) return;

    attackCooldownUntil.current = now + PLAYER_ATTACK_COOLDOWN_MS;
    setAttackCooldownUntilTime(attackCooldownUntil.current);
    setMonsterHp((hp) => Math.max(0, hp - stats.attack));
  }

  function dodge() {
    const now = Date.now();
    if (dodgeCooldownUntil.current > now || battleFinished) return;

    dodgeUntil.current = now + DODGE_DURATION_MS;
    dodgeCooldownUntil.current = now + stats.dodgeCooldownMs;
    setDodgeUntilTime(dodgeUntil.current);
    setDodgeCooldownUntilTime(dodgeCooldownUntil.current);
  }

  function reset() {
    setPlayerHp(playerMaxHp);
    setMonsterHp(monsterMaxHp);
    setClock(Date.now());
    dodgeUntil.current = 0;
    dodgeCooldownUntil.current = 0;
    attackCooldownUntil.current = 0;
    setDodgeUntilTime(0);
    setDodgeCooldownUntilTime(0);
    setAttackCooldownUntilTime(0);
  }

  const status =
    monsterHp === 0 ? "won" : playerHp === 0 ? "lost" : "fighting";
  const message =
    status === "fighting"
      ? dodgeUntilTime > clock
        ? "敵の攻撃を回避中..."
        : "攻撃と回避を使って戦おう！"
      : status === "won"
        ? "モンスターを倒した！"
        : "プレイヤーのHPがなくなった...";

  return {
    playerHp,
    playerMaxHp,
    monsterHp,
    monsterMaxHp,
    dodging: dodgeUntilTime > clock,
    dodgeReady: dodgeCooldownUntilTime <= clock,
    attackReady: attackCooldownUntilTime <= clock,
    status,
    message,
    attack,
    dodge,
    reset,
  };
}
