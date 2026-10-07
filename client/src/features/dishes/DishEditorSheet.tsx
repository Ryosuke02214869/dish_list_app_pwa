import { addTag, DISH_LIMITS, type DishContentInput } from "@dish-list/shared";
import { useState } from "react";
import { BottomSheet } from "../../components/BottomSheet";
import { Button } from "../../components/Button";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { Field, TextArea, TextInput } from "../../components/Field";
import { useToast } from "../../components/Toast";
import type { LocalDish } from "../../db/database";
import { createDish, deleteDish, updateDish } from "../../db/dishRepository";
import { formatDateTime } from "../../lib/formatDateTime";
import { useActor } from "../session/session";
import { findSameNameDish, type TagSummary } from "./dishListQuery";
import { TagEditor } from "./TagEditor";

/**
 * 料理の追加・編集・削除のシート（F-01〜F-03、F-07、F-08、F-15）。
 * dish が null なら新規追加。開くたびに key を変えて作り直し、入力をリセットする前提。
 */

interface DishEditorSheetProps {
  open: boolean;
  dish: LocalDish | null;
  onClose: () => void;
  /** 重複の確認に使う、削除されていない料理 */
  allDishes: readonly LocalDish[];
  knownTags: readonly TagSummary[];
}

export function DishEditorSheet({
  open,
  dish,
  onClose,
  allDishes,
  knownTags,
}: DishEditorSheetProps) {
  const actor = useActor();
  const showToast = useToast();
  const [name, setName] = useState(dish?.name ?? "");
  const [memo, setMemo] = useState(dish?.memo ?? "");
  const [tags, setTags] = useState<string[]>(dish?.tags ?? []);
  const [tagDraft, setTagDraft] = useState("");
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const isNew = dish === null;
  const canSave = name.trim() !== "";
  const sameNameDish = findSameNameDish(allDishes, name, dish?.id);

  const handleSave = async () => {
    if (!canSave) return;
    // 確定し忘れたタグの入力も保存に含める
    const content: DishContentInput = { name, memo, tags: addTag(tags, tagDraft) };
    try {
      if (isNew) await createDish(content, actor);
      else await updateDish(dish.id, content, actor);
      showToast(isNew ? "追加しました" : "保存しました");
      onClose();
    } catch {
      showToast("保存できませんでした");
    }
  };

  const handleDelete = async () => {
    if (isNew) return;
    setConfirmingDelete(false);
    try {
      await deleteDish(dish.id, actor);
      showToast("削除しました");
      onClose();
    } catch {
      showToast("削除できませんでした");
    }
  };

  return (
    <>
      <BottomSheet
        open={open}
        title={isNew ? "料理を追加" : "料理を編集"}
        onClose={onClose}
        footer={
          <>
            {!isNew && (
              <Button variant="danger" onClick={() => setConfirmingDelete(true)}>
                削除
              </Button>
            )}
            <Button onClick={handleSave} disabled={!canSave}>
              保存する
            </Button>
          </>
        }
      >
        <Field
          label="料理名"
          htmlFor="dish-name"
          required
          hint={sameNameDish && "同じ名前の料理がすでに登録されています"}
        >
          <TextInput
            id="dish-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={DISH_LIMITS.nameMaxLength}
            placeholder="例：肉じゃが"
            autoFocus={isNew}
          />
        </Field>
        <Field label="メモ" htmlFor="dish-memo">
          <TextArea
            id="dish-memo"
            value={memo}
            onChange={(event) => setMemo(event.target.value)}
            maxLength={DISH_LIMITS.memoMaxLength}
            placeholder="材料、コツ、家族の反応など"
          />
        </Field>
        <Field label="タグ" htmlFor="dish-tags">
          <TagEditor
            id="dish-tags"
            tags={tags}
            onTagsChange={setTags}
            draft={tagDraft}
            onDraftChange={setTagDraft}
            knownTags={knownTags}
          />
        </Field>
        {!isNew && (
          <p className="mt-4 rounded-md bg-surface-muted px-3.5 py-3 text-xs text-text-sub">
            最終更新：{dish.updatedBy}（{formatDateTime(dish.updatedAt)}）
          </p>
        )}
      </BottomSheet>

      <ConfirmDialog
        open={confirmingDelete}
        title={`「${dish?.name ?? ""}」を削除しますか？`}
        message="削除すると、家族の端末からも消えます。"
        confirmLabel="削除する"
        danger
        onConfirm={handleDelete}
        onCancel={() => setConfirmingDelete(false)}
      />
    </>
  );
}
