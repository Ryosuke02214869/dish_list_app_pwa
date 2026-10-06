import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

/**
 * 入力欄（DESIGN.md 5章 Input / Textarea）。
 * 文字は16px以上にする（iOS Safariがフォーカス時に自動で拡大するのを防ぐ）。
 */

/** 入力欄の見た目。TagEditor など、枠だけを使いたい部品からも参照する */
export const INPUT_FRAME_CLASSES =
  "rounded-md border border-border bg-surface-muted transition-colors focus-within:border-primary focus-within:bg-surface";

const CONTROL_CLASSES = `w-full ${INPUT_FRAME_CLASSES} px-3.5 py-3 text-base outline-none placeholder:text-text-muted`;

interface FieldProps {
  label: string;
  htmlFor: string;
  required?: boolean;
  /** 入力欄の下に出す注意書き（重複の警告など） */
  hint?: ReactNode;
  children: ReactNode;
}

export function Field({ label, htmlFor, required, hint, children }: FieldProps) {
  return (
    <div className="mt-4">
      <label htmlFor={htmlFor} className="mb-1.5 block text-[13px] font-bold">
        {label}
        {required && <span className="ml-1 text-[11px] text-primary-strong">必須</span>}
      </label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-warning">{hint}</p>}
    </div>
  );
}

export function TextInput({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${CONTROL_CLASSES} ${className}`} {...props} />;
}

export function TextArea({
  className = "",
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`${CONTROL_CLASSES} min-h-[120px] resize-y leading-[1.6] ${className}`}
      {...props}
    />
  );
}
