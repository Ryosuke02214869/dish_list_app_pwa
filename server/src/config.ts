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
  /** バックアップ。保存先（BACKUP_DIR）が未指定なら作らない（開発時） */
  backup: { dir: string; keep: number; timeZone: string } | undefined;
  /** アプリのバージョン（/api/health で返す） */
  version: string;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): ServerConfig {
  return {
    host: env.HOST ?? "127.0.0.1",
    // 既定は開発用の 8787。本番（Docker）は Dockerfile で PORT=8080 を指定する。
    // 開発中の通信が、同じPCで動いている本番のコンテナ（8080）に届かないようにするため
    port: Number(env.PORT ?? 8787),
    dataDir: path.resolve(env.DATA_DIR ?? "data"),
    staticDir: env.STATIC_DIR ? path.resolve(env.STATIC_DIR) : undefined,
    backup: env.BACKUP_DIR
      ? {
          dir: path.resolve(env.BACKUP_DIR),
          keep: Number(env.BACKUP_KEEP ?? 14),
          timeZone: env.BACKUP_TIME_ZONE ?? "Asia/Tokyo",
        }
      : undefined,
    version: rootPackage.version,
  };
}
