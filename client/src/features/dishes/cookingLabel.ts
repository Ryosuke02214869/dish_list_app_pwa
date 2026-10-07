import type { DishCooking } from "@dish-list/shared";
import { formatRelativeDay } from "../../lib/formatRelativeDay";

/**
 * 作った記録の表示（F-17）。「今日作った・1回」「3日前に作った・5回」「9/1に作った・2回」。
 * まだ作っていなければ null
 */
export function describeCooking(cooking: DishCooking, now: Date = new Date()): string | null {
  if (cooking.lastCookedAt === null || cooking.cookedCount === 0) return null;
  const day = formatRelativeDay(cooking.lastCookedAt, now);
  // 「今日」「昨日」には「に」を付けない
  const when = day === "今日" || day === "昨日" ? day : `${day}に`;
  return `${when}作った・${cooking.cookedCount}回`;
}
