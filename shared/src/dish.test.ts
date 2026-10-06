import { describe, expect, it } from "vitest";
import { type Dish, dishSchema } from "./dish";
import { DISH_LIMITS } from "./limits";

const validDish: Dish = {
  id: "0b9f3a3e-6c1e-4b8a-9d55-2f6f5a1c7e01",
  name: "肉じゃが",
  memo: "みりん多めが好評",
  tags: ["和食", "主菜"],
  createdAt: "2026-10-04T11:15:00.000Z",
  createdBy: "ママ",
  updatedAt: "2026-10-04T11:15:00.000Z",
  updatedBy: "ママ",
  clientId: "7d2c1b4a-1f3e-4c5d-8e9f-0a1b2c3d4e5f",
  deleted: false,
  version: 0,
  serverSeq: 0,
};

const parse = (overrides: Partial<Record<keyof Dish, unknown>>) =>
  dishSchema.safeParse({ ...validDish, ...overrides });

describe("dishSchema", () => {
  it("正しい料理を受け付ける", () => {
    expect(dishSchema.parse(validDish)).toEqual(validDish);
  });

  it("メモとタグは空でもよい", () => {
    expect(parse({ memo: "", tags: [] }).success).toBe(true);
  });

  it("料理名が空、または空白だけなら拒否する", () => {
    expect(parse({ name: "" }).success).toBe(false);
    expect(parse({ name: "  " }).success).toBe(false);
  });

  it("文字数と個数の上限を超えたら拒否する", () => {
    expect(parse({ name: "あ".repeat(DISH_LIMITS.nameMaxLength) }).success).toBe(true);
    expect(parse({ name: "あ".repeat(DISH_LIMITS.nameMaxLength + 1) }).success).toBe(false);
    expect(parse({ memo: "あ".repeat(DISH_LIMITS.memoMaxLength + 1) }).success).toBe(false);
    expect(
      parse({ tags: Array.from({ length: DISH_LIMITS.tagsMaxCount + 1 }, (_, i) => `t${i}`) })
        .success,
    ).toBe(false);
    expect(parse({ tags: ["あ".repeat(DISH_LIMITS.tagMaxLength + 1)] }).success).toBe(false);
  });

  it("IDがUUIDでなければ拒否する", () => {
    expect(parse({ id: "1" }).success).toBe(false);
    expect(parse({ clientId: "abc" }).success).toBe(false);
  });

  it("日時がISO 8601でなければ拒否する", () => {
    expect(parse({ updatedAt: "2026/10/04 20:15" }).success).toBe(false);
  });

  it("版数と連番は0以上の整数だけを受け付ける", () => {
    expect(parse({ version: -1 }).success).toBe(false);
    expect(parse({ serverSeq: 1.5 }).success).toBe(false);
  });

  it("定義にない項目は取り除く", () => {
    const result = dishSchema.parse({ ...validDish, dirty: true });
    expect(result).not.toHaveProperty("dirty");
  });
});
