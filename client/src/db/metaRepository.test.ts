import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "./database";
import { ensureClientId, getMeta, setMeta } from "./metaRepository";

beforeEach(async () => {
  await db.meta.clear();
});

describe("metaRepository", () => {
  it("保存した値を読み出せる", async () => {
    await setMeta("userName", "ママ");
    await setMeta("lastSeq", 12);
    expect(await getMeta("userName")).toBe("ママ");
    expect(await getMeta("lastSeq")).toBe(12);
  });

  it("未保存なら undefined を返す", async () => {
    expect(await getMeta("lastSyncedAt")).toBeUndefined();
  });

  it("端末IDは一度だけ発行し、以後は同じ値を返す", async () => {
    const [first, second] = await Promise.all([ensureClientId(), ensureClientId()]);
    expect(first).toBe(second);
    expect(await ensureClientId()).toBe(first);
  });
});
