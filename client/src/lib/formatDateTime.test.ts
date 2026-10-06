import { describe, expect, it } from "vitest";
import { formatDateTime } from "./formatDateTime";

describe("formatDateTime", () => {
  it("端末の時刻で「月/日 時:分」にする（時と分は2桁）", () => {
    const local = new Date(2026, 9, 4, 8, 5); // 2026-10-04 08:05（端末の時刻）
    expect(formatDateTime(local.toISOString())).toBe("10/4 08:05");
  });
});
