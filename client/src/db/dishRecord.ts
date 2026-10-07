import {
  addTag,
  DISH_PHASE2_DEFAULTS,
  type DishContent,
  type DishContentInput,
  type DishCooking,
} from "@dish-list/shared";
import type { LocalDish } from "./database";

/**
 * 料理のレコードを作る・変える純粋な関数。データベースには触らない。
 * 端末での変更は、必ずここを通して「未同期（dirty）」の印と更新者を付ける。
 */

/** 変更した人と端末 */
export interface Actor {
  clientId: string;
  userName: string;
}

/** 料理への変更。編集する項目、作った記録、削除の印のうち、変えるものだけを指定する */
export type DishPatch = Partial<DishContentInput> & Partial<DishCooking> & { deleted?: true };

/**
 * 保存する前に入力を整える（料理名とURLの前後の空白、タグの表記と重複）。
 * 省略された項目（お気に入り、URL）は既定値にする。
 */
export function sanitizeContent(content: DishContentInput): DishContent {
  return {
    name: content.name.trim(),
    memo: content.memo,
    tags: content.tags.reduce<string[]>((tags, tag) => addTag(tags, tag), []),
    favorite: content.favorite ?? DISH_PHASE2_DEFAULTS.favorite,
    recipeUrl: (content.recipeUrl ?? DISH_PHASE2_DEFAULTS.recipeUrl).trim(),
  };
}

export function buildNewDish(
  content: DishContentInput,
  actor: Actor,
  now: string = new Date().toISOString(),
): LocalDish {
  return {
    ...sanitizeContent(content),
    cookedCount: DISH_PHASE2_DEFAULTS.cookedCount,
    lastCookedAt: DISH_PHASE2_DEFAULTS.lastCookedAt,
    id: crypto.randomUUID(),
    createdAt: now,
    createdBy: actor.userName,
    updatedAt: now,
    updatedBy: actor.userName,
    clientId: actor.clientId,
    deleted: false,
    version: 0,
    serverSeq: 0,
    dirty: true,
    baseVersion: 0,
  };
}

export function applyPatch(
  dish: LocalDish,
  patch: DishPatch,
  actor: Actor,
  now: string = new Date().toISOString(),
): LocalDish {
  const { deleted, cookedCount, lastCookedAt, ...contentPatch } = patch;
  const content = sanitizeContent({
    name: dish.name,
    memo: dish.memo,
    tags: dish.tags,
    favorite: dish.favorite,
    recipeUrl: dish.recipeUrl,
    ...contentPatch,
  });
  return {
    ...dish,
    ...content,
    cookedCount: cookedCount ?? dish.cookedCount,
    lastCookedAt: lastCookedAt === undefined ? dish.lastCookedAt : lastCookedAt,
    deleted: deleted ?? dish.deleted,
    updatedAt: now,
    updatedBy: actor.userName,
    clientId: actor.clientId,
    dirty: true,
    // 未同期の変更を重ねても、起点はサーバーから最後に受け取った版のまま
    baseVersion: dish.version,
  };
}
