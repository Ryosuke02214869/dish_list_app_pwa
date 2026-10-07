import { DISH_PHASE2_DEFAULTS } from "@dish-list/shared";
import { describe, expect, it } from "vitest";
import type { LocalDish } from "../../db/database";
import {
  type DishListFilter,
  filterAndSortDishes,
  findSameNameDish,
  indexDishes,
  summarizeTags,
} from "./dishListQuery";

let nextId = 0;
const dish = (fields: Partial<LocalDish>): LocalDish => ({
  id: `id-${nextId++}`,
  name: "",
  memo: "",
  tags: [],
  ...DISH_PHASE2_DEFAULTS,
  createdAt: "2026-10-01T00:00:00.000Z",
  createdBy: "ママ",
  updatedAt: "2026-10-01T00:00:00.000Z",
  updatedBy: "ママ",
  clientId: "client",
  deleted: false,
  version: 0,
  serverSeq: 0,
  dirty: false,
  baseVersion: 0,
  ...fields,
});

const nikujaga = dish({
  name: "肉じゃが",
  memo: "メークインを使う",
  tags: ["和食", "主菜"],
  favorite: true,
  cookedCount: 3,
  lastCookedAt: "2026-10-01T00:00:00.000Z",
  updatedAt: "2026-10-04T00:00:00.000Z",
});
const curryUdon = dish({
  name: "かれーうどん",
  tags: ["和食", "めん"],
  updatedAt: "2026-10-02T00:00:00.000Z",
});
const keemaCurry = dish({
  name: "キーマカレー",
  memo: "冷凍OK",
  tags: ["洋食", "主菜"],
  favorite: true,
  cookedCount: 1,
  lastCookedAt: "2026-09-20T00:00:00.000Z",
  updatedAt: "2026-10-03T00:00:00.000Z",
});
const all = [nikujaga, curryUdon, keemaCurry];

const run = (filter: Partial<DishListFilter>) =>
  filterAndSortDishes(indexDishes(all), {
    keyword: "",
    tagKeys: new Set(),
    favoritesOnly: false,
    sort: "updated",
    ...filter,
  }).map((d) => d.name);

describe("filterAndSortDishes", () => {
  it("条件がなければ全件を更新が新しい順で返す", () => {
    expect(run({})).toEqual(["肉じゃが", "キーマカレー", "かれーうどん"]);
  });

  it("料理名を正規化して部分一致で検索する（カタカナ→ひらがな）", () => {
    expect(run({ keyword: "カレー" })).toEqual(["キーマカレー", "かれーうどん"]);
  });

  it("メモも検索の対象にする（全角・半角、大文字・小文字を区別しない）", () => {
    expect(run({ keyword: "ok" })).toEqual(["キーマカレー"]);
    expect(run({ keyword: "ﾒｰｸｲﾝ" })).toEqual(["肉じゃが"]);
  });

  it("タグはAND条件で絞り込む", () => {
    expect(run({ tagKeys: new Set(["主菜"]) })).toEqual(["肉じゃが", "キーマカレー"]);
    expect(run({ tagKeys: new Set(["主菜", "和食"]) })).toEqual(["肉じゃが"]);
  });

  it("検索とタグを組み合わせられる", () => {
    expect(run({ keyword: "カレー", tagKeys: new Set(["和食"]) })).toEqual(["かれーうどん"]);
  });

  it("名前順で並べられる", () => {
    expect(run({ sort: "name" })).toEqual(["かれーうどん", "キーマカレー", "肉じゃが"]);
  });

  it("最近作っていない順：まだ作っていない料理が先、その後は作った日が古い順", () => {
    expect(run({ sort: "notRecentlyCooked" })).toEqual([
      "かれーうどん",
      "キーマカレー",
      "肉じゃが",
    ]);
  });

  it("お気に入りだけに絞り込める（タグとAND条件）", () => {
    expect(run({ favoritesOnly: true })).toEqual(["肉じゃが", "キーマカレー"]);
    expect(run({ favoritesOnly: true, tagKeys: new Set(["和食"]) })).toEqual(["肉じゃが"]);
  });
});

describe("summarizeTags", () => {
  it("使用回数の多い順に集計する（同数なら名前順。かなは漢字より前）", () => {
    expect(summarizeTags(all)).toEqual([
      { key: "主菜", label: "主菜", labels: ["主菜"], count: 2 },
      { key: "和食", label: "和食", labels: ["和食"], count: 2 },
      { key: "めん", label: "めん", labels: ["めん"], count: 1 },
      { key: "洋食", label: "洋食", labels: ["洋食"], count: 1 },
    ]);
  });

  it("表記ゆれは1つにまとめ、多く使われている表記を出す", () => {
    const dishes = [
      dish({ tags: ["カレー"] }),
      dish({ tags: ["かれー"] }),
      dish({ tags: ["カレー"] }),
    ];
    expect(summarizeTags(dishes)).toEqual([
      { key: "かれー", label: "カレー", labels: ["カレー", "かれー"], count: 3 },
    ]);
  });
});

describe("findSameNameDish", () => {
  it("正規化後に同じ名前の料理を見つける", () => {
    expect(findSameNameDish(all, " カレーウドン ")).toBe(curryUdon);
  });

  it("編集中の料理自身は除く", () => {
    expect(findSameNameDish(all, "かれーうどん", curryUdon.id)).toBeUndefined();
  });

  it("空の名前では探さない", () => {
    expect(findSameNameDish([dish({ name: "" })], "  ")).toBeUndefined();
  });
});
