import { type DishChange, SYNC_LIMITS, type SyncResponse } from "@dish-list/shared";
import { type SendSync, SyncError } from "./syncApi";

/**
 * 同期エンジン（REQUIREMENTS.md 6.2、6.3）。
 * - 同時に実行しない。実行中に要求が来たら、終わった後にもう1回だけ実行する
 * - 1回の同期では、送る変更か受け取る差分が残っている間、Push と Pull を繰り返す
 * - 失敗したら状態に記録して終わる。再試行は次のきっかけ（起動、画面表示、オンライン復帰、保存）に任せる
 */

/** 最後の同期の結果 */
export type SyncResult = "never" | "ok" | "offline" | "error";

export interface SyncState {
  running: boolean;
  lastResult: SyncResult;
}

/** 端末のデータベースとのやりとり（db/syncRepository.ts の関数を渡す） */
export interface SyncLocalStore {
  getSyncCursor: () => Promise<{ clientId: string; lastSeq: number }>;
  collectChanges: (limit: number) => Promise<DishChange[]>;
  applySyncResponse: (response: SyncResponse, pushed: readonly DishChange[]) => Promise<void>;
}

export interface SyncEngineDeps {
  send: SendSync;
  store: SyncLocalStore;
  /** 複数のタブで同時に同期しないためのロック。省略時は Web Locks API（なければロックなし） */
  withLock?: <T>(task: () => Promise<T>) => Promise<T>;
}

/** 1回の同期で Push と Pull を繰り返す上限（無限に続けないための安全策） */
const MAX_ROUNDS = 20;
const LOCK_NAME = "dish-list-sync";

export type SyncEngine = ReturnType<typeof createSyncEngine>;

export function createSyncEngine({ send, store, withLock = withWebLock }: SyncEngineDeps) {
  let state: SyncState = { running: false, lastResult: "never" };
  const listeners = new Set<() => void>();
  const setState = (patch: Partial<SyncState>) => {
    state = { ...state, ...patch };
    for (const listener of listeners) listener();
  };

  let current: Promise<void> | null = null;
  let requestedAgain = false;

  async function syncRounds(): Promise<void> {
    for (let round = 0; round < MAX_ROUNDS; round++) {
      const cursor = await store.getSyncCursor();
      const changes = await store.collectChanges(SYNC_LIMITS.pushMaxCount);
      const response = await send({ ...cursor, changes });
      await store.applySyncResponse(response, changes);

      const morePush = changes.length === SYNC_LIMITS.pushMaxCount;
      if (!response.hasMore && !morePush) return;
    }
  }

  /** 1回の同期を実行し、結果を状態に記録する。失敗したら false */
  async function runOnce(): Promise<boolean> {
    try {
      await withLock(syncRounds);
      setState({ lastResult: "ok" });
      return true;
    } catch (error) {
      console.warn("[sync]", error);
      setState({
        lastResult: error instanceof SyncError && error.kind === "offline" ? "offline" : "error",
      });
      return false;
    }
  }

  return {
    /**
     * 同期を要求する。実行中なら、終わった後にもう1回だけ実行する。
     * 戻り値は、要求に応える同期がすべて終わったときに解決する（失敗しても reject しない）。
     */
    requestSync(): Promise<void> {
      if (current) {
        requestedAgain = true;
        return current;
      }
      setState({ running: true });
      current = (async () => {
        let succeeded: boolean;
        do {
          requestedAgain = false;
          succeeded = await runOnce();
        } while (requestedAgain && succeeded);
      })().finally(() => {
        current = null;
        setState({ running: false });
      });
      return current;
    },

    getState: (): SyncState => state,

    /** 状態の変化を受け取る（React の useSyncExternalStore に渡す形） */
    subscribe(listener: () => void): () => void {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

/** Web Locks API で、同じ端末の複数のタブが同時に同期しないようにする */
async function withWebLock<T>(task: () => Promise<T>): Promise<T> {
  if (typeof navigator === "undefined" || !navigator.locks) return task();
  return navigator.locks.request(LOCK_NAME, task);
}
