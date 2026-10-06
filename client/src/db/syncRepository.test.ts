import "fake-indexeddb/auto";
import type { SyncResponse } from "@dish-list/shared";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "./database";
import { createDish, getDish, updateDish } from "./dishRepository";
import { ensureClientId, getMeta, setMeta } from "./metaRepository";
import { applySyncResponse, collectChanges, countDirty, getSyncCursor } from "./syncRepository";

const actor = { clientId: "7d2c1b4a-1f3e-4c5d-8e9f-0a1b2c3d4e5f", userName: "ママ" };

beforeEach(async () => {
  await db.dishes.clear();
  await db.meta.clear();
});

const content = (name: string) => ({ name, memo: "", tags: [] });

/** 送った変更をすべて採用し、そのまま返す応答 */
function acceptAll(changes: Awaited<ReturnType<typeof collectChanges>>): SyncResponse {
  return {
    results: changes.map((c, i) => ({
      id: c.id,
      status: "applied",
      version: 1,
      serverSeq: i + 1,
    })),
    changes: changes.map(({ baseVersion: _b, ...dish }, i) => ({
      ...dish,
      version: 1,
      serverSeq: i + 1,
    })),
    lastSeq: changes.length,
    hasMore: false,
  };
}

describe("collectChanges", () => {
  it("未同期の料理だけを、端末だけの項目を除いて返す", async () => {
    await createDish(content("肉じゃが"), actor);
    const changes = await collectChanges(200);
    expect(changes).toHaveLength(1);
    expect(changes[0]).toMatchObject({ name: "肉じゃが", baseVersion: 0 });
    expect(changes[0]).not.toHaveProperty("dirty");
  });

  it("上限の件数までしか返さない", async () => {
    for (const name of ["a", "b", "c"]) await createDish(content(name), actor);
    expect(await collectChanges(2)).toHaveLength(2);
  });
});

describe("applySyncResponse", () => {
  it("採用された料理は同期済みになり、lastSeq と最終同期時刻を保存する", async () => {
    const id = await createDish(content("肉じゃが"), actor);
    const pushed = await collectChanges(200);

    await applySyncResponse(acceptAll(pushed), pushed, "2026-10-06T12:00:00.000Z");

    expect(await getDish(id)).toMatchObject({ dirty: false, version: 1, serverSeq: 1 });
    expect(await countDirty()).toBe(0);
    expect(await getMeta("lastSeq")).toBe(1);
    expect(await getMeta("lastSyncedAt")).toBe("2026-10-06T12:00:00.000Z");
  });

  it("同期中に編集した料理は、未同期のまま入力を残す", async () => {
    const id = await createDish(content("肉じゃが"), actor);
    const pushed = await collectChanges(200);
    // 送信中に編集された
    await new Promise((resolve) => setTimeout(resolve, 2));
    await updateDish(id, content("肉じゃが（甘め）"), actor);

    await applySyncResponse(acceptAll(pushed), pushed);

    expect(await getDish(id)).toMatchObject({ name: "肉じゃが（甘め）", dirty: true });
  });

  it("ほかの端末の料理を受け取って追加する", async () => {
    await applySyncResponse(
      {
        results: [],
        changes: [
          {
            id: "11111111-2222-4333-8444-555555555555",
            name: "豚汁",
            memo: "",
            tags: ["和食"],
            createdAt: "2026-10-04T10:00:00.000Z",
            createdBy: "パパ",
            updatedAt: "2026-10-04T10:00:00.000Z",
            updatedBy: "パパ",
            clientId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
            deleted: false,
            version: 1,
            serverSeq: 7,
          },
        ],
        lastSeq: 7,
        hasMore: false,
      },
      [],
    );
    expect(await getDish("11111111-2222-4333-8444-555555555555")).toMatchObject({
      name: "豚汁",
      dirty: false,
      baseVersion: 1,
    });
  });
});

describe("getSyncCursor", () => {
  it("端末IDと lastSeq（未保存なら0）を返す", async () => {
    const clientId = await ensureClientId();
    expect(await getSyncCursor()).toEqual({ clientId, lastSeq: 0 });
    await setMeta("lastSeq", 12);
    expect(await getSyncCursor()).toEqual({ clientId, lastSeq: 12 });
  });
});
