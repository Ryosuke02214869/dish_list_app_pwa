import type { SortOrder } from "./dishListQuery";

/**
 * 一覧の並び順の保存。UIの好みなので localStorage に置く（CLAUDE.md「データとストレージ」）。
 * localStorage が使えない環境（プライベートブラウズなど）でも動くよう、失敗は無視する。
 */

const STORAGE_KEY = "dish-list:sort-order";
const SORT_ORDERS: readonly SortOrder[] = ["updated", "name"];
const DEFAULT_SORT_ORDER: SortOrder = "updated";

export function loadSortOrder(): SortOrder {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return SORT_ORDERS.find((order) => order === saved) ?? DEFAULT_SORT_ORDER;
  } catch {
    return DEFAULT_SORT_ORDER;
  }
}

export function saveSortOrder(order: SortOrder): void {
  try {
    localStorage.setItem(STORAGE_KEY, order);
  } catch {
    // 保存できなくても、今の画面では選んだ並び順が使われる
  }
}
