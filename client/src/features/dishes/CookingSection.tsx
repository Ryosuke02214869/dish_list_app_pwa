import { useLiveQuery } from "dexie-react-hooks";
import { Field } from "../../components/Field";
import { useToast } from "../../components/Toast";
import type { LocalDish } from "../../db/database";
import { getDish, setCookedCount } from "../../db/dishRepository";
import { useActor } from "../session/session";
import { CookButton } from "./CookButton";
import { describeCooking } from "./cookingLabel";

/**
 * 編集シートの「作った記録」（F-16、F-17、F-21）。
 * 「作った」と回数の修正は押すとすぐに保存されるので、シートを開いたときの値ではなく、
 * データベースの最新の値を表示する（編集シートの「保存する」とは別）。
 */
export function CookingSection({ dish }: { dish: LocalDish }) {
  const latest = useLiveQuery(() => getDish(dish.id), [dish.id]) ?? dish;
  const actor = useActor();
  const showToast = useToast();

  const changeCount = async (count: number) => {
    try {
      await setCookedCount(latest.id, count, actor);
    } catch {
      showToast("回数を直せませんでした");
    }
  };

  return (
    <Field label="作った記録" htmlFor="dish-cooked">
      <div className="rounded-md bg-surface-muted py-2 pr-2 pl-3.5">
        <div className="flex items-center justify-between gap-3">
          <span id="dish-cooked" className="text-sm text-text-sub">
            {describeCooking(latest) ?? "まだ記録がありません"}
          </span>
          <CookButton dish={latest} />
        </div>
        {latest.cookedCount > 0 && (
          <div className="mt-2 flex items-center justify-between gap-3 border-t border-border pt-2">
            <span className="text-xs text-text-muted">回数を直す</span>
            <div className="flex items-center gap-2">
              <StepButton
                label="回数を1回減らす"
                onClick={() => void changeCount(latest.cookedCount - 1)}
              >
                −
              </StepButton>
              <span className="min-w-[3em] text-center text-sm font-bold" aria-live="polite">
                {latest.cookedCount}回
              </span>
              <StepButton
                label="回数を1回増やす"
                onClick={() => void changeCount(latest.cookedCount + 1)}
              >
                ＋
              </StepButton>
            </div>
          </div>
        )}
      </div>
    </Field>
  );
}

function StepButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="grid size-9 place-items-center rounded-full border border-border bg-surface text-lg leading-none text-text active:bg-surface-muted"
    >
      {children}
    </button>
  );
}
