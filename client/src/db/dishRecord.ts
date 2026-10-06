import { addTag, type DishContent } from "@dish-list/shared";
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

/** 料理への変更。編集する項目と、削除の印 */
export type DishPatch = Partial<DishContent> & { deleted?: true };

/** 保存する前に入力を整える（料理名の前後の空白、タグの表記と重複） */
export function sanitizeContent(content: DishContent): DishContent {
  return {
    ...content,
    name: content.name.trim(),
    tags: content.tags.reduce<string[]>((tags, tag) => addTag(tags, tag), []),
  };
}

export function buildNewDish(
  content: DishContent,
  actor: Actor,
  now: string = new Date().toISOString(),
): LocalDish {
  return {
    ...sanitizeContent(content),
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
  const { deleted, ...contentPatch } = patch;
  const content = sanitizeContent({
    name: dish.name,
    memo: dish.memo,
    tags: dish.tags,
    ...contentPatch,
  });
  return {
    ...dish,
    ...content,
    deleted: deleted ?? dish.deleted,
    updatedAt: now,
    updatedBy: actor.userName,
    clientId: actor.clientId,
    dirty: true,
    // 未同期の変更を重ねても、起点はサーバーから最後に受け取った版のまま
    baseVersion: dish.version,
  };
}
