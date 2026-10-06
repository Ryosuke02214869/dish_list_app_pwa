import type { LocalDish } from "../../db/database";
import { formatDateTime } from "../../lib/formatDateTime";
import { TagList } from "./TagList";

/** 一覧の料理カード（F-04、DESIGN.md 5章 DishCard）。押すと編集を開く */
export function DishCard({ dish, onOpen }: { dish: LocalDish; onOpen: (dish: LocalDish) => void }) {
  const memoFirstLine = dish.memo.split("\n", 1)[0]?.trim();
  return (
    <button
      type="button"
      onClick={() => onOpen(dish)}
      className="block w-full rounded-lg bg-surface p-4 text-left shadow-card transition-transform duration-100 active:scale-[.985]"
    >
      <p className="mb-1.5 text-[17px] leading-[1.4] font-bold">{dish.name}</p>
      {memoFirstLine && (
        <p className="mb-2.5 truncate text-[13px] text-text-sub">{memoFirstLine}</p>
      )}
      <TagList tags={dish.tags} />
      <p className="mt-2.5 text-[11px] text-text-muted">
        {dish.updatedBy}・{formatDateTime(dish.updatedAt)}
      </p>
    </button>
  );
}
