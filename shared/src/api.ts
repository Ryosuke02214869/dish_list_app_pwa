import { z } from "zod";

/** APIのパス（REQUIREMENTS.md 8章）。クライアントとサーバーで同じ値を使う */
export const API_PATHS = {
  health: "/api/health",
  sync: "/api/sync",
} as const;

export const healthResponseSchema = z.object({
  ok: z.literal(true),
  /** サーバーのアプリのバージョン */
  version: z.string(),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;
