import "fake-indexeddb/auto";
import { DISH_LIMITS } from "@dish-list/shared";
import { describe, expect, it } from "vitest";
import { getMeta } from "../../db/metaRepository";
import { saveUserName, toValidUserName } from "./session";

describe("toValidUserName", () => {
  it("前後の空白を除いた名前を返す", () => {
    expect(toValidUserName("  ママ ")).toBe("ママ");
  });

  it("空、または長すぎる名前は使えない", () => {
    expect(toValidUserName("   ")).toBeNull();
    expect(toValidUserName("あ".repeat(DISH_LIMITS.userNameMaxLength + 1))).toBeNull();
  });
});

describe("saveUserName", () => {
  it("整えた名前を保存する", async () => {
    await saveUserName(" パパ ");
    expect(await getMeta("userName")).toBe("パパ");
  });

  it("使えない名前は保存しない", async () => {
    await expect(saveUserName(" ")).rejects.toThrow();
  });
});
