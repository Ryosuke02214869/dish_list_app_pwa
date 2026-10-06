import { describe, expect, it } from "vitest";
import { SYNC_LIMITS } from "./limits";
import { syncRequestSchema, syncResponseSchema } from "./sync";

const clientId = "7d2c1b4a-1f3e-4c5d-8e9f-0a1b2c3d4e5f";

const change = {
  id: "0b9f3a3e-6c1e-4b8a-9d55-2f6f5a1c7e01",
  name: "肉じゃが",
  memo: "",
  tags: [],
  createdAt: "2026-10-04T11:15:00.000Z",
  createdBy: "ママ",
  updatedAt: "2026-10-04T11:15:00.000Z",
  updatedBy: "ママ",
  clientId,
  deleted: false,
  version: 0,
  serverSeq: 0,
  baseVersion: 0,
};

describe("syncRequestSchema", () => {
  it("正しいリクエストを受け付ける", () => {
    expect(syncRequestSchema.safeParse({ clientId, lastSeq: 0, changes: [change] }).success).toBe(
      true,
    );
  });

  it("変更に baseVersion がなければ拒否する", () => {
    const { baseVersion: _omitted, ...withoutBase } = change;
    expect(
      syncRequestSchema.safeParse({ clientId, lastSeq: 0, changes: [withoutBase] }).success,
    ).toBe(false);
  });

  it("1回の上限件数を超えたら拒否する", () => {
    const changes = Array.from({ length: SYNC_LIMITS.pushMaxCount + 1 }, () => change);
    expect(syncRequestSchema.safeParse({ clientId, lastSeq: 0, changes }).success).toBe(false);
  });

  it("lastSeq が負なら拒否する", () => {
    expect(syncRequestSchema.safeParse({ clientId, lastSeq: -1, changes: [] }).success).toBe(false);
  });
});

describe("syncResponseSchema", () => {
  it("正しいレスポンスを受け付ける", () => {
    const { baseVersion: _omitted, ...dish } = change;
    const response = {
      results: [{ id: change.id, status: "applied", version: 1, serverSeq: 1 }],
      changes: [{ ...dish, version: 1, serverSeq: 1 }],
      lastSeq: 1,
      hasMore: false,
    };
    expect(syncResponseSchema.safeParse(response).success).toBe(true);
  });

  it("status は applied か rejected だけを受け付ける", () => {
    const response = {
      results: [{ id: change.id, status: "ok", version: 1, serverSeq: 1 }],
      changes: [],
      lastSeq: 1,
      hasMore: false,
    };
    expect(syncResponseSchema.safeParse(response).success).toBe(false);
  });
});
