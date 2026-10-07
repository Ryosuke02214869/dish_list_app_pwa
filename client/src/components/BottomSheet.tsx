import { type ReactNode, useId } from "react";
import { CloseIcon } from "./icons";
import { useOverlay, usePresence } from "./overlay";

/**
 * 下から出るシート（DESIGN.md 5章 BottomSheet）。新規・編集・設定の画面に使う。
 * スクリム、Esc、閉じるボタンで閉じる。本文はスクロールし、フッターは下に固定する。
 * PC（幅768px以上）では、画面中央のダイアログとして出す（DESIGN.md 9章）。
 */

const ANIMATION_MS = 250;

/** 位置と形。スマホは下に固定、PC は中央に置く */
const LAYOUT_CLASSES =
  "bottom-0 max-h-[92dvh] max-w-app rounded-t-xl md:top-1/2 md:bottom-auto md:max-h-[85dvh] md:max-w-[560px] md:-translate-y-1/2 md:rounded-xl";
/** 開いた状態と閉じた状態。スマホは下からスライド、PC はフェードとわずかな拡大 */
const SHOWN_CLASSES = "translate-y-0 md:scale-100 md:opacity-100";
const HIDDEN_CLASSES = "translate-y-full md:scale-95 md:opacity-0";

interface BottomSheetProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** 下部に固定するボタン */
  footer?: ReactNode;
}

export function BottomSheet({ open, title, onClose, children, footer }: BottomSheetProps) {
  const titleId = useId();
  const { mounted, shown } = usePresence(open, ANIMATION_MS);
  useOverlay(open, onClose);

  if (!mounted) return null;

  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-scrim transition-opacity duration-200 ${shown ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={onClose}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`fixed left-1/2 z-31 flex w-full -translate-x-1/2 flex-col bg-surface shadow-sheet transition-[translate,scale,opacity] duration-250 ease-sheet ${LAYOUT_CLASSES} ${shown ? SHOWN_CLASSES : HIDDEN_CLASSES}`}
      >
        <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-border md:hidden" aria-hidden />
        <header className="flex items-center justify-between px-gutter pt-3 pb-1">
          <h2 id={titleId} className="text-lg font-bold">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            className="grid size-9 place-items-center rounded-full bg-surface-muted text-text-sub"
          >
            <CloseIcon />
          </button>
        </header>
        <div className="overflow-y-auto px-gutter pt-2 pb-4">{children}</div>
        {footer && (
          <footer className="flex gap-2.5 border-t border-border px-gutter pt-3 pb-[calc(12px+env(safe-area-inset-bottom))]">
            {footer}
          </footer>
        )}
      </section>
    </>
  );
}
