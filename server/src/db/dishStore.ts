import type { Dish } from "@dish-list/shared";
import type { SqliteDatabase } from "./database";

/**
 * 料理テーブルと連番の読み書き。SQL はこのファイルにだけ書く。
 * トランザクションは呼び出す側（syncService）が張る。
 */

/** dishes テーブルの1行 */
interface DishRow {
  id: string;
  name: string;
  memo: string;
  tags: string;
  favorite: number;
  recipe_url: string;
  cooked_count: number;
  last_cooked_at: string | null;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
  client_id: string;
  deleted: number;
  version: number;
  server_seq: number;
}

function toDish(row: DishRow): Dish {
  return {
    id: row.id,
    name: row.name,
    memo: row.memo,
    tags: JSON.parse(row.tags) as string[],
    favorite: row.favorite === 1,
    recipeUrl: row.recipe_url,
    cookedCount: row.cooked_count,
    lastCookedAt: row.last_cooked_at,
    createdAt: row.created_at,
    createdBy: row.created_by,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
    clientId: row.client_id,
    deleted: row.deleted === 1,
    version: row.version,
    serverSeq: row.server_seq,
  };
}

function toRow(dish: Dish): DishRow {
  return {
    id: dish.id,
    name: dish.name,
    memo: dish.memo,
    tags: JSON.stringify(dish.tags),
    favorite: dish.favorite ? 1 : 0,
    recipe_url: dish.recipeUrl,
    cooked_count: dish.cookedCount,
    last_cooked_at: dish.lastCookedAt,
    created_at: dish.createdAt,
    created_by: dish.createdBy,
    updated_at: dish.updatedAt,
    updated_by: dish.updatedBy,
    client_id: dish.clientId,
    deleted: dish.deleted ? 1 : 0,
    version: dish.version,
    server_seq: dish.serverSeq,
  };
}

export type DishStore = ReturnType<typeof createDishStore>;

export function createDishStore(db: SqliteDatabase) {
  const selectById = db.prepare<[string], DishRow>("SELECT * FROM dishes WHERE id = ?");
  const selectSince = db.prepare<[number, number], DishRow>(
    "SELECT * FROM dishes WHERE server_seq > ? ORDER BY server_seq LIMIT ?",
  );
  const upsert = db.prepare<[DishRow]>(`
    INSERT INTO dishes (id, name, memo, tags, favorite, recipe_url, cooked_count, last_cooked_at,
                        created_at, created_by, updated_at, updated_by,
                        client_id, deleted, version, server_seq)
    VALUES (@id, @name, @memo, @tags, @favorite, @recipe_url, @cooked_count, @last_cooked_at,
            @created_at, @created_by, @updated_at, @updated_by,
            @client_id, @deleted, @version, @server_seq)
    ON CONFLICT (id) DO UPDATE SET
      name = excluded.name, memo = excluded.memo, tags = excluded.tags,
      favorite = excluded.favorite, recipe_url = excluded.recipe_url,
      cooked_count = excluded.cooked_count, last_cooked_at = excluded.last_cooked_at,
      created_at = excluded.created_at, created_by = excluded.created_by,
      updated_at = excluded.updated_at, updated_by = excluded.updated_by,
      client_id = excluded.client_id, deleted = excluded.deleted,
      version = excluded.version, server_seq = excluded.server_seq
  `);
  const selectCurrentSeq = db.prepare<[], { value: string }>(
    "SELECT value FROM meta WHERE key = 'currentSeq'",
  );
  const updateCurrentSeq = db.prepare<[string]>(
    "UPDATE meta SET value = ? WHERE key = 'currentSeq'",
  );

  const currentSeq = (): number => Number(selectCurrentSeq.get()?.value ?? 0);

  return {
    get(id: string): Dish | undefined {
      const row = selectById.get(id);
      return row && toDish(row);
    },

    save(dish: Dish): void {
      upsert.run(toRow(dish));
    },

    /** serverSeq が since より大きい料理を、serverSeq の順に最大 limit 件返す */
    listSince(since: number, limit: number): Dish[] {
      return selectSince.all(since, limit).map(toDish);
    },

    /** 最後に採番した serverSeq */
    currentSeq,

    /** 新しい serverSeq を採番する */
    nextSeq(): number {
      const next = currentSeq() + 1;
      updateCurrentSeq.run(String(next));
      return next;
    },
  };
}
