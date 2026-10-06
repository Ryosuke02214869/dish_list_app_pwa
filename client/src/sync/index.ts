import { applySyncResponse, collectChanges, getSyncCursor } from "../db/syncRepository";
import { postSync } from "./syncApi";
import { createSyncEngine } from "./syncEngine";

/** アプリ全体で1つだけ使う同期エンジン。実際のAPIと端末のデータベースにつなぐ */
export const syncEngine = createSyncEngine({
  send: postSync,
  store: { getSyncCursor, collectChanges, applySyncResponse },
});

export { startSyncTriggers } from "./syncTriggers";
