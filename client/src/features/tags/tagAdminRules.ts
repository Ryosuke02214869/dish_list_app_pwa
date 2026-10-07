import { normalize, toTagLabel } from "@dish-list/shared";
import type { TagSummary } from "../dishes/dishListQuery";

/**
 * タグの管理（REQUIREMENTS.md 19.1）の入力の確認と、統合になるかの判定。画面に依存しない純粋な関数。
 */

/** 新しい名前を確かめる。問題があれば表示する文言、なければ null */
export function validateNewTagName(input: string, tag: TagSummary): string | null {
  const label = toTagLabel(input);
  if (label === "") return "名前を入力してください";
  // 表記ゆれがなく、表記も同じなら変える意味がない（表記ゆれがあれば、そろえる意味がある）
  if (label === tag.label && tag.labels.length === 1) return "今の名前と同じです";
  return null;
}

/** 新しい名前が、ほかの既存のタグと同じになる（統合になる）なら、そのタグを返す */
export function findMergeTarget(
  input: string,
  tag: TagSummary,
  allTags: readonly TagSummary[],
): TagSummary | undefined {
  const key = normalize(toTagLabel(input));
  if (key === tag.key) return undefined;
  return allTags.find((other) => other.key === key);
}
