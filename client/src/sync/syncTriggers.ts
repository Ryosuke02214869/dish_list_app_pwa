import { onLocalChange } from "../db/localChanges";
import { debounce } from "../lib/debounce";
import type { SyncEngine } from "./syncEngine";

/**
 * 同期のきっかけ（REQUIREMENTS.md 6.2）。iOS は Background Sync API に対応していないため、
 * アプリが前面にある間の次のタイミングで同期する。
 * - アプリの起動時
 * - 画面が表示されたとき（visibilitychange）
 * - オンラインに戻ったとき（online）
 * - 端末で保存した後（2秒のデバウンス）
 * 手動の同期ボタンは、UIから engine.requestSync() を直接呼ぶ。
 */

const LOCAL_CHANGE_DEBOUNCE_MS = 2000;

/** きっかけの監視を始める。戻り値の関数を呼ぶと監視をやめる */
export function startSyncTriggers(engine: SyncEngine): () => void {
  const sync = () => void engine.requestSync();

  const onVisibilityChange = () => {
    if (document.visibilityState === "visible") sync();
  };
  const syncAfterLocalChange = debounce(sync, LOCAL_CHANGE_DEBOUNCE_MS);

  document.addEventListener("visibilitychange", onVisibilityChange);
  window.addEventListener("online", sync);
  const stopLocalChange = onLocalChange(syncAfterLocalChange);
  sync();

  return () => {
    document.removeEventListener("visibilitychange", onVisibilityChange);
    window.removeEventListener("online", sync);
    stopLocalChange();
    syncAfterLocalChange.cancel();
  };
}
