import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "./database";
import { createDish, deleteDish, getDish, listActiveDishes, updateDish } from "./dishRepository";

const actor = { clientId: "7d2c1b4a-1f3e-4c5d-8e9f-0a1b2c3d4e5f", userName: "ママ" };

beforeEach(async () => {
  await db.dishes.clear();
});

describe("dishRepository", () => {
  it("追加した料理を読み出せる", async () => {
    const id = await createDish({ name: "肉じゃが", memo: "", tags: ["和食"] }, actor);
    expect(await getDish(id)).toMatchObject({ name: "肉じゃが", dirty: true });
  });

  it("編集すると内容が変わる", async () => {
    const id = await createDish({ name: "肉じゃが", memo: "", tags: [] }, actor);
    await updateDish(id, { name: "肉じゃが", memo: "甘め", tags: ["和食"] }, actor);
    expect(await getDish(id)).toMatchObject({ memo: "甘め", tags: ["和食"] });
  });

  it("削除しても墓標として残り、一覧からは消える", async () => {
    const keep = await createDish({ name: "豚汁", memo: "", tags: [] }, actor);
    const removed = await createDish({ name: "肉じゃが", memo: "", tags: [] }, actor);
    await deleteDish(removed, actor);

    expect(await getDish(removed)).toMatchObject({ deleted: true, dirty: true });
    expect((await listActiveDishes()).map((dish) => dish.id)).toEqual([keep]);
  });

  it("存在しない料理を編集するとエラーになる", async () => {
    await expect(
      updateDish("00000000-0000-4000-8000-000000000000", { name: "x", memo: "", tags: [] }, actor),
    ).rejects.toThrow("料理が見つかりません");
  });
});
