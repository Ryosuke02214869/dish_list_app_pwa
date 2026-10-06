import type { TagSummary } from "./dishListQuery";

/**
 * タグ絞り込みのチップ（F-06、DESIGN.md 5章 TagChip）。
 * 横にスクロールし、複数を選ぶとAND条件で絞り込む。
 */

interface TagFilterChipsProps {
  tags: readonly TagSummary[];
  selectedKeys: ReadonlySet<string>;
  onToggle: (key: string) => void;
}

export function TagFilterChips({ tags, selectedKeys, onToggle }: TagFilterChipsProps) {
  if (tags.length === 0) return null;
  return (
    <div
      role="group"
      aria-label="タグで絞り込み"
      className="-mx-gutter flex gap-2 overflow-x-auto px-gutter pt-3 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {tags.map((tag) => {
        const selected = selectedKeys.has(tag.key);
        return (
          <button
            key={tag.key}
            type="button"
            aria-pressed={selected}
            onClick={() => onToggle(tag.key)}
            className={`h-8 flex-none rounded-full border px-3.5 text-[13px] whitespace-nowrap transition-colors ${
              selected
                ? "border-primary bg-primary font-bold text-on-primary"
                : "border-border bg-surface text-text-sub"
            }`}
          >
            #{tag.label}
            <span className="ml-1 text-[11px] opacity-70">{tag.count}</span>
          </button>
        );
      })}
    </div>
  );
}
