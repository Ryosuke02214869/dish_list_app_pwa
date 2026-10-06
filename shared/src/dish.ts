import { z } from "zod";
import { DISH_LIMITS } from "./limits";

/**
 * 料理のデータ定義（REQUIREMENTS.md 7.1）。クライアントとサーバーで共有する唯一の定義。
 *
 * - DishContent：利用者が編集する項目。項目を増やすときは、まずここに加える
 * - DishRecordMeta：記録と同期のための項目。端末とサーバーが値を管理する
 */

const nonBlank = (max: number) =>
  z
    .string()
    .max(max)
    .refine((value) => value.trim() !== "", { message: "空にはできません" });

const isoDateTime = z.iso.datetime();
const nonNegativeInt = z.number().int().min(0);

export const dishContentSchema = z.object({
  name: nonBlank(DISH_LIMITS.nameMaxLength),
  memo: z.string().max(DISH_LIMITS.memoMaxLength),
  tags: z.array(nonBlank(DISH_LIMITS.tagMaxLength)).max(DISH_LIMITS.tagsMaxCount),
});

export const dishRecordMetaSchema = z.object({
  /** 端末で生成するUUID v4 */
  id: z.uuid(),
  /** 端末の時刻 */
  createdAt: isoDateTime,
  createdBy: nonBlank(DISH_LIMITS.userNameMaxLength),
  /** 端末の時刻。競合時の後勝ちの判定に使う */
  updatedAt: isoDateTime,
  updatedBy: nonBlank(DISH_LIMITS.userNameMaxLength),
  /** 最後に更新した端末のID */
  clientId: z.uuid(),
  /** 論理削除フラグ。削除は墓標として同期する */
  deleted: z.boolean(),
  /** サーバーが管理する版数。端末で新規作成したときは0 */
  version: nonNegativeInt,
  /** サーバーが採番する連番。差分取得の基準。端末で新規作成したときは0 */
  serverSeq: nonNegativeInt,
});

export const dishSchema = dishContentSchema.extend(dishRecordMetaSchema.shape);

export type DishContent = z.infer<typeof dishContentSchema>;
export type DishRecordMeta = z.infer<typeof dishRecordMetaSchema>;
export type Dish = z.infer<typeof dishSchema>;
