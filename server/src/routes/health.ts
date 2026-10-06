import type { HealthResponse } from "@dish-list/shared";
import { Hono } from "hono";

/** GET /api/health：死活監視（REQUIREMENTS.md 8章） */
export function healthRoute(version: string) {
  return new Hono().get("/", (c) => c.json({ ok: true, version } satisfies HealthResponse));
}
