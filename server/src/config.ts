import path from "node:path";
import rootPackage from "../../package.json" with { type: "json" };

/**
 * サーバーの設定。環境変数で上書きできる（Docker では docker-compose.yml で指定する）。
 */
export interface ServerConfig {
  /** 待ち受けるアドレス。手元では 127.0.0.1、コンテナ内では 0.0.0.0 にする */
  host: string;
  port: number;
  /** SQLite のファイルを置くフォルダー */
  dataDir: string;
  /** PWA本体（client/dist）のフォルダー。未指定なら /api だけを返す（開発時は Vite が配信する） */
  staticDir: string | undefined;
  /** アプリのバージョン（/api/health で返す） */
  version: string;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): ServerConfig {
  return {
    host: env.HOST ?? "127.0.0.1",
    port: Number(env.PORT ?? 8080),
    dataDir: path.resolve(env.DATA_DIR ?? "data"),
    staticDir: env.STATIC_DIR ? path.resolve(env.STATIC_DIR) : undefined,
    version: rootPackage.version,
  };
}
