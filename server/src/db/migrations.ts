/**
 * スキーマの変更履歴（REQUIREMENTS.md 7.3）。上から順に1回だけ適用する。
 *
 * 料理に項目を追加するときは：
 * 1. ここの末尾に ALTER TABLE を追加する（既存の行を消さず、適用済みの項目は書き換えない）
 * 2. dishStore.ts の行と Dish の変換に項目を加える
 */
export const MIGRATIONS: readonly string[] = [
  // 1: 初期スキーマ
  `
  CREATE TABLE dishes (
    id          TEXT PRIMARY KEY,
    name        TEXT    NOT NULL,
    memo        TEXT    NOT NULL,
    tags        TEXT    NOT NULL,  -- 文字列配列のJSON
    created_at  TEXT    NOT NULL,
    created_by  TEXT    NOT NULL,
    updated_at  TEXT    NOT NULL,
    updated_by  TEXT    NOT NULL,
    client_id   TEXT    NOT NULL,
    deleted     INTEGER NOT NULL,  -- 0 または 1
    version     INTEGER NOT NULL,
    server_seq  INTEGER NOT NULL
  );
  CREATE INDEX dishes_server_seq ON dishes (server_seq);

  CREATE TABLE meta (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
  INSERT INTO meta (key, value) VALUES ('currentSeq', '0');
  `,
];
