import type { DishCooking } from "@dish-list/shared";
import { formatRelativeDay } from "../../lib/formatRelativeDay";

/** 作った記録の表示（F-17）。「3日前に作った・5回」。まだ作っていなければ null */
export function describeCooking(cooking: DishCooking, now: Date = new Date()): string | null {
  if (cooking.lastCookedAt === null || cooking.cookedCount === 0) return null;
  return `${formatRelativeDay(cooking.lastCookedAt, now)}に作った・${cooking.cookedCount}回`;
}
