import type { ReactNode } from "react";
import { BowlIcon } from "./icons";

/**
 * 画面上部のバー（DESIGN.md 5章 AppBar）。スクロールしても上に残る。
 * 右側の actions には同期状態や設定ボタンを、children には検索欄やタグを置く。
 */

interface AppBarProps {
  actions?: ReactNode;
  children?: ReactNode;
}

export function AppBar({ actions, children }: AppBarProps) {
  return (
    <header className="sticky top-0 z-10 bg-bg/92 px-gutter pt-[calc(12px+env(safe-area-inset-top))] pb-3 backdrop-blur-md">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="grid size-[34px] place-items-center rounded-[10px] bg-primary text-on-primary">
            <BowlIcon />
          </div>
          <div>
            <h1 className="text-[20px] leading-tight font-bold tracking-[.02em]">ごはんメモ</h1>
            <p className="text-[11px] leading-tight text-text-muted">家族の料理リスト</p>
          </div>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      {children}
    </header>
  );
}
