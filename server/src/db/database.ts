import Database from "better-sqlite3";
import { MIGRATIONS } from "./migrations";

export type SqliteDatabase = Database.Database;

/**
 * SQLite を開き、スキーマを最新にする。
 * ":memory:" を渡すとメモリ上のデータベースになる（テスト用）。
 */
export function openDatabase(filename: string): SqliteDatabase {
  const db = new Database(filename);
  // WAL：読み込みと書き込みが同時にできる。コンテナの停止時にも壊れにくい
  db.pragma("journal_mode = WAL");
  db.pragma("synchronous = NORMAL");
  db.pragma("foreign_keys = ON");
  migrate(db);
  return db;
}

/**
 * まだ適用していないマイグレーションを順に適用する。
 * 適用済みの数は SQLite の user_version に記録する。
 */
function migrate(db: SqliteDatabase): void {
  const applied = db.pragma("user_version", { simple: true }) as number;
  for (const [index, sql] of MIGRATIONS.entries()) {
    if (index < applied) continue;
    db.transaction(() => {
      db.exec(sql);
      db.pragma(`user_version = ${index + 1}`);
    })();
  }
}
