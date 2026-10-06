import { useLiveQuery } from "dexie-react-hooks";
import { useSyncExternalStore } from "react";
import { getMeta } from "../../db/metaRepository";
import { countDirty } from "../../db/syncRepository";
import { syncEngine } from "../../sync";
import { describeSyncStatus, type SyncStatus } from "./syncStatus";

/** 同期状態を返す。エンジンの状態やデータベースが変わると、自動で更新される */
export function useSyncStatus(): SyncStatus {
  const engineState = useSyncExternalStore(syncEngine.subscribe, syncEngine.getState);
  const pendingCount = useLiveQuery(countDirty) ?? 0;
  const lastSyncedAt = useLiveQuery(() => getMeta("lastSyncedAt"));
  return describeSyncStatus(engineState, pendingCount, lastSyncedAt);
}

/** 手動で同期する（F-12） */
export function requestManualSync(): Promise<void> {
  return syncEngine.requestSync();
}
