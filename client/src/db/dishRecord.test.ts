import { describe, expect, it } from "vitest";
import type { LocalDish } from "./database";
import { applyPatch, buildNewDish, sanitizeContent } from "./dishRecord";

const actor = { clientId: "7d2c1b4a-1f3e-4c5d-8e9f-0a1b2c3d4e5f", userName: "ママ" };
const otherActor = { clientId: "11111111-2222-4333-8444-555555555555", userName: "パパ" };
const T1 = "2026-10-04T11:15:00.000Z";
const T2 = "2026-10-05T09:00:00.000Z";

/** サーバーと同期済み（版数3）の料理 */
const syncedDish = (): LocalDish => ({
  ...buildNewDish({ name: "肉じゃが", memo: "", tags: ["和食"] }, actor, T1),
  version: 3,
  serverSeq: 10,
  dirty: false,
  baseVersion: 3,
});

describe("sanitizeContent", () => {
  it("料理名の前後の空白を除き、タグの表記と重複を整える", () => {
    expect(
      sanitizeContent({ name: " 肉じゃが ", memo: " メモ ", tags: ["#カレー", "かれー", "  "] }),
    ).toEqual({ name: "肉じゃが", memo: " メモ ", tags: ["カレー"] });
  });
});

describe("buildNewDish", () => {
  it("未同期・版数0の新しい料理を作る", () => {
    const dish = buildNewDish({ name: "豚汁", memo: "", tags: [] }, actor, T1);
    expect(dish).toMatchObject({
      name: "豚汁",
      createdAt: T1,
      createdBy: "ママ",
      updatedAt: T1,
      updatedBy: "ママ",
      clientId: actor.clientId,
      deleted: false,
      version: 0,
      serverSeq: 0,
      dirty: true,
      baseVersion: 0,
    });
    expect(dish.id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("毎回違うIDを発行する", () => {
    const content = { name: "豚汁", memo: "", tags: [] };
    expect(buildNewDish(content, actor).id).not.toBe(buildNewDish(content, actor).id);
  });
});

describe("applyPatch", () => {
  it("編集した項目と更新者を変え、未同期にする", () => {
    const edited = applyPatch(syncedDish(), { memo: "みりん多め" }, otherActor, T2);
    expect(edited).toMatchObject({
      name: "肉じゃが",
      memo: "みりん多め",
      tags: ["和食"],
      createdBy: "ママ",
      updatedAt: T2,
      updatedBy: "パパ",
      clientId: otherActor.clientId,
      dirty: true,
      baseVersion: 3,
    });
  });

  it("サーバーの版数と連番は変えない", () => {
    const edited = applyPatch(syncedDish(), { name: "肉じゃが（甘め）" }, actor, T2);
    expect(edited.version).toBe(3);
    expect(edited.serverSeq).toBe(10);
  });

  it("削除は墓標にする（項目は残す）", () => {
    const deleted = applyPatch(syncedDish(), { deleted: true }, actor, T2);
    expect(deleted).toMatchObject({ deleted: true, name: "肉じゃが", dirty: true });
  });

  it("元のレコードは変更しない", () => {
    const dish = syncedDish();
    applyPatch(dish, { name: "変更" }, actor, T2);
    expect(dish.name).toBe("肉じゃが");
  });
});
