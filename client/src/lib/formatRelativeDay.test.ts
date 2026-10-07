import { describe, expect, it } from "vitest";
import { formatRelativeDay } from "./formatRelativeDay";

const now = new Date(2026, 9, 7, 9, 0); // 端末の時刻で 2026-10-07 09:00
const at = (y: number, m: number, d: number, h = 12) => new Date(y, m - 1, d, h).toISOString();

describe("formatRelativeDay", () => {
  it("日付で数える（時刻の差ではなく）", () => {
    expect(formatRelativeDay(at(2026, 10, 7, 1), now)).toBe("今日");
    expect(formatRelativeDay(at(2026, 10, 6, 23), now)).toBe("昨日");
    expect(formatRelativeDay(at(2026, 10, 4), now)).toBe("3日前");
  });

  it("30日以上前は日付で出す（年が違えば年も）", () => {
    expect(formatRelativeDay(at(2026, 9, 1), now)).toBe("9/1");
    expect(formatRelativeDay(at(2025, 12, 31), now)).toBe("2025/12/31");
  });

  it("端末の時計がずれて未来の日時でも、今日として扱う", () => {
    expect(formatRelativeDay(at(2026, 10, 8), now)).toBe("今日");
  });
});
