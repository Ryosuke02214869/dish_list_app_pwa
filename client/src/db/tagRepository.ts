import { normalize, removeTagFromList, renameTagInList } from "@dish-list/shared";
import { db, type LocalDish } from "./database";
import { type Actor, applyPatch } from "./dishRecord";
import { notifyLocalChange } from "./localChanges";

/**
 * タグの一括変更（REQUIREMENTS.md 19.1）。タグは料理の中の文字列なので、
 * 対象のタグが付いた料理をそれぞれ編集する（各料理の編集として同期される）。
 * 端末の中では1つのトランザクションで行い、途中で失敗したら何も変えない。
 * 削除された料理（墓標）は変更しない。
 */

/** タグの名前を変える。ほかのタグと同じ名前なら統合になる。変えた料理の件数を返す */
export function renameTag(fromKey: string, newLabel: string, actor: Actor): Promise<number> {
  return updateTagsOfDishes(fromKey, (tags) => renameTagInList(tags, fromKey, newLabel), actor);
}

/** タグをすべての料理から外す。外した料理の件数を返す */
export function removeTag(key: string, actor: Actor): Promise<number> {
  return updateTagsOfDishes(key, (tags) => removeTagFromList(tags, key), actor);
}

async function updateTagsOfDishes(
  key: string,
  changeTags: (tags: readonly string[]) => string[],
  actor: Actor,
): Promise<number> {
  const count = await db.transaction("rw", db.dishes, async () => {
    const targets = await db.dishes
      .filter((dish) => !dish.deleted && dish.tags.some((tag) => normalize(tag) === key))
      .toArray();
    const now = new Date().toISOString();
    const updated: LocalDish[] = targets.map((dish) =>
      applyPatch(dish, { tags: changeTags(dish.tags) }, actor, now),
    );
    await db.dishes.bulkPut(updated);
    return updated.length;
  });
  if (count > 0) notifyLocalChange();
  return count;
}
