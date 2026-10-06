import { useEffect, useRef, useState } from "react";

/**
 * 重なって表示する部品（ボトムシート、確認ダイアログ）の共通の動き。
 * - 開いている間は背面のスクロールを止める
 * - Esc キーでは、いちばん上に開いているものだけを閉じる
 */

const openOverlays: Array<{ close: () => void }> = [];

function handleKeyDown(event: KeyboardEvent) {
  if (event.key !== "Escape") return;
  openOverlays.at(-1)?.close();
}

export function useOverlay(open: boolean, onClose: () => void): void {
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    const entry = { close: () => onCloseRef.current() };
    openOverlays.push(entry);
    if (openOverlays.length === 1) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      openOverlays.splice(openOverlays.indexOf(entry), 1);
      if (openOverlays.length === 0) {
        document.removeEventListener("keydown", handleKeyDown);
        document.body.style.overflow = "";
      }
    };
  }, [open]);
}

/**
 * 開閉のアニメーションのために、閉じた後もしばらく描画を残す。
 * mounted：描画するか／shown：表示状態のスタイルにするか
 */
export function usePresence(open: boolean, durationMs: number) {
  /** 表示状態のスタイルまで進んだか。閉じた後はアニメーションが終わるまで true のまま */
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    if (open) {
      // 非表示の状態を一度描画してから表示状態にし、CSSのトランジションを効かせる
      let frame = requestAnimationFrame(() => {
        frame = requestAnimationFrame(() => setEntered(true));
      });
      return () => cancelAnimationFrame(frame);
    }
    const timer = setTimeout(() => setEntered(false), durationMs);
    return () => clearTimeout(timer);
  }, [open, durationMs]);

  return { mounted: open || entered, shown: open && entered };
}
