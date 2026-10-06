/**
 * ブラウザに、このサイトのデータを自動で消さないよう求める（REQUIREMENTS.md 10章「データ保全」）。
 * 断られても動作は続ける。結果は確認用に返すだけ。
 */
export async function requestPersistentStorage(): Promise<boolean> {
  if (!navigator.storage?.persist) return false;
  try {
    if (await navigator.storage.persisted()) return true;
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}
