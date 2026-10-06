import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";

/**
 * PWA本体（client/dist）の配信。1つのコンテナで画面と /api の両方を返す（CLAUDE.md）。
 * - ファイル名にハッシュが付く /assets/ は、ずっとキャッシュしてよい
 * - それ以外（index.html、sw.js、manifest など）は毎回確認させ、新しいバージョンに気づけるようにする
 * - 見つからないページは index.html を返す（画面の再読み込みでも開けるように）
 */

const IMMUTABLE = "public, max-age=31536000, immutable";
const REVALIDATE = "no-cache";

export function staticFilesRoute(staticDir: string) {
  return new Hono()
    .use(async (c, next) => {
      await next();
      // serveStatic は自分で応答を作るので、できた応答にキャッシュの指定を付ける
      if (c.res.ok) {
        c.res.headers.set(
          "Cache-Control",
          c.req.path.startsWith("/assets/") ? IMMUTABLE : REVALIDATE,
        );
      }
    })
    .use(serveStatic({ root: staticDir }))
    .get("*", (c, next) =>
      // 「ページ」のときだけ index.html を返す。存在しないファイル（古い /assets/ など）は 404 にする
      looksLikeFile(c.req.path) ? c.notFound() : next(),
    )
    .get("*", serveStatic({ root: staticDir, path: "index.html" }));
}

/** 最後の区切りに拡張子があるか（/assets/index-abc.js など） */
function looksLikeFile(requestPath: string): boolean {
  return /\.[^/]+$/.test(requestPath);
}
