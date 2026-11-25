"use client";

import { GEAR, STAT_LABELS, Stats } from "./game-data";

export function boostText(boost: Partial<Stats>) {
  return Object.entries(boost)
    .map(([key, value]) => {
      const label = STAT_LABELS[key as keyof Stats];
      if (key === "dodgeCooldownMs") return `${label} ${((value ?? 0) / 1000).toFixed(1)}秒`;
      const unit = key === "goldBonus" || key === "rareBonus" ? "%" : "";
      return `${label} +${value}${unit}`;
    })
    .join(" / ");
}

// Shown once, after the player's very first win: pick 1 of 3 strong starter pieces.
// The other two can still drop later as weaker "lite" versions.
export default function StarterGear({ onChoose }: { onChoose: (gearId: string) => void }) {
  return (
    <main className="center-screen">
      <div className="card">
        <h1>🎁 初クリアボーナス</h1>
        <p className="sub">
          装備をひとつ選ぼう！どれも強力だけど効果がちがいます。
          <br />
          選ばなかった装備も、先生を倒し続けるとライト版が手に入るかも。
        </p>
        <ul className="teacher-list">
          {GEAR.map((g) => (
            <li key={g.id} className="teacher">
              <span className="teacher-emoji" aria-hidden="true">{g.emoji}</span>
              <div>
                <strong>{g.name}</strong>
                <span>{g.description}</span>
                <span className="teacher-cost">{boostText(g.boost.full)}</span>
              </div>
              <div className="teacher-buttons">
                <button className="btn small primary" onClick={() => onChoose(g.id)}>
                  これにする
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
