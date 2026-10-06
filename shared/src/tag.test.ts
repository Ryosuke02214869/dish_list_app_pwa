import { describe, expect, it } from "vitest";
import { DISH_LIMITS } from "./limits";
import { addTag, includesTag, toTagLabel } from "./tag";

describe("toTagLabel", () => {
  it("先頭の # と前後の空白を除去する", () => {
    expect(toTagLabel(" #和食 ")).toBe("和食");
    expect(toTagLabel("##時短")).toBe("時短");
    expect(toTagLabel("# 主菜")).toBe("主菜");
  });

  it("全角の ＃ も除去する（NFKCで半角になるため）", () => {
    expect(toTagLabel("＃作り置き")).toBe("作り置き");
  });

  it("表示用なので、カタカナや大文字はそのまま残す", () => {
    expect(toTagLabel("カレー")).toBe("カレー");
    expect(toTagLabel("BBQ")).toBe("BBQ");
  });

  it("途中の # は残す", () => {
    expect(toTagLabel("C#料理")).toBe("C#料理");
  });

  it("上限の文字数で切る", () => {
    expect(toTagLabel("あ".repeat(30))).toHaveLength(DISH_LIMITS.tagMaxLength);
  });

  it("空白と # だけなら空文字を返す", () => {
    expect(toTagLabel("  # ")).toBe("");
  });
});

describe("includesTag", () => {
  it("正規化して比較する", () => {
    expect(includesTag(["カレー", "主菜"], "かれー")).toBe(true);
    expect(includesTag(["BBQ"], "#ｂｂｑ")).toBe(false); // # は toTagLabel で外してから渡す
    expect(includesTag(["BBQ"], "ｂｂｑ")).toBe(true);
  });
});

describe("addTag", () => {
  it("整えたタグを末尾に加え、元の配列は変更しない", () => {
    const tags = ["和食"];
    expect(addTag(tags, " #主菜")).toEqual(["和食", "主菜"]);
    expect(tags).toEqual(["和食"]);
  });

  it("正規化後に重複するタグは加えない", () => {
    expect(addTag(["カレー"], "かれー")).toEqual(["カレー"]);
  });

  it("空のタグは加えない", () => {
    expect(addTag(["和食"], " # ")).toEqual(["和食"]);
  });

  it("上限の個数に達していたら加えない", () => {
    const full = Array.from({ length: DISH_LIMITS.tagsMaxCount }, (_, i) => `tag${i}`);
    expect(addTag(full, "新しいタグ")).toEqual(full);
  });
});
