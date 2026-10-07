import { describe, expect, it } from "vitest";
import type { TagSummary } from "../dishes/dishListQuery";
import { findMergeTarget, validateNewTagName } from "./tagAdminRules";

const tag = (label: string, labels: string[] = [label], count = 1): TagSummary => ({
  key: label === "カレー" ? "かれー" : label,
  label,
  labels,
  count,
});

const washoku = tag("和食", ["和食"], 4);
const curry = tag("カレー", ["カレー", "かれー"], 3);
const all = [washoku, curry, tag("主菜")];

describe("validateNewTagName", () => {
  it("空や # だけの名前は使えない", () => {
    expect(validateNewTagName("  ", washoku)).toBe("名前を入力してください");
    expect(validateNewTagName("#", washoku)).toBe("名前を入力してください");
  });

  it("表記ゆれがないのに今と同じ名前なら、変える意味がない", () => {
    expect(validateNewTagName(" #和食 ", washoku)).toBe("今の名前と同じです");
  });

  it("表記ゆれがあれば、同じ名前でも表記をそろえられる", () => {
    expect(validateNewTagName("カレー", curry)).toBeNull();
  });

  it("新しい名前なら問題なし", () => {
    expect(validateNewTagName("日本料理", washoku)).toBeNull();
  });
});

describe("findMergeTarget", () => {
  it("ほかの既存のタグと同じ名前（正規化後）なら、そのタグを返す", () => {
    expect(findMergeTarget("#わしょく", tag("わしょく"), all)).toBeUndefined();
    expect(findMergeTarget("和食", tag("和の料理"), all)).toBe(washoku);
    expect(findMergeTarget("かれー", tag("カレー粉"), all)).toBe(curry);
  });

  it("自分自身の表記を変えるだけなら統合ではない", () => {
    expect(findMergeTarget("かれー", curry, all)).toBeUndefined();
  });

  it("どのタグとも重ならなければ統合ではない", () => {
    expect(findMergeTarget("日本料理", washoku, all)).toBeUndefined();
  });
});
