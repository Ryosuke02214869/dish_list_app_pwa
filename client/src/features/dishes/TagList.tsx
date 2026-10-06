import type { ReactNode } from "react";

/** 表示用のタグ（DESIGN.md 5章 Tag）。先頭に # を付ける */
export function Tag({ label, children }: { label: string; children?: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-primary-soft px-2.5 py-1.5 text-xs leading-none font-medium text-primary-strong">
      #{label}
      {children}
    </span>
  );
}

export function TagList({ tags }: { tags: readonly string[] }) {
  if (tags.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <Tag key={tag} label={tag} />
      ))}
    </div>
  );
}
