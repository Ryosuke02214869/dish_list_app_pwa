import { addTag, DISH_LIMITS, type DishContentInput, isRecipeUrl } from "@dish-list/shared";
import { useState } from "react";
import { BottomSheet } from "../../components/BottomSheet";
import { Button } from "../../components/Button";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { Field, TextArea, TextInput } from "../../components/Field";
import { StarIcon } from "../../components/icons";
import { useToast } from "../../components/Toast";
import type { LocalDish } from "../../db/database";
import { createDish, deleteDish, updateDish } from "../../db/dishRepository";
import { formatDateTime } from "../../lib/formatDateTime";
import { useActor } from "../session/session";
import { CookingSection } from "./CookingSection";
import { findSameNameDish, type TagSummary } from "./dishListQuery";
import { TagEditor } from "./TagEditor";

/**
 * 料理の追加・編集・削除のシート（F-01〜F-03、F-07、F-08、F-15〜F-17、F-19〜F-21）。
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
  const [favorite, setFavorite] = useState(dish?.favorite ?? false);
  const [recipeUrl, setRecipeUrl] = useState(dish?.recipeUrl ?? "");
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const isNew = dish === null;
  const trimmedUrl = recipeUrl.trim();
  const urlIsValid = trimmedUrl === "" || isRecipeUrl(trimmedUrl);
  const canSave = name.trim() !== "" && urlIsValid;
  const sameNameDish = findSameNameDish(allDishes, name, dish?.id);

  const handleSave = async () => {
    if (!canSave) return;
    // 確定し忘れたタグの入力も保存に含める
    const content: DishContentInput = {
      name,
      memo,
      tags: addTag(tags, tagDraft),
      favorite,
      recipeUrl: trimmedUrl,
    };
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
        <Field label="お気に入り" htmlFor="dish-favorite">
          <button
            id="dish-favorite"
            type="button"
            aria-pressed={favorite}
            onClick={() => setFavorite((current) => !current)}
            className={`inline-flex h-10 items-center gap-1.5 rounded-full border px-4 text-sm transition-colors ${
              favorite
                ? "border-primary bg-primary font-bold text-on-primary"
                : "border-border bg-surface text-text-sub"
            }`}
          >
            <StarIcon filled={favorite} />
            {favorite ? "お気に入り" : "お気に入りにする"}
          </button>
        </Field>
        <Field
          label="参考レシピのURL"
          htmlFor="dish-recipe-url"
          hint={!urlIsValid && "http:// か https:// で始まるURLを入力してください"}
        >
          <div className="flex gap-2">
            <TextInput
              id="dish-recipe-url"
              type="url"
              inputMode="url"
              autoCapitalize="none"
              autoCorrect="off"
              value={recipeUrl}
              onChange={(event) => setRecipeUrl(event.target.value)}
              maxLength={DISH_LIMITS.recipeUrlMaxLength}
              placeholder="https://"
            />
            {trimmedUrl !== "" && urlIsValid && (
              <a
                href={trimmedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="grid h-12 flex-none place-items-center rounded-sm border border-border bg-surface px-4 text-[15px] font-bold text-primary-strong"
              >
                開く
              </a>
            )}
          </div>
        </Field>
        {!isNew && <CookingSection dish={dish} />}
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
