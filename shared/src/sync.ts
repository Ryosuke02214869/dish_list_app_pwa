import { z } from "zod";
import { dishSchema } from "./dish";
import { SYNC_LIMITS } from "./limits";

/**
 * 同期API（POST /api/sync）の入出力の定義（REQUIREMENTS.md 6.3、8章）。
 */

const nonNegativeInt = z.number().int().min(0);

/** Pushで送る1件。端末が編集の起点にしたサーバーの版数 `baseVersion` を含む */
export const dishChangeSchema = dishSchema.extend({
  baseVersion: nonNegativeInt,
});

export const syncRequestSchema = z.object({
  clientId: z.uuid(),
  /** 端末が最後に受け取った serverSeq */
  lastSeq: nonNegativeInt,
  changes: z.array(dishChangeSchema).max(SYNC_LIMITS.pushMaxCount),
});

export const pushStatusSchema = z.enum(["applied", "rejected"]);

export const pushResultSchema = z.object({
  id: z.uuid(),
  /** applied：端末の変更を採用した／rejected：競合でサーバー側の値を採用した */
  status: pushStatusSchema,
  /** 処理後のサーバーの版数 */
  version: nonNegativeInt,
  /** 処理後のサーバーの serverSeq */
  serverSeq: nonNegativeInt,
});

export const syncResponseSchema = z.object({
  results: z.array(pushResultSchema),
  /**
   * serverSeq > lastSeq の料理（今回Pushした分も含む）。
   * rejected になった料理は serverSeq に関係なく必ず含む（REQUIREMENTS.md 16章）
   */
  changes: z.array(dishSchema),
  /** 端末が次回のリクエストで送る lastSeq */
  lastSeq: nonNegativeInt,
  /** true なら、続けて同期すると残りの差分を取得できる */
  hasMore: z.boolean(),
});

export type DishChange = z.infer<typeof dishChangeSchema>;
export type SyncRequest = z.infer<typeof syncRequestSchema>;
export type PushStatus = z.infer<typeof pushStatusSchema>;
export type PushResult = z.infer<typeof pushResultSchema>;
export type SyncResponse = z.infer<typeof syncResponseSchema>;
