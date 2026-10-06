import { addTag, DISH_LIMITS, includesTag, normalize } from "@dish-list/shared";
import { useRef } from "react";
import { INPUT_FRAME_CLASSES } from "../../components/Field";
import type { TagSummary } from "./dishListQuery";
import { Tag } from "./TagList";

/**
 * タグの入力欄（F-07、DESIGN.md 5章 TagEditor）。
 * - Enter で確定（IMEの変換中の Enter は無視する）
 * - 入力が空のときの Backspace で、最後のタグを外す
 * - 下に既存のタグを候補として出す（入力中の文字で絞り込む）
 * 入力途中の文字（draft）は親が持ち、保存時に確定できるようにしている。
 */

const MAX_SUGGESTIONS = 8;

interface TagEditorProps {
  id: string;
  tags: readonly string[];
  onTagsChange: (tags: string[]) => void;
  draft: string;
  onDraftChange: (draft: string) => void;
  /** 候補にする既存のタグ（使用回数の多い順） */
  knownTags: readonly TagSummary[];
}

export function TagEditor({
  id,
  tags,
  onTagsChange,
  draft,
  onDraftChange,
  knownTags,
}: TagEditorProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const isFull = tags.length >= DISH_LIMITS.tagsMaxCount;

  const commit = (raw: string) => {
    onTagsChange(addTag(tags, raw));
    onDraftChange("");
  };

  const removeAt = (index: number) => onTagsChange(tags.filter((_, i) => i !== index));

  const draftKey = normalize(draft.replace(/^#+/, ""));
  const suggestions = isFull
    ? []
    : knownTags
        .filter((tag) => !includesTag(tags, tag.label) && tag.key.includes(draftKey))
        .slice(0, MAX_SUGGESTIONS);

  return (
    <>
      <div
        className={`flex flex-wrap items-center gap-1.5 p-2 ${INPUT_FRAME_CLASSES}`}
        onClick={() => inputRef.current?.focus()}
      >
        {tags.map((tag, index) => (
          <Tag key={tag} label={tag}>
            <button
              type="button"
              onClick={() => removeAt(index)}
              aria-label={`${tag}を外す`}
              className="pl-1 text-sm leading-none"
            >
              ×
            </button>
          </Tag>
        ))}
        <input
          ref={inputRef}
          id={id}
          value={draft}
          onChange={(event) => onDraftChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.nativeEvent.isComposing) {
              event.preventDefault();
              commit(draft);
            } else if (event.key === "Backspace" && draft === "" && tags.length > 0) {
              removeAt(tags.length - 1);
            }
          }}
          disabled={isFull}
          placeholder={isFull ? `タグは${DISH_LIMITS.tagsMaxCount}個までです` : "入力してEnter"}
          enterKeyHint="done"
          className="min-w-[100px] flex-1 bg-transparent p-1 text-base outline-none placeholder:text-text-muted"
        />
      </div>
      {suggestions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {suggestions.map((tag) => (
            <button
              key={tag.key}
              type="button"
              onClick={() => commit(tag.label)}
              className="rounded-full border border-dashed border-primary-border px-2.5 py-1.5 text-xs text-primary-strong"
            >
              + {tag.label}
            </button>
          ))}
        </div>
      )}
    </>
  );
}
