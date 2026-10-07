import { API_PATHS, healthResponseSchema, syncResponseSchema } from "@dish-list/shared";
import { describe, expect, it } from "vitest";
import { createApp } from "./app";
import { openDatabase } from "./db/database";
import { createDishStore } from "./db/dishStore";
import { createSyncService } from "./sync/syncService";
import { CLIENT_A, makeChange } from "./testing/fixtures";

function setup() {
  const db = openDatabase(":memory:");
  const { sync } = createSyncService(db, createDishStore(db));
  return createApp({ version: "9.9.9", sync });
}

const postJson = (app: ReturnType<typeof setup>, body: unknown) =>
  app.request(API_PATHS.sync, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

describe("GET /api/health", () => {
  it("ok とバージョンを返す", async () => {
    const response = await setup().request(API_PATHS.health);
    expect(response.status).toBe(200);
    expect(healthResponseSchema.parse(await response.json())).toEqual({
      ok: true,
      version: "9.9.9",
    });
  });

  it("キャッシュさせない", async () => {
    const response = await setup().request(API_PATHS.health);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });
});

describe("POST /api/sync", () => {
  it("正しいリクエストに、定義どおりのレスポンスを返す", async () => {
    const response = await postJson(setup(), {
      clientId: CLIENT_A,
      lastSeq: 0,
      changes: [makeChange()],
    });
    expect(response.status).toBe(200);
    const body = syncResponseSchema.parse(await response.json());
    expect(body.results[0]?.status).toBe("applied");
    expect(body.lastSeq).toBe(1);
  });

  it("更新前のアプリ（フェーズ2の項目なし）からの送信も受け付け、既定値で保存する", async () => {
    const {
      favorite: _f,
      recipeUrl: _r,
      cookedCount: _c,
      lastCookedAt: _l,
      ...legacy
    } = makeChange();
    const response = await postJson(setup(), { clientId: CLIENT_A, lastSeq: 0, changes: [legacy] });
    expect(response.status).toBe(200);
    const body = syncResponseSchema.parse(await response.json());
    expect(body.changes[0]).toMatchObject({ favorite: false, recipeUrl: "", cookedCount: 0 });
  });

  it("JSONとして読めなければ 400 を返す", async () => {
    const response = await postJson(setup(), "{ broken");
    expect(response.status).toBe(400);
  });

  it("定義に合わない入力は 400 を返し、保存しない", async () => {
    const app = setup();
    const invalid = await postJson(app, {
      clientId: CLIENT_A,
      lastSeq: 0,
      changes: [makeChange({ name: "" })],
    });
    expect(invalid.status).toBe(400);
    expect(await invalid.json()).toMatchObject({ error: "invalid_request" });

    const after = await postJson(app, { clientId: CLIENT_A, lastSeq: 0, changes: [] });
    expect(syncResponseSchema.parse(await after.json()).changes).toEqual([]);
  });

  it("GET では受け付けない", async () => {
    const response = await setup().request(API_PATHS.sync);
    expect(response.status).toBe(404);
  });
});
