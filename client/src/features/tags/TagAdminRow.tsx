import { Button } from "../../components/Button";
import type { TagSummary } from "../dishes/dishListQuery";
import { Tag } from "../dishes/TagList";

/**
 * タグの管理の1行（DESIGN.md 5章 TagAdminRow）。
 * 狭い画面でもタグ名と件数が途中で折り返さないよう、左側は1行に収め、長い名前は省略する。
 */
export function TagAdminRow({
  tag,
  onRename,
  onDelete,
}: {
  tag: TagSummary;
  onRename: (tag: TagSummary) => void;
  onDelete: (tag: TagSummary) => void;
}) {
  const hasVariants = tag.labels.length > 1;
  return (
    <div className="flex items-center gap-2 rounded-lg bg-surface p-3 pl-4 shadow-card">
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2 whitespace-nowrap">
          <span className="min-w-0 truncate">
            <Tag label={tag.label} />
          </span>
          <span className="flex-none text-xs text-text-muted">{tag.count}件</span>
        </div>
        {hasVariants && (
          <p className="mt-1.5 text-[11px] break-words text-warning">
            表記ゆれ：{tag.labels.join("／")}
          </p>
        )}
      </div>
      <Button variant="secondary" size="sm" className="flex-none" onClick={() => onRename(tag)}>
        名前を変える
      </Button>
      <Button variant="danger" size="sm" className="flex-none" onClick={() => onDelete(tag)}>
        削除
      </Button>
    </div>
  );
}
