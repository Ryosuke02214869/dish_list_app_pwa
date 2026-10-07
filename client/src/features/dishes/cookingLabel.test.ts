import { describe, expect, it } from "vitest";
import { describeCooking } from "./cookingLabel";

const now = new Date(2026, 9, 7, 9, 0);

describe("describeCooking", () => {
  it("最後に作った日と回数を出す", () => {
    const lastCookedAt = new Date(2026, 9, 4, 19, 0).toISOString();
    expect(describeCooking({ cookedCount: 5, lastCookedAt }, now)).toBe("3日前に作った・5回");
  });

  it("まだ作っていなければ出さない", () => {
    expect(describeCooking({ cookedCount: 0, lastCookedAt: null }, now)).toBeNull();
  });
});
