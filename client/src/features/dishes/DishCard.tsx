import { LinkIcon, StarIcon } from "../../components/icons";
import type { LocalDish } from "../../db/database";
import { formatDateTime } from "../../lib/formatDateTime";
import { CookButton } from "./CookButton";
import { describeCooking } from "./cookingLabel";
import { TagList } from "./TagList";

/**
 * 一覧の料理カード（F-04、F-17、DESIGN.md 5章 DishCard）。
 * カードを押すと編集を開き、右上の「作った」は開かずに記録する。
 * ボタンの中にボタンは置けないので、カード全体を押せる領域と「作った」ボタンを重ねて配置する。
 */
export function DishCard({ dish, onOpen }: { dish: LocalDish; onOpen: (dish: LocalDish) => void }) {
  const memoFirstLine = dish.memo.split("\n", 1)[0]?.trim();
  const cooking = describeCooking(dish);

  return (
    <div className="relative rounded-lg bg-surface shadow-card">
      <button
        type="button"
        onClick={() => onOpen(dish)}
        className="block w-full rounded-lg p-4 text-left transition-transform duration-100 active:scale-[.985]"
      >
        {/* 右上の「作った」ボタンと重ならないよう、料理名の右側をあけておく */}
        <p className="mb-1.5 flex items-center gap-1.5 pr-24 text-[17px] leading-[1.4] font-bold">
          {dish.favorite && (
            <span className="flex-none text-primary-strong" role="img" aria-label="お気に入り">
              <StarIcon filled />
            </span>
          )}
          <span className="min-w-0 break-words">{dish.name}</span>
          {dish.recipeUrl && (
            <span className="flex-none text-text-muted" role="img" aria-label="参考レシピあり">
              <LinkIcon />
            </span>
          )}
        </p>
        {memoFirstLine && (
          <p className="mb-2.5 truncate text-[13px] text-text-sub">{memoFirstLine}</p>
        )}
        <TagList tags={dish.tags} />
        <p className="mt-2.5 flex flex-wrap gap-x-3 text-[11px] text-text-muted">
          {cooking && <span className="font-medium text-text-sub">{cooking}</span>}
          <span>
            {dish.updatedBy}・{formatDateTime(dish.updatedAt)}
          </span>
        </p>
      </button>
      <CookButton dish={dish} className="absolute top-3 right-3" />
    </div>
  );
}
