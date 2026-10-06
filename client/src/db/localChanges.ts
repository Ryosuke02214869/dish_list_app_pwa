/**
 * 端末で料理を変更したことの通知。同期エンジンが受け取り、少し待ってから同期する
 * （REQUIREMENTS.md 6.2「ローカルで保存した後」）。
 * サーバーから受け取った内容を書き込むときは通知しない（同期が同期を呼び続けないように）。
 */

type Listener = () => void;

const listeners = new Set<Listener>();

/** 通知を受け取る。戻り値の関数を呼ぶと受け取りをやめる */
export function onLocalChange(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function notifyLocalChange(): void {
  for (const listener of listeners) listener();
}
