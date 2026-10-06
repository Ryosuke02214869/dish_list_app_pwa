import type { SyncRequest, SyncResponse } from "@dish-list/shared";
import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { healthRoute } from "./routes/health";
import { staticFilesRoute } from "./routes/staticFiles";
import { syncRoute } from "./routes/sync";

/**
 * HTTP の入口。ルートの組み立てだけを行い、処理の中身は受け取った関数に任せる。
 * （テストでは、実際のサーバーを起動せずに app.request() で呼び出せる）
 */

export interface AppDependencies {
  version: string;
  sync: (request: SyncRequest) => SyncResponse;
  /** PWA本体のフォルダー（client/dist）。省略すると /api だけを返す（開発時は Vite が配信する） */
  staticDir?: string;
}

/** リクエストの最大サイズ。料理200件（メモ2000文字）を送っても収まる大きさ */
const MAX_BODY_BYTES = 4 * 1024 * 1024;

export function createApp({ version, sync, staticDir }: AppDependencies) {
  const api = new Hono()
    .use(async (c, next) => {
      await next();
      // APIの応答はキャッシュさせない（Service Worker やブラウザに古いデータを残さない）
      c.header("Cache-Control", "no-store");
    })
    .use(bodyLimit({ maxSize: MAX_BODY_BYTES }))
    .route("/health", healthRoute(version))
    .route("/sync", syncRoute(sync))
    // 存在しない /api は、画面（index.html）ではなく 404 を返す
    .all("*", (c) => c.json({ error: "not_found" }, 404));

  const app = new Hono().route("/api", api);
  if (staticDir) app.route("/", staticFilesRoute(staticDir));
  return app;
}
