import fs from "node:fs";
import path from "node:path";
import { serve } from "@hono/node-server";
import { createApp } from "./app";
import { loadConfig } from "./config";
import { openDatabase } from "./db/database";
import { createDishStore } from "./db/dishStore";
import { createSyncService } from "./sync/syncService";

/** サーバーの起動。部品を組み立ててつなぐだけにする */

const DATABASE_FILE = "dish-list.db";

const config = loadConfig();
fs.mkdirSync(config.dataDir, { recursive: true });

const db = openDatabase(path.join(config.dataDir, DATABASE_FILE));
const syncService = createSyncService(db, createDishStore(db));
const app = createApp({
  version: config.version,
  sync: syncService.sync,
  staticDir: config.staticDir,
});

const server = serve({ fetch: app.fetch, hostname: config.host, port: config.port }, (info) => {
  console.log(`ごはんメモ server ${config.version}: http://${info.address}:${info.port}`);
});

// コンテナの停止時などに、データベースを閉じてから終了する
for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    server.close();
    db.close();
    process.exit(0);
  });
}
