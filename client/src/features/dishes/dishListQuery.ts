import { normalize } from "@dish-list/shared";
import type { LocalDish } from "../../db/database";

/**
 * 一覧の検索・タグ絞り込み・並び替え・タグ集計（F-04〜F-06、F-08、F-18、F-19、5.2）。
 * 画面に依存しない純粋な関数にして、テストで動きを確かめられるようにしている。
 */

/** 並び順。updated：更新が新しい順／name：名前順／notRecentlyCooked：最近作っていない順 */
export type SortOrder = "updated" | "name" | "notRecentlyCooked";

export interface DishListFilter {
  keyword: string;
  /** 選択中のタグ（正規化したキー）。すべてを含む料理だけを残す（AND条件） */
  tagKeys: ReadonlySet<string>;
  /** true ならお気に入りだけを残す（タグとAND条件） */
  favoritesOnly: boolean;
  sort: SortOrder;
}

/** 検索用に、正規化したキーを先に計算しておいた料理 */
export interface IndexedDish {
  dish: LocalDish;
  nameKey: string;
  memoKey: string;
  tagKeys: ReadonlySet<string>;
}

/** タグ絞り込みのチップに出すタグ */
export interface TagSummary {
  /** 正規化したキー。選択状態の管理と比較に使う */
  key: string;
  /** 画面に出す表記（同じキーで表記が複数あるときは、最も多く使われているもの） */
  label: string;
  count: number;
}

/** 正規化は重いので、料理の一覧が変わったときだけ計算する */
export function indexDishes(dishes: readonly LocalDish[]): IndexedDish[] {
  return dishes.map((dish) => ({
    dish,
    nameKey: normalize(dish.name),
    memoKey: normalize(dish.memo),
    tagKeys: new Set(dish.tags.map(normalize)),
  }));
}

export function filterAndSortDishes(
  indexed: readonly IndexedDish[],
  filter: DishListFilter,
): LocalDish[] {
  const keyword = normalize(filter.keyword);
  return indexed
    .filter(
      (entry) =>
        (keyword === "" || entry.nameKey.includes(keyword) || entry.memoKey.includes(keyword)) &&
        (!filter.favoritesOnly || entry.dish.favorite) &&
        [...filter.tagKeys].every((key) => entry.tagKeys.has(key)),
    )
    .map((entry) => entry.dish)
    .sort(COMPARATORS[filter.sort]);
}

const japaneseCollator = new Intl.Collator("ja");

const byUpdatedDesc = (a: LocalDish, b: LocalDish) => b.updatedAt.localeCompare(a.updatedAt);

const byName = (a: LocalDish, b: LocalDish) => japaneseCollator.compare(a.name, b.name);

/** まだ作っていない料理を先に、その後は最後に作った日時が古い順（F-18） */
const byLastCookedAsc = (a: LocalDish, b: LocalDish) => {
  if (a.lastCookedAt === b.lastCookedAt) return 0;
  if (a.lastCookedAt === null) return -1;
  if (b.lastCookedAt === null) return 1;
  return a.lastCookedAt.localeCompare(b.lastCookedAt);
};

const COMPARATORS: Record<SortOrder, (a: LocalDish, b: LocalDish) => number> = {
  updated: byUpdatedDesc,
  // 漢字は読みで並ばない（REQUIREMENTS.md 16章）。同じ名前なら更新が新しい順
  name: (a, b) => byName(a, b) || byUpdatedDesc(a, b),
  notRecentlyCooked: (a, b) => byLastCookedAsc(a, b) || byName(a, b),
};

/** タグを集計し、使用回数の多い順に返す（5.2） */
export function summarizeTags(dishes: readonly LocalDish[]): TagSummary[] {
  const byKey = new Map<string, { count: number; labelCounts: Map<string, number> }>();
  for (const dish of dishes) {
    for (const label of dish.tags) {
      const key = normalize(label);
      const entry = byKey.get(key) ?? { count: 0, labelCounts: new Map<string, number>() };
      entry.count += 1;
      entry.labelCounts.set(label, (entry.labelCounts.get(label) ?? 0) + 1);
      byKey.set(key, entry);
    }
  }
  return [...byKey.entries()]
    .map(([key, { count, labelCounts }]) => ({ key, label: mostUsedLabel(labelCounts), count }))
    .sort((a, b) => b.count - a.count || japaneseCollator.compare(a.label, b.label));
}

function mostUsedLabel(labelCounts: Map<string, number>): string {
  let best = "";
  let bestCount = 0;
  for (const [label, count] of labelCounts) {
    if (count > bestCount) [best, bestCount] = [label, count];
  }
  return best;
}

/** 正規化後に同じ名前の料理があれば返す（F-08）。編集中の料理自身は除く */
export function findSameNameDish(
  dishes: readonly LocalDish[],
  name: string,
  excludeId?: string,
): LocalDish | undefined {
  const key = normalize(name);
  if (key === "") return undefined;
  return dishes.find((dish) => dish.id !== excludeId && normalize(dish.name) === key);
}
