import "fake-indexeddb/auto";
import { DISH_PHASE2_DEFAULTS } from "@dish-list/shared";
import { Dexie } from "dexie";
import { describe, expect, it } from "vitest";

describe("database のスキーマの版の更新", () => {
  it("版1で保存した料理は、版2で開くとフェーズ2の項目が既定値で補われる", async () => {
    // 版1（フェーズ2より前）のアプリが保存した状態を作る
    const legacy = new Dexie("dish-list");
    legacy.version(1).stores({ dishes: "id, serverSeq", meta: "key" });
    await legacy.table("dishes").put({ id: "old-1", name: "肉じゃが", memo: "", tags: [] });
    legacy.close();

    const { db } = await import("./database");
    expect(await db.dishes.get("old-1")).toMatchObject({
      name: "肉じゃが",
      ...DISH_PHASE2_DEFAULTS,
    });
    expect(db.verno).toBe(2);
  });
});
