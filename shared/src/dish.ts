import { z } from "zod";
import { DISH_LIMITS } from "./limits";

/**
 * 料理のデータ定義（REQUIREMENTS.md 7.1、18.2）。クライアントとサーバーで共有する唯一の定義。
 *
 * - DishContent：利用者が編集シートで編集する項目。項目を増やすときは、まずここに加える
 * - DishCooking：「作った」の記録（F-16）。ボタン操作で更新する
 * - DishRecordMeta：記録と同期のための項目。端末とサーバーが値を管理する
 *
 * フェーズ2で加えた項目には既定値を持たせ、項目のない古いデータや更新前のアプリからの送信も受け付ける。
 */

const nonBlank = (max: number) =>
  z
    .string()
    .max(max)
    .refine((value) => value.trim() !== "", { message: "空にはできません" });

const isoDateTime = z.iso.datetime();
const nonNegativeInt = z.number().int().min(0);

/** 参考レシピのURLとして使えるか（http:// か https:// で始まる絶対URL） */
export function isRecipeUrl(value: string): boolean {
  // URL.canParse は iOS 17 からなので使わない（対応は iOS 16.4 以降。REQUIREMENTS.md 2章）
  try {
    const { protocol } = new URL(value);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

/** フェーズ2で加えた項目の既定値（REQUIREMENTS.md 18.2）。端末の古いデータの補完にも使う */
export const DISH_PHASE2_DEFAULTS = {
  favorite: false,
  recipeUrl: "",
  cookedCount: 0,
  lastCookedAt: null,
} as const;

export const dishContentSchema = z.object({
  name: nonBlank(DISH_LIMITS.nameMaxLength),
  memo: z.string().max(DISH_LIMITS.memoMaxLength),
  tags: z.array(nonBlank(DISH_LIMITS.tagMaxLength)).max(DISH_LIMITS.tagsMaxCount),
  /** お気に入り（家族で共通） */
  favorite: z.boolean().default(DISH_PHASE2_DEFAULTS.favorite),
  /** 参考レシピのURL。空文字なら未設定 */
  recipeUrl: z
    .string()
    .max(DISH_LIMITS.recipeUrlMaxLength)
    .refine((value) => value === "" || isRecipeUrl(value), {
      message: "http:// か https:// で始まるURLにしてください",
    })
    .default(DISH_PHASE2_DEFAULTS.recipeUrl),
});

export const dishCookingSchema = z.object({
  /** 作った回数 */
  cookedCount: nonNegativeInt.default(DISH_PHASE2_DEFAULTS.cookedCount),
  /** 最後に作った日時（端末の時刻）。まだ作っていなければ null */
  lastCookedAt: isoDateTime.nullable().default(DISH_PHASE2_DEFAULTS.lastCookedAt),
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

export const dishSchema = dishContentSchema
  .extend(dishCookingSchema.shape)
  .extend(dishRecordMetaSchema.shape);

export type DishContent = z.infer<typeof dishContentSchema>;
/** 入力としての DishContent。既定値のある項目（お気に入り、URL）は省略できる */
export type DishContentInput = z.input<typeof dishContentSchema>;
export type DishCooking = z.infer<typeof dishCookingSchema>;
export type DishRecordMeta = z.infer<typeof dishRecordMetaSchema>;
export type Dish = z.infer<typeof dishSchema>;
