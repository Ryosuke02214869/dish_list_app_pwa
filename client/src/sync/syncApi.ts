import {
  API_PATHS,
  type SyncRequest,
  type SyncResponse,
  syncResponseSchema,
} from "@dish-list/shared";

/**
 * 同期APIの呼び出し（REQUIREMENTS.md 8章）。UIからは呼ばず、同期エンジンだけが使う。
 * 受け取った内容は端末のデータベースに書き込む前に zod で検証する。
 */

/** リクエストのタイムアウト（REQUIREMENTS.md 6.2） */
const TIMEOUT_MS = 10_000;

/**
 * 同期の失敗の種類。
 * - offline：サーバーに届かない（Tailscale がオフ、PCが停止、タイムアウトなど）
 * - server：届いたが、エラーや想定外の応答が返った
 */
export type SyncFailureKind = "offline" | "server";

export class SyncError extends Error {
  constructor(
    readonly kind: SyncFailureKind,
    message: string,
  ) {
    super(message);
    this.name = "SyncError";
  }
}

/**
 * 間にある中継（Tailscale Serve や開発時の Vite）が、サーバーに届かなかったときに返す状態。
 * 端末から見ればサーバーに接続できないのと同じなので offline として扱う。
 */
const PROXY_UNREACHABLE_STATUSES = new Set([502, 503, 504]);

export type SendSync = (request: SyncRequest) => Promise<SyncResponse>;

export const postSync: SendSync = async (request) => {
  let response: Response;
  try {
    response = await fetch(API_PATHS.sync, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
  } catch (error) {
    throw new SyncError("offline", `サーバーに接続できません: ${String(error)}`);
  }

  if (PROXY_UNREACHABLE_STATUSES.has(response.status)) {
    throw new SyncError("offline", `サーバーに接続できません（HTTP ${response.status}）`);
  }
  if (!response.ok) {
    throw new SyncError("server", `同期に失敗しました（HTTP ${response.status}）`);
  }
  const parsed = syncResponseSchema.safeParse(await response.json().catch(() => undefined));
  if (!parsed.success) {
    throw new SyncError("server", "サーバーの応答が正しくありません");
  }
  return parsed.data;
};
