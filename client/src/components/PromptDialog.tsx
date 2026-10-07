import { type FormEvent, useId, useState } from "react";
import { Button } from "./Button";
import { TextInput } from "./Field";
import { useOverlay, usePresence } from "./overlay";

/**
 * 1行の入力欄つきの確認ダイアログ（DESIGN.md 5章 PromptDialog）。見た目は ConfirmDialog と同じ。
 * 開くたびに key を変えて作り直し、入力を初期化する前提。
 */

const ANIMATION_MS = 150;

interface PromptDialogProps {
  open: boolean;
  title: string;
  message?: string;
  label: string;
  initialValue: string;
  maxLength?: number;
  confirmLabel: string;
  /** 入力を確かめる。問題があれば表示する文言、なければ null */
  validate: (value: string) => string | null;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

export function PromptDialog({
  open,
  title,
  message,
  label,
  initialValue,
  maxLength,
  confirmLabel,
  validate,
  onConfirm,
  onCancel,
}: PromptDialogProps) {
  const titleId = useId();
  const inputId = useId();
  const [value, setValue] = useState(initialValue);
  const { mounted, shown } = usePresence(open, ANIMATION_MS);
  useOverlay(open, onCancel);

  if (!mounted) return null;

  const error = validate(value);
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (error === null) onConfirm(value);
  };

  return (
    <div
      className={`fixed inset-0 z-40 grid place-items-center bg-scrim px-8 transition-opacity duration-150 ${shown ? "opacity-100" : "pointer-events-none opacity-0"}`}
      onClick={onCancel}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onSubmit={handleSubmit}
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-[360px] rounded-lg bg-surface p-5 shadow-card"
      >
        <h2 id={titleId} className="text-base font-bold">
          {title}
        </h2>
        {message && <p className="mt-2 text-sm text-text-sub">{message}</p>}
        <label htmlFor={inputId} className="mt-4 mb-1.5 block text-[13px] font-bold">
          {label}
        </label>
        <TextInput
          id={inputId}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          maxLength={maxLength}
          autoFocus
          enterKeyHint="done"
        />
        {error && <p className="mt-1.5 text-xs text-warning">{error}</p>}
        <div className="mt-5 flex gap-2.5">
          <Button variant="secondary" onClick={onCancel}>
            やめる
          </Button>
          <Button type="submit" className="flex-1" disabled={error !== null}>
            {confirmLabel}
          </Button>
        </div>
      </form>
    </div>
  );
}
