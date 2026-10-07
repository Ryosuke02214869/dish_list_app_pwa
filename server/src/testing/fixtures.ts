import { type Dish, type DishChange, DISH_PHASE2_DEFAULTS } from "@dish-list/shared";

/** テスト用の料理と変更を作る */

export const CLIENT_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
export const CLIENT_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
export const DISH_ID = "0b9f3a3e-6c1e-4b8a-9d55-2f6f5a1c7e01";

/** 時刻を短く書くため、2026-10-04 の「時:分」から ISO 8601 を作る */
export const at = (hhmm: string) => `2026-10-04T${hhmm}:00.000Z`;

export function makeDish(fields: Partial<Dish> = {}): Dish {
  return {
    id: DISH_ID,
    name: "肉じゃが",
    memo: "",
    tags: [],
    ...DISH_PHASE2_DEFAULTS,
    createdAt: at("10:00"),
    createdBy: "ママ",
    updatedAt: at("10:00"),
    updatedBy: "ママ",
    clientId: CLIENT_A,
    deleted: false,
    version: 0,
    serverSeq: 0,
    ...fields,
  };
}

export function makeChange(fields: Partial<DishChange> = {}): DishChange {
  return { ...makeDish(fields), baseVersion: 0, ...fields };
}
