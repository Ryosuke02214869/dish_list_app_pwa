import { describe, expect, it } from "vitest";
import { at, CLIENT_A, CLIENT_B, makeChange, makeDish } from "../testing/fixtures";
import { isNewer, resolveChange } from "./resolveChange";

/** サーバーに版数3で保存されている料理（端末Aが10:00に更新） */
const onServer = makeDish({ version: 3, serverSeq: 7, updatedAt: at("10:00"), clientId: CLIENT_A });

describe("resolveChange", () => {
  it("サーバーにない料理は新規として保存する", () => {
    expect(resolveChange(undefined, makeChange())).toBe("insert");
  });

  it("サーバーの版を起点にした変更は、そのまま採用する", () => {
    const change = makeChange({ baseVersion: 3, updatedAt: at("11:00"), clientId: CLIENT_B });
    expect(resolveChange(onServer, change)).toBe("accept");
  });

  it("起点の版が古くても、更新日時が新しければ採用する（後勝ち）", () => {
    const change = makeChange({ baseVersion: 2, updatedAt: at("11:00"), clientId: CLIENT_B });
    expect(resolveChange(onServer, change)).toBe("accept");
  });

  it("起点の版が古く、更新日時も古ければ採用しない", () => {
    const change = makeChange({ baseVersion: 2, updatedAt: at("09:00"), clientId: CLIENT_B });
    expect(resolveChange(onServer, change)).toBe("reject");
  });

  it("同じ変更の再送は、版が古くても適用済みとみなす", () => {
    // 端末Aの10:00の変更はすでに版3として保存済み。応答が届かず baseVersion=2 のまま再送された
    const resent = makeChange({ baseVersion: 2, updatedAt: at("10:00"), clientId: CLIENT_A });
    expect(resolveChange(onServer, resent)).toBe("alreadyApplied");
  });

  it("更新日時が同じでも、端末が違えば再送とはみなさない", () => {
    const change = makeChange({ baseVersion: 2, updatedAt: at("10:00"), clientId: CLIENT_B });
    expect(resolveChange(onServer, change)).not.toBe("alreadyApplied");
  });

  it("削除（墓標）も同じ規則で判定する", () => {
    const newerDelete = makeChange({ baseVersion: 2, deleted: true, updatedAt: at("11:00") });
    const olderDelete = makeChange({ baseVersion: 2, deleted: true, updatedAt: at("09:00") });
    expect(resolveChange(onServer, { ...newerDelete, clientId: CLIENT_B })).toBe("accept");
    expect(resolveChange(onServer, { ...olderDelete, clientId: CLIENT_B })).toBe("reject");
  });
});

describe("isNewer", () => {
  it("更新日時が新しいほうを採用する", () => {
    expect(
      isNewer(makeDish({ updatedAt: at("11:00") }), makeDish({ updatedAt: at("10:00") })),
    ).toBe(true);
    expect(
      isNewer(makeDish({ updatedAt: at("09:00") }), makeDish({ updatedAt: at("10:00") })),
    ).toBe(false);
  });

  it("日時は文字列ではなく時刻として比べる（表記の違いに左右されない）", () => {
    const withOffset = makeDish({ updatedAt: "2026-10-04T20:00:00+09:00" }); // = 11:00Z
    expect(isNewer(withOffset, makeDish({ updatedAt: at("10:30") }))).toBe(true);
  });

  it("同じ時刻なら updatedBy、それも同じなら clientId で決め、どちらから比べても結果が一致する", () => {
    const a = makeDish({ updatedBy: "ママ", clientId: CLIENT_A });
    const b = makeDish({ updatedBy: "パパ", clientId: CLIENT_A });
    expect(isNewer(a, b)).not.toBe(isNewer(b, a));

    const c = makeDish({ updatedBy: "ママ", clientId: CLIENT_A });
    const d = makeDish({ updatedBy: "ママ", clientId: CLIENT_B });
    expect(isNewer(c, d)).not.toBe(isNewer(d, c));
  });
});
