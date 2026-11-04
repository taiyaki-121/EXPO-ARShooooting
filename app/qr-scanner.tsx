"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import jsQR from "jsqr";

const SCAN_INTERVAL_MS = 250;

type Props = {
  onResult: (text: string) => void;
  onClose: () => void;
  error: string | null;
};

export default function QrScanner({ onResult, onClose, error }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manual, setManual] = useState("");
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  useEffect(() => {
    let stream: MediaStream | null = null;
    let timer = 0;
    let cancelled = false;

    function scan() {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < video.HAVE_ENOUGH_DATA) return;
      const width = video.videoWidth;
      const height = video.videoHeight;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, width, height);
      const code = jsQR(ctx.getImageData(0, 0, width, height).data, width, height, {
        inversionAttempts: "dontInvert",
      });
      if (code?.data) onResultRef.current(code.data);
    }

    async function startCamera() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError("このブラウザではカメラを利用できません。コードを入力してください。");
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
      } catch {
        setCameraError("カメラを利用できません。コードを入力してください。");
        return;
      }
      if (cancelled) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      timer = window.setInterval(scan, SCAN_INTERVAL_MS);
    }

    startCamera();
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  function handleManual(e: FormEvent) {
    e.preventDefault();
    if (manual.trim()) onResult(manual.trim());
  }

  return (
    <div className="scan-screen">
      <video ref={videoRef} className="battle-video" playsInline muted />
      <canvas ref={canvasRef} hidden />
      <div className="scan-frame" aria-hidden="true" />

      <header className="scan-header">
        <strong>QRコードを読み込む</strong>
        <button className="btn exit-button" onClick={onClose}>
          閉じる
        </button>
      </header>

      <div className="scan-panel">
        {cameraError ? (
          <p className="scan-note">{cameraError}</p>
        ) : (
          <p className="scan-note">会場のQRコードを枠の中に映してください</p>
        )}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <form className="scan-manual" onSubmit={handleManual}>
          <input
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            placeholder="コードを入力（例：ARBOSS:BOSS:slime）"
            autoComplete="off"
            aria-label="QRコードの内容"
          />
          <button type="submit" className="btn primary">
            決定
          </button>
        </form>
      </div>
    </div>
  );
}
