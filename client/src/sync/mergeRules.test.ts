import type { Dish } from "@dish-list/shared";
import { describe, expect, it } from "vitest";
import type { LocalDish } from "../db/database";
import { applyPushResult, mergeServerDish, type PushedSnapshot } from "./mergeRules";

const ID = "0b9f3a3e-6c1e-4b8a-9d55-2f6f5a1c7e01";
const T_PUSHED = "2026-10-04T10:00:00.000Z";
const T_EDITED_LATER = "2026-10-04T10:00:05.000Z";

const serverDish = (fields: Partial<Dish> = {}): Dish => ({
  id: ID,
  name: "肉じゃが（サーバー）",
  memo: "",
  tags: [],
  createdAt: T_PUSHED,
  createdBy: "ママ",
  updatedAt: T_PUSHED,
  updatedBy: "ママ",
  clientId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  deleted: false,
  version: 2,
  serverSeq: 5,
  ...fields,
});

const localDish = (fields: Partial<LocalDish> = {}): LocalDish => ({
  ...serverDish({ name: "肉じゃが（端末）", version: 1, serverSeq: 3 }),
  dirty: false,
  baseVersion: 1,
  ...fields,
});

const nothingPushed: PushedSnapshot = new Map();
const pushedAt = (updatedAt: string): PushedSnapshot => new Map([[ID, updatedAt]]);

describe("mergeServerDish", () => {
  it("端末にない料理は、同期済みとして追加する", () => {
    expect(mergeServerDish(undefined, serverDish(), nothingPushed)).toMatchObject({
      name: "肉じゃが（サーバー）",
      dirty: false,
      version: 2,
      baseVersion: 2,
      serverSeq: 5,
    });
  });

  it("同期済みの料理は、サーバーの内容で上書きする", () => {
    expect(mergeServerDish(localDish(), serverDish(), nothingPushed)?.name).toBe(
      "肉じゃが（サーバー）",
    );
  });

  it("未同期で、今回送っていない料理は上書きしない", () => {
    expect(mergeServerDish(localDish({ dirty: true }), serverDish(), nothingPushed)).toBeNull();
  });

  it("今回送って、その後に編集していない料理は上書きする（送った内容は処理済み）", () => {
    const local = localDish({ dirty: true, updatedAt: T_PUSHED });
    expect(mergeServerDish(local, serverDish(), pushedAt(T_PUSHED))).toMatchObject({
      name: "肉じゃが（サーバー）",
      dirty: false,
    });
  });

  it("送った後にさらに編集した料理は上書きしない（入力中の内容を守る）", () => {
    const local = localDish({ dirty: true, updatedAt: T_EDITED_LATER });
    expect(mergeServerDish(local, serverDish(), pushedAt(T_PUSHED))).toBeNull();
  });

  it("端末のほうが新しい版なら、古い内容に戻さない", () => {
    const local = localDish({ version: 3, serverSeq: 9 });
    expect(mergeServerDish(local, serverDish({ serverSeq: 5 }), nothingPushed)).toBeNull();
  });
});

describe("applyPushResult", () => {
  const applied = { id: ID, status: "applied" as const, version: 2, serverSeq: 5 };

  it("採用されたら、未同期を外してサーバーの版を記録する（内容は変えない）", () => {
    const local = localDish({ dirty: true, updatedAt: T_PUSHED });
    expect(applyPushResult(local, applied, pushedAt(T_PUSHED))).toMatchObject({
      name: "肉じゃが（端末）",
      dirty: false,
      version: 2,
      baseVersion: 2,
      serverSeq: 5,
    });
  });

  it("送った後にさらに編集していたら、未同期のまま残す", () => {
    const local = localDish({ dirty: true, updatedAt: T_EDITED_LATER });
    expect(applyPushResult(local, applied, pushedAt(T_PUSHED))).toBeNull();
  });

  it("却下されたら何もしない（勝った内容は Pull の結果で反映する）", () => {
    const local = localDish({ dirty: true, updatedAt: T_PUSHED });
    expect(
      applyPushResult(local, { ...applied, status: "rejected" }, pushedAt(T_PUSHED)),
    ).toBeNull();
  });
});
