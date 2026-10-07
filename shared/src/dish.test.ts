import { describe, expect, it } from "vitest";
import { type Dish, DISH_PHASE2_DEFAULTS, dishSchema, isRecipeUrl } from "./dish";
import { DISH_LIMITS } from "./limits";

const validDish: Dish = {
  id: "0b9f3a3e-6c1e-4b8a-9d55-2f6f5a1c7e01",
  name: "肉じゃが",
  memo: "みりん多めが好評",
  tags: ["和食", "主菜"],
  favorite: true,
  recipeUrl: "https://example.com/nikujaga",
  cookedCount: 3,
  lastCookedAt: "2026-10-03T10:00:00.000Z",
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

  it("フェーズ2の項目がない古いデータは、既定値で補う", () => {
    const { favorite: _f, recipeUrl: _r, cookedCount: _c, lastCookedAt: _l, ...legacy } = validDish;
    expect(dishSchema.parse(legacy)).toEqual({ ...legacy, ...DISH_PHASE2_DEFAULTS });
  });

  it("参考レシピのURLは空か、http(s) のURLだけを受け付ける", () => {
    expect(parse({ recipeUrl: "" }).success).toBe(true);
    expect(parse({ recipeUrl: "http://example.com" }).success).toBe(true);
    expect(parse({ recipeUrl: "example.com" }).success).toBe(false);
    expect(parse({ recipeUrl: "javascript:alert(1)" }).success).toBe(false);
    const tooLong = `https://example.com/${"a".repeat(DISH_LIMITS.recipeUrlMaxLength)}`;
    expect(parse({ recipeUrl: tooLong }).success).toBe(false);
  });

  it("作った回数は0以上の整数、最後に作った日時は ISO 8601 か null", () => {
    expect(parse({ cookedCount: -1 }).success).toBe(false);
    expect(parse({ lastCookedAt: null }).success).toBe(true);
    expect(parse({ lastCookedAt: "きのう" }).success).toBe(false);
  });
});

describe("isRecipeUrl", () => {
  it("http と https の絶対URLだけを認める", () => {
    expect(isRecipeUrl("https://cookpad.com/recipe/1")).toBe(true);
    expect(isRecipeUrl("ftp://example.com")).toBe(false);
    expect(isRecipeUrl("/recipe/1")).toBe(false);
  });
});
