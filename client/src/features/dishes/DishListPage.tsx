import { AppBar } from "../../components/AppBar";
import { Fab } from "../../components/Fab";
import type { LocalDish } from "../../db/database";
import { useState } from "react";
import { DishCard } from "./DishCard";
import { DishEditorSheet } from "./DishEditorSheet";
import type { SortOrder } from "./dishListQuery";
import { SearchBar } from "./SearchBar";
import { TagFilterChips } from "./TagFilterChips";
import { useDishList } from "./useDishList";

/** 一覧（ホーム）画面（REQUIREMENTS.md 9章、DESIGN.md 6章） */
export function DishListPage() {
  const list = useDishList();
  const editor = useEditorState();

  return (
    <div className="mx-auto min-h-dvh max-w-app pb-[calc(96px+env(safe-area-inset-bottom))]">
      <AppBar>
        <SearchBar value={list.keyword} onChange={list.setKeyword} />
        <TagFilterChips
          tags={list.tags}
          selectedKeys={list.selectedTagKeys}
          onToggle={list.toggleTag}
        />
      </AppBar>

      <div className="flex items-center justify-between px-gutter pt-4 pb-2">
        <p className="text-[13px] text-text-sub">
          <strong className="text-[15px] text-text">{list.visibleDishes.length}</strong> 件
        </p>
        <SortSelect value={list.sort} onChange={list.setSort} />
      </div>

      {list.allDishes === undefined ? null : list.visibleDishes.length > 0 ? (
        <ul className="grid gap-3 px-gutter">
          {list.visibleDishes.map((dish) => (
            <li key={dish.id}>
              <DishCard dish={dish} onOpen={editor.openDish} />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState hasAnyDish={list.allDishes.length > 0} />
      )}

      <Fab label="追加" onClick={editor.openNew} />

      <DishEditorSheet
        key={editor.key}
        open={editor.open}
        dish={editor.dish}
        onClose={editor.close}
        allDishes={list.allDishes ?? []}
        knownTags={list.tags}
      />
    </div>
  );
}

/**
 * 編集シートの開閉と対象。開くたびに key を変えて、シートの入力を初期化する。
 * 閉じるアニメーションの間も内容を表示しておくため、閉じても対象の料理は残す。
 */
function useEditorState() {
  const [state, setState] = useState<{ key: number; open: boolean; dish: LocalDish | null }>({
    key: 0,
    open: false,
    dish: null,
  });
  const openWith = (dish: LocalDish | null) =>
    setState((prev) => ({ key: prev.key + 1, open: true, dish }));

  return {
    ...state,
    openNew: () => openWith(null),
    openDish: (dish: LocalDish) => openWith(dish),
    close: () => setState((prev) => ({ ...prev, open: false })),
  };
}

const SORT_LABELS: Record<SortOrder, string> = {
  updated: "更新が新しい順",
  name: "名前順（五十音）",
};

function SortSelect({ value, onChange }: { value: SortOrder; onChange: (v: SortOrder) => void }) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value as SortOrder)}
      aria-label="並び順"
      className="appearance-none bg-transparent py-1 text-[13px] font-medium text-primary-strong"
    >
      {Object.entries(SORT_LABELS).map(([order, label]) => (
        <option key={order} value={order}>
          {label} ▾
        </option>
      ))}
    </select>
  );
}

/** 表示する料理がないときの案内（DESIGN.md 5章 EmptyState） */
function EmptyState({ hasAnyDish }: { hasAnyDish: boolean }) {
  return (
    <div className="mx-gutter my-8 rounded-lg bg-surface px-4 py-8 text-center text-sm text-text-sub">
      {hasAnyDish ? (
        <>
          条件に合う料理がありません。
          <br />
          タグや検索ワードを変えてみてください。
        </>
      ) : (
        <>
          まだ料理が登録されていません。
          <br />
          右下の「追加」から登録しましょう。
        </>
      )}
    </div>
  );
}
