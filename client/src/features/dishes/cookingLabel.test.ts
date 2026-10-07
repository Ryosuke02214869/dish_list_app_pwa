import { describe, expect, it } from "vitest";
import { describeCooking } from "./cookingLabel";

const now = new Date(2026, 9, 7, 9, 0);

describe("describeCooking", () => {
  it("最後に作った日と回数を出す", () => {
    const lastCookedAt = new Date(2026, 9, 4, 19, 0).toISOString();
    expect(describeCooking({ cookedCount: 5, lastCookedAt }, now)).toBe("3日前に作った・5回");
  });

  it("今日・昨日には「に」を付けない", () => {
    const today = new Date(2026, 9, 7, 8, 0).toISOString();
    const yesterday = new Date(2026, 9, 6, 19, 0).toISOString();
    expect(describeCooking({ cookedCount: 1, lastCookedAt: today }, now)).toBe("今日作った・1回");
    expect(describeCooking({ cookedCount: 2, lastCookedAt: yesterday }, now)).toBe(
      "昨日作った・2回",
    );
  });

  it("まだ作っていなければ出さない", () => {
    expect(describeCooking({ cookedCount: 0, lastCookedAt: null }, now)).toBeNull();
  });
});
