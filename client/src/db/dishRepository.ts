import type { DishContent } from "@dish-list/shared";
import { db, type LocalDish } from "./database";
import { type Actor, applyPatch, buildNewDish, type DishPatch } from "./dishRecord";
import { notifyLocalChange } from "./localChanges";

/**
 * 料理の読み書き。UIからの変更はすべてこの関数群を通す。
 * 削除は論理削除（墓標）にし、レコードは消さない（REQUIREMENTS.md 6.4）。
 * 変更したら notifyLocalChange() で同期エンジンに知らせる。
 */

/** 削除されていない料理をすべて返す */
export function listActiveDishes(): Promise<LocalDish[]> {
  return db.dishes.filter((dish) => !dish.deleted).toArray();
}

export function getDish(id: string): Promise<LocalDish | undefined> {
  return db.dishes.get(id);
}

/** 料理を追加し、そのIDを返す */
export async function createDish(content: DishContent, actor: Actor): Promise<string> {
  const dish = buildNewDish(content, actor);
  await db.dishes.add(dish);
  notifyLocalChange();
  return dish.id;
}

export function updateDish(id: string, content: DishContent, actor: Actor): Promise<void> {
  return patchDish(id, content, actor);
}

export function deleteDish(id: string, actor: Actor): Promise<void> {
  return patchDish(id, { deleted: true }, actor);
}

async function patchDish(id: string, patch: DishPatch, actor: Actor): Promise<void> {
  await db.transaction("rw", db.dishes, async () => {
    const current = await db.dishes.get(id);
    if (!current) throw new Error(`料理が見つかりません: ${id}`);
    await db.dishes.put(applyPatch(current, patch, actor));
  });
  notifyLocalChange();
}
