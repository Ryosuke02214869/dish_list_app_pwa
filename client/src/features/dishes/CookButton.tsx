import { CheckIcon } from "../../components/icons";
import { useToast } from "../../components/Toast";
import type { LocalDish } from "../../db/database";
import { markCooked, restoreCooking } from "../../db/dishRepository";
import { useActor } from "../session/session";

/**
 * 「作った」ボタン（F-16）。一覧のカードと編集シートで使う。
 * 押すとすぐに記録し、誤操作に備えてトーストに「取り消す」を出す。
 */
export function CookButton({ dish, className = "" }: { dish: LocalDish; className?: string }) {
  const actor = useActor();
  const showToast = useToast();

  const handleClick = async () => {
    try {
      const previous = await markCooked(dish.id, actor);
      showToast(`「${dish.name}」を作ったと記録しました`, {
        label: "取り消す",
        onClick: () => void restoreCooking(dish.id, previous, actor),
      });
    } catch {
      showToast("記録できませんでした");
    }
  };

  return (
    <button
      type="button"
      onClick={() => void handleClick()}
      aria-label={`「${dish.name}」を作ったと記録する`}
      className={`inline-flex h-9 flex-none items-center gap-1 rounded-full border border-primary-border bg-primary-soft px-3 text-[13px] font-bold text-primary-strong active:opacity-70 ${className}`}
    >
      <CheckIcon size={14} />
      作った
    </button>
  );
}
