import { type Dish, DISH_PHASE2_DEFAULTS } from "@dish-list/shared";
import { Dexie, type EntityTable } from "dexie";

/**
 * 端末のデータベース（IndexedDB）。UIと同期処理は、すべてこのデータベースを読み書きする。
 * テーブルを直接触るのは db/ の中のファイルだけにする。
 */

/** 端末に保存する料理。共有の Dish に、端末だけで使う項目を加えたもの（REQUIREMENTS.md 7.1） */
export interface LocalDish extends Dish {
  /** サーバーへ送っていない変更があるか */
  dirty: boolean;
  /** 端末で編集を始めたときのサーバーの版数。Pushのときに送り、競合の判定に使う */
  baseVersion: number;
}

/** 端末のメタ情報（REQUIREMENTS.md 7.2）。キーごとに値の型が決まっている */
export interface MetaValues {
  clientId: string;
  userName: string;
  lastSeq: number;
  lastSyncedAt: string;
}

export type MetaKey = keyof MetaValues;

export type MetaRow = { [K in MetaKey]: { key: K; value: MetaValues[K] } }[MetaKey];

const DATABASE_NAME = "dish-list";

export const db = new Dexie(DATABASE_NAME) as Dexie & {
  dishes: EntityTable<LocalDish, "id">;
  meta: EntityTable<MetaRow, "key">;
};

/*
 * スキーマの版。検索の条件に使う項目（インデックス）だけを書く。
 * インデックスにしない項目を料理に追加するときは、版を上げる必要はない。
 * 版を上げるときは、古い版の定義を消さずに下に追加する。
 */
db.version(1).stores({
  dishes: "id, serverSeq",
  meta: "key",
});

// 2：フェーズ2の項目（REQUIREMENTS.md 18.2）。インデックスは変えず、保存済みの料理に既定値を補う
db.version(2)
  .stores({ dishes: "id, serverSeq", meta: "key" })
  .upgrade((tx) =>
    tx
      .table<LocalDish, string>("dishes")
      .toCollection()
      .modify((dish) => {
        for (const [key, value] of Object.entries(DISH_PHASE2_DEFAULTS)) {
          if (!(key in dish)) Object.assign(dish, { [key]: value });
        }
      }),
  );
