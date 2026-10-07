import { PlusIcon } from "./icons";

/**
 * 右下に固定する追加ボタン（DESIGN.md 5章 FAB）。
 * 広い画面では、中央寄せのコンテンツの右端に合わせる（スマホ幅は480px、PCは1080px）。
 */
export function Fab({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed right-[max(var(--spacing-gutter),calc(50vw-var(--container-app)/2+var(--spacing-gutter)))] md:right-[max(var(--spacing-gutter),calc(50vw-var(--container-wide)/2+var(--spacing-gutter)))] bottom-[calc(24px+env(safe-area-inset-bottom))] z-20 inline-flex h-14 items-center gap-1.5 rounded-full bg-primary pr-[22px] pl-[18px] text-[15px] font-bold text-on-primary shadow-float active:bg-primary-pressed"
    >
      <PlusIcon />
      {label}
    </button>
  );
}
