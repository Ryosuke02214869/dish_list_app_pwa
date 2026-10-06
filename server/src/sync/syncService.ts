import {
  type Dish,
  type DishChange,
  type PushResult,
  SYNC_LIMITS,
  type SyncRequest,
  type SyncResponse,
} from "@dish-list/shared";
import type { SqliteDatabase } from "../db/database";
import type { DishStore } from "../db/dishStore";
import { resolveChange } from "./resolveChange";

/**
 * 1回の同期（REQUIREMENTS.md 6.3）。Push と Pull を1つのトランザクションで行う。
 * 途中で失敗したら何も保存しないので、端末は同じ内容をそのまま再送すればよい。
 */
export function createSyncService(db: SqliteDatabase, store: DishStore) {
  const sync = db.transaction((request: SyncRequest): SyncResponse => {
    const results = request.changes.map((change) => push(store, change));
    const rejectedIds = results.filter((r) => r.status === "rejected").map((r) => r.id);
    return { results, ...pull(store, request.lastSeq, rejectedIds) };
  });

  return { sync: (request: SyncRequest): SyncResponse => sync(request) };
}

/** 1件を判定して保存し、その結果を返す */
function push(store: DishStore, change: DishChange): PushResult {
  const existing = store.get(change.id);
  const decision = resolveChange(existing, change);

  if (existing && (decision === "alreadyApplied" || decision === "reject")) {
    return {
      id: existing.id,
      status: decision === "reject" ? "rejected" : "applied",
      version: existing.version,
      serverSeq: existing.serverSeq,
    };
  }

  const { baseVersion: _baseVersion, ...incoming } = change;
  const saved: Dish = {
    ...incoming,
    // 作成者と作成日時は最初に登録されたものを保つ
    createdAt: existing?.createdAt ?? incoming.createdAt,
    createdBy: existing?.createdBy ?? incoming.createdBy,
    version: (existing?.version ?? 0) + 1,
    serverSeq: store.nextSeq(),
  };
  store.save(saved);
  return { id: saved.id, status: "applied", version: saved.version, serverSeq: saved.serverSeq };
}

/**
 * lastSeq より後に変わった料理を返す。
 * 競合で負けた料理は、端末が勝った側の内容を受け取れるよう、連番に関係なく加える。
 */
function pull(
  store: DishStore,
  requestedLastSeq: number,
  rejectedIds: readonly string[],
): Omit<SyncResponse, "results"> {
  // 端末の lastSeq がサーバーより先にある＝サーバーをバックアップから戻した。最初から送り直す
  const since = requestedLastSeq > store.currentSeq() ? 0 : requestedLastSeq;

  const page = store.listSince(since, SYNC_LIMITS.pullMaxCount + 1);
  const hasMore = page.length > SYNC_LIMITS.pullMaxCount;
  const changes = page.slice(0, SYNC_LIMITS.pullMaxCount);
  const lastSeq = changes.at(-1)?.serverSeq ?? since;

  const includedIds = new Set(changes.map((dish) => dish.id));
  for (const id of rejectedIds) {
    const winner = store.get(id);
    if (winner && !includedIds.has(id)) {
      changes.push(winner);
      includedIds.add(id);
    }
  }

  return { changes, lastSeq, hasMore };
}
