import { type DishChange, SYNC_LIMITS, type SyncRequest } from "@dish-list/shared";
import { beforeEach, describe, expect, it } from "vitest";
import { openDatabase, type SqliteDatabase } from "../db/database";
import { createDishStore, type DishStore } from "../db/dishStore";
import { at, CLIENT_A, CLIENT_B, DISH_ID, makeChange } from "../testing/fixtures";
import { createSyncService } from "./syncService";

let db: SqliteDatabase;
let store: DishStore;
let service: ReturnType<typeof createSyncService>;

beforeEach(() => {
  db = openDatabase(":memory:");
  store = createDishStore(db);
  service = createSyncService(db, store);
});

const sync = (clientId: string, lastSeq: number, changes: DishChange[] = []) =>
  service.sync({ clientId, lastSeq, changes } satisfies SyncRequest);

describe("Push：新規", () => {
  it("新しい料理を版1・連番1で保存し、Pullの結果にも含める", () => {
    const response = sync(CLIENT_A, 0, [makeChange()]);

    expect(response.results).toEqual([
      { id: DISH_ID, status: "applied", version: 1, serverSeq: 1 },
    ]);
    expect(response.changes).toHaveLength(1);
    expect(response.changes[0]).toMatchObject({ name: "肉じゃが", version: 1, serverSeq: 1 });
    expect(response.changes[0]).not.toHaveProperty("baseVersion");
    expect(response.lastSeq).toBe(1);
    expect(response.hasMore).toBe(false);
  });

  it("ほかの端末は、次の同期でその料理を受け取る", () => {
    sync(CLIENT_A, 0, [makeChange()]);
    const response = sync(CLIENT_B, 0);
    expect(response.changes.map((d) => d.name)).toEqual(["肉じゃが"]);
    expect(response.lastSeq).toBe(1);
  });
});

describe("Push：再送しても結果が変わらない", () => {
  it("同じリクエストを再送しても、版も連番も増えない", () => {
    const request = [makeChange({ updatedAt: at("10:00") })];
    sync(CLIENT_A, 0, request);
    const resent = sync(CLIENT_A, 0, request);

    expect(resent.results).toEqual([{ id: DISH_ID, status: "applied", version: 1, serverSeq: 1 }]);
    expect(store.currentSeq()).toBe(1);
  });

  it("編集の成功後に応答が届かず、古い baseVersion のまま再送されても適用済みとして扱う", () => {
    sync(CLIENT_A, 0, [makeChange()]);
    const edit = makeChange({ baseVersion: 1, memo: "甘め", updatedAt: at("11:00") });
    sync(CLIENT_A, 1, [edit]);
    const resent = sync(CLIENT_A, 1, [edit]);

    expect(resent.results[0]).toMatchObject({ status: "applied", version: 2, serverSeq: 2 });
    expect(store.currentSeq()).toBe(2);
  });
});

describe("Push：編集と競合", () => {
  beforeEach(() => {
    // 端末Aが登録し、両方の端末が版1を受け取った状態
    sync(CLIENT_A, 0, [makeChange({ updatedAt: at("10:00") })]);
  });

  it("競合がなければ版を1つ上げて上書きする", () => {
    const response = sync(CLIENT_B, 1, [
      makeChange({ baseVersion: 1, memo: "甘め", updatedAt: at("11:00"), clientId: CLIENT_B }),
    ]);
    expect(response.results[0]).toMatchObject({ status: "applied", version: 2, serverSeq: 2 });
    expect(store.get(DISH_ID)).toMatchObject({ memo: "甘め", version: 2, clientId: CLIENT_B });
  });

  it("作成者と作成日時は、後から送られた値で書き換えない", () => {
    sync(CLIENT_B, 1, [
      makeChange({
        baseVersion: 1,
        createdBy: "パパ",
        createdAt: at("10:30"),
        updatedAt: at("11:00"),
        clientId: CLIENT_B,
      }),
    ]);
    expect(store.get(DISH_ID)).toMatchObject({ createdBy: "ママ", createdAt: at("10:00") });
  });

  it("同じ版を両方が編集したら、更新日時が新しいほうが残る", () => {
    // A が 12:00 の編集を先に同期し、B が 11:00 の編集を後から同期する
    sync(CLIENT_A, 1, [makeChange({ baseVersion: 1, memo: "Aの編集", updatedAt: at("12:00") })]);
    const responseB = sync(CLIENT_B, 1, [
      makeChange({ baseVersion: 1, memo: "Bの編集", updatedAt: at("11:00"), clientId: CLIENT_B }),
    ]);

    expect(responseB.results[0]).toMatchObject({ status: "rejected", version: 2, serverSeq: 2 });
    expect(store.get(DISH_ID)?.memo).toBe("Aの編集");
    // 負けた端末は、勝った内容を受け取る
    expect(responseB.changes.find((d) => d.id === DISH_ID)?.memo).toBe("Aの編集");
  });

  it("後から同期したほうが新しければ、そちらが残る", () => {
    sync(CLIENT_A, 1, [makeChange({ baseVersion: 1, memo: "Aの編集", updatedAt: at("11:00") })]);
    const responseB = sync(CLIENT_B, 1, [
      makeChange({ baseVersion: 1, memo: "Bの編集", updatedAt: at("12:00"), clientId: CLIENT_B }),
    ]);

    expect(responseB.results[0]).toMatchObject({ status: "applied", version: 3, serverSeq: 3 });
    expect(store.get(DISH_ID)?.memo).toBe("Bの編集");
  });

  it("負けた料理は、端末の lastSeq より前の連番でもレスポンスに含める", () => {
    sync(CLIENT_A, 1, [makeChange({ baseVersion: 1, memo: "Aの編集", updatedAt: at("12:00") })]);
    // B はすでに連番2まで受け取っている（＝通常のPullでは返らない）
    const responseB = sync(CLIENT_B, 2, [
      makeChange({ baseVersion: 1, memo: "Bの編集", updatedAt: at("11:00"), clientId: CLIENT_B }),
    ]);

    expect(responseB.changes.map((d) => d.memo)).toEqual(["Aの編集"]);
    expect(responseB.lastSeq).toBe(2);
  });

  it("削除と編集が競合しても、後勝ちで決まる", () => {
    sync(CLIENT_A, 1, [makeChange({ baseVersion: 1, deleted: true, updatedAt: at("12:00") })]);
    const responseB = sync(CLIENT_B, 1, [
      makeChange({ baseVersion: 1, memo: "Bの編集", updatedAt: at("11:00"), clientId: CLIENT_B }),
    ]);

    expect(responseB.results[0]?.status).toBe("rejected");
    expect(store.get(DISH_ID)?.deleted).toBe(true);
  });
});

describe("Pull", () => {
  const pushMany = (count: number) => {
    for (let start = 0; start < count; start += SYNC_LIMITS.pushMaxCount) {
      const changes = Array.from(
        { length: Math.min(SYNC_LIMITS.pushMaxCount, count - start) },
        (_, i) => makeChange({ id: crypto.randomUUID(), name: `料理${start + i}` }),
      );
      sync(CLIENT_A, 0, changes);
    }
  };

  it("上限を超える件数は hasMore で知らせ、続きを取得できる", () => {
    const total = SYNC_LIMITS.pullMaxCount + 20;
    pushMany(total);

    const first = sync(CLIENT_B, 0);
    expect(first.changes).toHaveLength(SYNC_LIMITS.pullMaxCount);
    expect(first.hasMore).toBe(true);
    expect(first.lastSeq).toBe(SYNC_LIMITS.pullMaxCount);

    const second = sync(CLIENT_B, first.lastSeq);
    expect(second.changes).toHaveLength(20);
    expect(second.hasMore).toBe(false);
    expect(second.lastSeq).toBe(total);
  });

  it("変更がなければ空を返し、lastSeq はそのまま", () => {
    pushMany(3);
    const response = sync(CLIENT_B, 3);
    expect(response.changes).toEqual([]);
    expect(response.lastSeq).toBe(3);
  });

  it("端末の lastSeq がサーバーより先なら（バックアップから戻した場合）、最初から送り直す", () => {
    pushMany(3);
    const response = sync(CLIENT_B, 50);
    expect(response.changes).toHaveLength(3);
    expect(response.lastSeq).toBe(3);
  });
});

describe("トランザクション", () => {
  it("途中で失敗したら、それまでの変更も保存しない", () => {
    const failingStore: DishStore = {
      ...store,
      save: (dish) => {
        if (dish.name === "失敗") throw new Error("書き込みエラー");
        store.save(dish);
      },
    };
    const failingService = createSyncService(db, failingStore);
    const changes = [
      makeChange({ id: crypto.randomUUID(), name: "成功" }),
      makeChange({ id: crypto.randomUUID(), name: "失敗" }),
    ];

    expect(() => failingService.sync({ clientId: CLIENT_A, lastSeq: 0, changes })).toThrow();
    expect(store.listSince(0, 10)).toEqual([]);
    expect(store.currentSeq()).toBe(0);
  });
});
