import type { ReactNode } from "react";
import { StarIcon } from "../../components/icons";
import type { TagSummary } from "./dishListQuery";

/**
 * 絞り込みのチップ（F-06、F-19、DESIGN.md 5章 TagChip）。
 * 先頭に「お気に入り」、続けてタグを使用回数の多い順に並べる。横にスクロールし、
 * 複数を選ぶとAND条件で絞り込む。
 */

interface TagFilterChipsProps {
  tags: readonly TagSummary[];
  selectedKeys: ReadonlySet<string>;
  onToggle: (key: string) => void;
  favoriteCount: number;
  favoritesOnly: boolean;
  onToggleFavorites: () => void;
}

export function TagFilterChips({
  tags,
  selectedKeys,
  onToggle,
  favoriteCount,
  favoritesOnly,
  onToggleFavorites,
}: TagFilterChipsProps) {
  const showFavorites = favoriteCount > 0 || favoritesOnly;
  if (tags.length === 0 && !showFavorites) return null;

  return (
    <div
      role="group"
      aria-label="絞り込み"
      className="-mx-gutter flex gap-2 overflow-x-auto px-gutter pt-3 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {showFavorites && (
        <Chip selected={favoritesOnly} onClick={onToggleFavorites} count={favoriteCount}>
          <StarIcon size={13} filled={favoritesOnly} />
          お気に入り
        </Chip>
      )}
      {tags.map((tag) => (
        <Chip
          key={tag.key}
          selected={selectedKeys.has(tag.key)}
          onClick={() => onToggle(tag.key)}
          count={tag.count}
        >
          #{tag.label}
        </Chip>
      ))}
    </div>
  );
}

function Chip({
  selected,
  onClick,
  count,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  count: number;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`inline-flex h-8 flex-none items-center gap-1 rounded-full border px-3.5 text-[13px] whitespace-nowrap transition-colors ${
        selected
          ? "border-primary bg-primary font-bold text-on-primary"
          : "border-border bg-surface text-text-sub"
      }`}
    >
      {children}
      <span className="text-[11px] opacity-70">{count}</span>
    </button>
  );
}
