import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "./database";
import { createDish, deleteDish, getDish } from "./dishRepository";
import { removeTag, renameTag } from "./tagRepository";

const actor = { clientId: "7d2c1b4a-1f3e-4c5d-8e9f-0a1b2c3d4e5f", userName: "ママ" };
const other = { ...actor, userName: "パパ" };

beforeEach(async () => {
  await db.dishes.clear();
});

const dishWith = (name: string, tags: string[]) => createDish({ name, memo: "", tags }, actor);

describe("renameTag", () => {
  it("そのタグが付いた料理すべてで名前を変え、変えた件数を返す", async () => {
    const a = await dishWith("肉じゃが", ["和食", "カレー"]);
    const b = await dishWith("カレーうどん", ["かれー"]);
    const c = await dishWith("麻婆豆腐", ["中華"]);
    await db.dishes.toCollection().modify({ dirty: false });

    const count = await renameTag("かれー", "カレー味", other);

    expect(count).toBe(2);
    expect(await getDish(a)).toMatchObject({
      tags: ["和食", "カレー味"],
      dirty: true,
      updatedBy: "パパ",
    });
    expect((await getDish(b))?.tags).toEqual(["カレー味"]);
    expect(await getDish(c)).toMatchObject({ tags: ["中華"], dirty: false });
  });

  it("既存のタグと同じ名前にすると統合され、1つの料理で重ならない", async () => {
    const a = await dishWith("肉じゃが", ["和食", "わしょく系"]);
    await renameTag("わしょく系", "和食", actor);
    expect((await getDish(a))?.tags).toEqual(["和食"]);
  });

  it("削除された料理は変えない", async () => {
    const a = await dishWith("肉じゃが", ["和食"]);
    await deleteDish(a, actor);
    expect(await renameTag("和食", "日本料理", actor)).toBe(0);
    expect((await getDish(a))?.tags).toEqual(["和食"]);
  });
});

describe("removeTag", () => {
  it("そのタグをすべての料理から外し、料理は残す", async () => {
    const a = await dishWith("肉じゃが", ["和食", "主菜"]);
    const b = await dishWith("豚汁", ["和食"]);

    expect(await removeTag("和食", actor)).toBe(2);
    expect((await getDish(a))?.tags).toEqual(["主菜"]);
    expect(await getDish(b)).toMatchObject({ tags: [], deleted: false });
  });
});
