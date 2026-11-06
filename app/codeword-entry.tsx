"use client";

import { FormEvent, useState } from "react";

type Props = {
  onSubmit: (text: string) => void;
  onClose: () => void;
  error: string | null;
};

// Players type the 合言葉 found on posters around the venue
export default function CodewordEntry({ onSubmit, onClose, error }: Props) {
  const [word, setWord] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (word.trim()) onSubmit(word.trim());
  }

  return (
    <main className="center-screen">
      <form className="card codeword-card" onSubmit={handleSubmit}>
        <div className="codeword-emoji" aria-hidden="true">🔑</div>
        <h1>合言葉を入力</h1>
        <p className="sub">
          会場のどこかに合言葉がかくれています。
          <br />
          見つけて入力すると、小ボスが現れたり先生が仲間になったりします。
        </p>
        <input
          value={word}
          onChange={(e) => setWord(e.target.value)}
          placeholder="合言葉を入力"
          autoComplete="off"
          autoFocus
          aria-label="合言葉"
        />
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="btn primary" disabled={!word.trim()}>
          決定
        </button>
        <button type="button" className="btn" onClick={onClose}>
          ホームにもどる
        </button>
      </form>
    </main>
  );
}
