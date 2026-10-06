import type { DishChange, SyncResponse } from "@dish-list/shared";
import { applyPushResult, mergeServerDish, type PushedSnapshot } from "../sync/mergeRules";
import { db, type LocalDish } from "./database";
import { getMeta, setMeta } from "./metaRepository";

/**
 * 同期のための端末データベースの読み書き。同期エンジンだけが使う。
 */

/** 送る対象（未同期の料理）を、古い変更から順に最大 limit 件返す */
export async function collectChanges(limit: number): Promise<DishChange[]> {
  const dirty = await db.dishes.filter((dish) => dish.dirty).toArray();
  return dirty
    .sort((a, b) => a.updatedAt.localeCompare(b.updatedAt))
    .slice(0, limit)
    .map(toChange);
}

function toChange({ dirty: _dirty, ...change }: LocalDish): DishChange {
  return change;
}

/** 未同期の料理の件数（同期状態の表示に使う） */
export function countDirty(): Promise<number> {
  return db.dishes.filter((dish) => dish.dirty).count();
}

/** 次のリクエストに使う値 */
export async function getSyncCursor(): Promise<{ clientId: string; lastSeq: number }> {
  const [clientId, lastSeq] = await Promise.all([getMeta("clientId"), getMeta("lastSeq")]);
  if (!clientId) throw new Error("端末IDがありません");
  return { clientId, lastSeq: lastSeq ?? 0 };
}

/**
 * 同期の応答を端末に反映する。Pushの結果 → Pullの内容 → lastSeq の順に、1つのトランザクションで書き込む。
 * pushed には、このリクエストで送った変更を渡す。
 */
export async function applySyncResponse(
  response: SyncResponse,
  pushed: readonly DishChange[],
  syncedAt: string = new Date().toISOString(),
): Promise<void> {
  const snapshot: PushedSnapshot = new Map(pushed.map((change) => [change.id, change.updatedAt]));

  await db.transaction("rw", db.dishes, db.meta, async () => {
    for (const result of response.results) {
      const next = applyPushResult(await db.dishes.get(result.id), result, snapshot);
      if (next) await db.dishes.put(next);
    }
    for (const server of response.changes) {
      const next = mergeServerDish(await db.dishes.get(server.id), server, snapshot);
      if (next) await db.dishes.put(next);
    }
    await setMeta("lastSeq", response.lastSeq);
    await setMeta("lastSyncedAt", syncedAt);
  });
}
