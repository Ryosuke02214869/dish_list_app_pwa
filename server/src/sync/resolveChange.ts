import type { Dish, DishChange } from "@dish-list/shared";

/**
 * Pushされた1件をどう扱うかを決める（REQUIREMENTS.md 6.3）。データベースには触らない。
 *
 * 判定の順番：
 * 1. サーバーにない                         → insert（新規として保存）
 * 2. id・updatedAt・clientId が同じ          → alreadyApplied（再送。何も変えずに成功を返す）
 * 3. baseVersion がサーバーの version と同じ  → accept（競合なし）
 * 4. 競合：後勝ち                            → accept か reject
 *
 * 2 を 3 より先に見るのは、成功したのに応答が届かず再送された変更を、競合と誤判定しないため。
 */
export type ChangeDecision = "insert" | "alreadyApplied" | "accept" | "reject";

export function resolveChange(existing: Dish | undefined, incoming: DishChange): ChangeDecision {
  if (!existing) return "insert";
  if (isSameChange(existing, incoming)) return "alreadyApplied";
  if (incoming.baseVersion === existing.version) return "accept";
  return isNewer(incoming, existing) ? "accept" : "reject";
}

function isSameChange(existing: Dish, incoming: DishChange): boolean {
  return existing.updatedAt === incoming.updatedAt && existing.clientId === incoming.clientId;
}

/**
 * 競合したとき、incoming のほうを採用するか。
 * updatedAt が新しいほうを採用する。同じ時刻なら updatedBy、それも同じなら clientId の
 * 文字列の大きいほうを採用し、どの端末から見ても結果が同じになるようにする。
 */
export function isNewer(incoming: Dish, existing: Dish): boolean {
  const byTime = Date.parse(incoming.updatedAt) - Date.parse(existing.updatedAt);
  if (byTime !== 0) return byTime > 0;
  if (incoming.updatedBy !== existing.updatedBy) return incoming.updatedBy > existing.updatedBy;
  return incoming.clientId > existing.clientId;
}
