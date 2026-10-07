import type { DishContentInput, DishCooking } from "@dish-list/shared";
import { db, type LocalDish } from "./database";
import {
  type Actor,
  applyPatch,
  buildNewDish,
  cookedCountPatch,
  cookedPatch,
  type DishPatch,
} from "./dishRecord";
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
export async function createDish(content: DishContentInput, actor: Actor): Promise<string> {
  const dish = buildNewDish(content, actor);
  await db.dishes.add(dish);
  notifyLocalChange();
  return dish.id;
}

export function updateDish(id: string, content: DishContentInput, actor: Actor): Promise<void> {
  return patchDish(id, content, actor);
}

export function deleteDish(id: string, actor: Actor): Promise<void> {
  return patchDish(id, { deleted: true }, actor);
}

/**
 * 「作った」を記録する（F-16）。取り消しに使えるよう、記録する前の値を返す。
 */
export async function markCooked(id: string, actor: Actor): Promise<DishCooking> {
  let previous: DishCooking = { cookedCount: 0, lastCookedAt: null };
  await patchDish(
    id,
    (current) => {
      previous = { cookedCount: current.cookedCount, lastCookedAt: current.lastCookedAt };
      return cookedPatch(current, new Date().toISOString());
    },
    actor,
  );
  return previous;
}

/** 作った回数を直す（F-21）。最後に作った日は変えない */
export function setCookedCount(id: string, count: number, actor: Actor): Promise<void> {
  return patchDish(id, (current) => cookedCountPatch(current, count), actor);
}

/** 「作った」の記録を、markCooked が返した値に戻す（取り消し） */
export function restoreCooking(id: string, previous: DishCooking, actor: Actor): Promise<void> {
  return patchDish(id, previous, actor);
}

/**
 * 1件を読み、変更して書き戻す。patch に関数を渡すと、今の値をもとに変更を決められる
 * （読み出しと書き込みの間にほかの変更が入らないよう、1つのトランザクションで行う）。
 * 変更が空なら何もしない（更新者や未同期の印を付けない）。
 */
async function patchDish(
  id: string,
  patch: DishPatch | ((current: LocalDish) => DishPatch),
  actor: Actor,
): Promise<void> {
  const changed = await db.transaction("rw", db.dishes, async () => {
    const current = await db.dishes.get(id);
    if (!current) throw new Error(`料理が見つかりません: ${id}`);
    const changes = typeof patch === "function" ? patch(current) : patch;
    if (Object.keys(changes).length === 0) return false;
    await db.dishes.put(applyPatch(current, changes, actor));
    return true;
  });
  if (changed) notifyLocalChange();
}
