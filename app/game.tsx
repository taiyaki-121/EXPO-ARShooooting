"use client";

import { useEffect, useState } from "react";
import Battle from "./battle";
import CodewordEntry from "./codeword-entry";
import Entry from "./entry";
import { useEventPhase } from "./event-phase";
import Explore from "./explore";
import { FinalBossScreen, ResultsScreen } from "./final-stage";
import { BossDef, TITLES, parseCode } from "./game-data";
import Home from "./home";
import {
  applyWin,
  computeStats,
  markSeen,
  recruitTeacher,
  useProgress,
} from "./progress";

type Screen =
  | { name: "home" }
  | { name: "map" }
  | { name: "scan" }
  | { name: "battle"; boss: BossDef };

// A venue QR opened with the phone's own camera lands here as ?qr=<payload>
function takeQrFromUrl() {
  const url = new URL(window.location.href);
  const qr = url.searchParams.get("qr");
  if (qr) {
    url.searchParams.delete("qr");
    window.history.replaceState(null, "", url);
  }
  return qr;
}

export default function Game() {
  const { progress, update, start, signOut, newTitle, dismissTitle } = useProgress();
  const [screen, setScreen] = useState<Screen>({ name: "home" });
  const [scanError, setScanError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pendingQr, setPendingQr] = useState<string | null>(takeQrFromUrl);
  const phase = useEventPhase();

  function handleQr(text: string) {
    const action = parseCode(text);
    if (!action) {
      setScanError("合言葉がちがいます。もう一度たしかめてね。");
      return;
    }
    setScanError(null);
    if (action.kind === "boss") {
      // Mini-bosses are only for the collect phase
      if (phase !== "collect") {
        setNotice("小ボスの時間は終わりました。");
        setScreen({ name: "home" });
        return;
      }
      update(markSeen(action.boss.id));
      setScreen({ name: "battle", boss: action.boss });
      return;
    }
    const { teacher } = action;
    if (progress?.teachers[teacher.id]) {
      setNotice(`${teacher.emoji} ${teacher.name}はすでに仲間です。`);
    } else {
      update(recruitTeacher(teacher.id));
      setNotice(`${teacher.emoji} ${teacher.name}が仲間になった！`);
    }
    setScreen({ name: "home" });
  }

  useEffect(() => {
    if (progress && pendingQr) {
      setPendingQr(null);
      handleQr(pendingQr);
    }
  }, [progress, pendingQr]);

  if (!progress) {
    return <Entry onJoin={start} />;
  }

  const stats = computeStats(progress);
  const title = newTitle ? TITLES.find((t) => t.id === newTitle) : null;

  let content;
  // Staff switched phases: everyone follows, except a mini-boss battle in progress
  // finishes first so its rewards aren't lost (its もどる button lands here).
  if (phase !== "collect" && screen.name !== "battle") {
    content =
      phase === "final" ? (
        <FinalBossScreen progress={progress} stats={stats} />
      ) : (
        <ResultsScreen progress={progress} />
      );
  } else if (screen.name === "map") {
    content = (
      <Explore
        progress={progress}
        onCodeword={() => setScreen({ name: "scan" })}
        onHome={() => setScreen({ name: "home" })}
      />
    );
  } else if (screen.name === "scan") {
    content = (
      <CodewordEntry
        onSubmit={handleQr}
        error={scanError}
        onClose={() => {
          setScanError(null);
          setScreen({ name: "home" });
        }}
      />
    );
  } else if (screen.name === "battle") {
    const { boss } = screen;
    content = (
      <Battle
        monster={boss}
        nickname={progress.nickname}
        score={progress.score}
        stats={stats}
        onFinish={(drops) => {
          if (drops) update(applyWin(boss, drops));
          setScreen({ name: "home" });
        }}
      />
    );
  } else {
    content = (
      <Home
        progress={progress}
        stats={stats}
        update={update}
        onMap={() => setScreen({ name: "map" })}
        onScan={() => setScreen({ name: "scan" })}
        onSignOut={signOut}
      />
    );
  }

  return (
    <>
      {content}
      {(notice || title) && (
        <div className="toast" role="status">
          <span>
            {notice ?? (
              <>
                🏅 称号「<strong>{title!.name}</strong>」を獲得！
              </>
            )}
          </span>
          <button
            className="btn small"
            onClick={() => (notice ? setNotice(null) : dismissTitle())}
          >
            OK
          </button>
        </div>
      )}
    </>
  );
}
