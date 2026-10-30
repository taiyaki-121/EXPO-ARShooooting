"use client";

import { useEffect, useRef, useState } from "react";

export function useBattle(active: boolean) {
  const [playerHp, setPlayerHp] = useState(100);
  const [enemyHp, setEnemyHp] = useState(100);
  const [clock, setClock] = useState(0);
  const dodgeUntil = useRef(0);
  const cooldownUntil = useRef(0);

  useEffect(() => {
    if (!active || playerHp === 0 || enemyHp === 0) return;

    const clockTimer = window.setInterval(() => setClock(Date.now()), 100);
    const attackTimer = window.setInterval(() => {
      if (dodgeUntil.current > Date.now()) return;

      setPlayerHp((hp) => Math.max(0, hp - 10));
    }, 1200);

    return () => {
      window.clearInterval(clockTimer);
      window.clearInterval(attackTimer);
    };
  }, [active, enemyHp, playerHp]);

  function attackEnemy(damage: number) {
    setEnemyHp((hp) => Math.max(0, hp - damage));
  }

  function evade() {
    const now = Date.now();
    if (cooldownUntil.current > now) return;

    dodgeUntil.current = now + 900;
    cooldownUntil.current = now + 3500;
    setClock(now);
  }

  function reset() {
    setPlayerHp(100);
    setEnemyHp(100);
    dodgeUntil.current = 0;
    cooldownUntil.current = 0;
  }

  const cooldownRemaining = Math.max(0, cooldownUntil.current - clock);

  return {
    playerHp,
    enemyHp,
    dodging: active && dodgeUntil.current > clock,
    dodgeReady: cooldownRemaining === 0,
    cooldownSeconds: Math.ceil(cooldownRemaining / 1000),
    attackEnemy,
    evade,
    reset,
  };
}
