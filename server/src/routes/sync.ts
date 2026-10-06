import { syncRequestSchema, type SyncRequest, type SyncResponse } from "@dish-list/shared";
import { Hono } from "hono";
import { z } from "zod";

/** POST /api/sync：Push と Pull（REQUIREMENTS.md 8章）。入力は zod で検証する */
export function syncRoute(sync: (request: SyncRequest) => SyncResponse) {
  return new Hono().post("/", async (c) => {
    const body: unknown = await c.req.json().catch(() => undefined);
    const parsed = syncRequestSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: "invalid_request", issues: z.treeifyError(parsed.error) }, 400);
    }
    return c.json(sync(parsed.data));
  });
}
