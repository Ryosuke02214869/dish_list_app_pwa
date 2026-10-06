import { useId } from "react";
import { Button } from "./Button";
import { useOverlay, usePresence } from "./overlay";

/**
 * 確認ダイアログ（REQUIREMENTS.md 16章：confirm() の代わり）。
 * 画面中央に出し、取り消しと実行の2つのボタンを並べる。
 */

const ANIMATION_MS = 150;

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message?: string;
  confirmLabel: string;
  /** 削除など、取り消せない操作のとき true にする */
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  danger,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const titleId = useId();
  const { mounted, shown } = usePresence(open, ANIMATION_MS);
  useOverlay(open, onCancel);

  if (!mounted) return null;

  return (
    <div
      className={`fixed inset-0 z-40 grid place-items-center bg-scrim px-8 transition-opacity duration-150 ${shown ? "opacity-100" : "pointer-events-none opacity-0"}`}
      onClick={onCancel}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-[320px] rounded-lg bg-surface p-5 shadow-card"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id={titleId} className="text-base font-bold">
          {title}
        </h2>
        {message && <p className="mt-2 text-sm text-text-sub">{message}</p>}
        <div className="mt-5 flex gap-2.5">
          {/* 取り消せない操作を誤って実行しないよう、最初のフォーカスは「やめる」に置く */}
          <Button variant="secondary" onClick={onCancel} autoFocus>
            やめる
          </Button>
          <Button variant={danger ? "danger" : "primary"} className="flex-1" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
