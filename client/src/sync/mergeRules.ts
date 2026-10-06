import type { Dish, PushResult } from "@dish-list/shared";
import type { LocalDish } from "../db/database";

/**
 * サーバーから受け取った内容を、端末の料理にどう反映するかの規則（REQUIREMENTS.md 6.3 の4）。
 * データベースには触らない純粋な関数。null は「端末の料理をそのまま残す」を表す。
 *
 * 守ること：未同期（dirty）の料理は上書きしない。
 * ただし「今回送って、その後は編集していない」料理は、送った内容がサーバーで処理済みなので上書きしてよい。
 */

/** 今回のPushで送った料理。id → 送ったときの updatedAt */
export type PushedSnapshot = ReadonlyMap<string, string>;

/** 送った後に、端末でさらに編集されていないか */
function isUnchangedSincePush(local: LocalDish, pushed: PushedSnapshot): boolean {
  return pushed.get(local.id) === local.updatedAt;
}

/** サーバーの内容を、同期済みの端末の料理にする */
export function fromServer(dish: Dish): LocalDish {
  return { ...dish, dirty: false, baseVersion: dish.version };
}

/** Pullで受け取った1件を反映した結果 */
export function mergeServerDish(
  local: LocalDish | undefined,
  server: Dish,
  pushed: PushedSnapshot,
): LocalDish | null {
  if (!local) return fromServer(server);
  if (local.dirty && !isUnchangedSincePush(local, pushed)) return null;
  // 端末にあるほうが新しい版なら戻さない（念のため）
  if (!local.dirty && local.serverSeq > server.serverSeq) return null;
  return fromServer(server);
}

/**
 * Pushの結果を反映した結果。採用された料理の「未同期」を外し、サーバーの版を記録する。
 * Pullの結果に同じ料理が含まれないこと（再送で適用済みだった場合など）があるので、結果からも反映する。
 * 却下された料理は、勝った側の内容がPullの結果に含まれるので、ここでは何もしない。
 */
export function applyPushResult(
  local: LocalDish | undefined,
  result: PushResult,
  pushed: PushedSnapshot,
): LocalDish | null {
  if (!local || result.status !== "applied") return null;
  if (!isUnchangedSincePush(local, pushed)) return null;
  return {
    ...local,
    dirty: false,
    version: result.version,
    baseVersion: result.version,
    serverSeq: result.serverSeq,
  };
}
