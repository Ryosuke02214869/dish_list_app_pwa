import { useLiveQuery } from "dexie-react-hooks";
import { useMemo, useState } from "react";
import type { LocalDish } from "../../db/database";
import { listActiveDishes } from "../../db/dishRepository";
import {
  filterAndSortDishes,
  indexDishes,
  type SortOrder,
  summarizeTags,
  type TagSummary,
} from "./dishListQuery";
import { loadSortOrder, saveSortOrder } from "./sortPreference";

/**
 * 一覧画面の状態（検索語、選択中のタグ、並び順）と、その結果をまとめて返す。
 * データベースが変わると（同期の受信を含む）自動で再計算される。
 */
export function useDishList() {
  const dishes = useLiveQuery(listActiveDishes);
  const [keyword, setKeyword] = useState("");
  const [selectedTagKeys, setSelectedTagKeys] = useState<ReadonlySet<string>>(new Set());
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [sort, setSortState] = useState<SortOrder>(loadSortOrder);

  const indexed = useMemo(() => indexDishes(dishes ?? []), [dishes]);
  const tags: TagSummary[] = useMemo(() => summarizeTags(dishes ?? []), [dishes]);
  const favoriteCount = useMemo(
    () => (dishes ?? []).filter((dish) => dish.favorite).length,
    [dishes],
  );

  // 料理の削除などで使われなくなったタグは、選択から外して扱う
  const activeTagKeys = useMemo(() => {
    const existing = new Set(tags.map((tag) => tag.key));
    return new Set([...selectedTagKeys].filter((key) => existing.has(key)));
  }, [tags, selectedTagKeys]);

  const visibleDishes: LocalDish[] = useMemo(
    () => filterAndSortDishes(indexed, { keyword, tagKeys: activeTagKeys, favoritesOnly, sort }),
    [indexed, keyword, activeTagKeys, favoritesOnly, sort],
  );

  const toggleTag = (key: string) => {
    const next = new Set(activeTagKeys);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setSelectedTagKeys(next);
  };

  const setSort = (order: SortOrder) => {
    setSortState(order);
    saveSortOrder(order);
  };

  return {
    /** 読み込み中は undefined */
    allDishes: dishes,
    visibleDishes,
    tags,
    keyword,
    setKeyword,
    selectedTagKeys: activeTagKeys,
    toggleTag,
    favoritesOnly,
    toggleFavoritesOnly: () => setFavoritesOnly((current) => !current),
    favoriteCount,
    sort,
    setSort,
  };
}
