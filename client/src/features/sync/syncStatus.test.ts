import { describe, expect, it } from "vitest";
import { describeSyncStatus, formatSyncTime } from "./syncStatus";

const now = new Date(2026, 9, 6, 21, 30); // 端末の時刻で 2026-10-06 21:30
const todayAt = (h: number, m: number) => new Date(2026, 9, 6, h, m).toISOString();
const idle = { running: false, lastResult: "ok" } as const;

describe("describeSyncStatus", () => {
  it("同期中を最優先で表示する", () => {
    const status = describeSyncStatus({ running: true, lastResult: "offline" }, 3, undefined, now);
    expect(status.kind).toBe("syncing");
  });

  it("接続できなかったら、未同期があっても接続できないことを表示する", () => {
    const status = describeSyncStatus({ running: false, lastResult: "offline" }, 3, undefined, now);
    expect(status).toMatchObject({ kind: "offline", label: "サーバーに接続できません" });
  });

  it("サーバーのエラーは、接続できない場合と分けて表示する", () => {
    expect(
      describeSyncStatus({ running: false, lastResult: "error" }, 0, undefined, now).kind,
    ).toBe("error");
  });

  it("未同期の件数を表示する", () => {
    expect(describeSyncStatus(idle, 3, todayAt(21, 10), now)).toMatchObject({
      kind: "pending",
      shortLabel: "未同期 3件",
      lastSyncedLabel: "21:10",
    });
  });

  it("すべて同期済みなら、最終同期時刻と一緒に表示する", () => {
    expect(describeSyncStatus(idle, 0, todayAt(21, 10), now)).toMatchObject({
      kind: "synced",
      shortLabel: "同期済み 21:10",
    });
  });
});

describe("formatSyncTime", () => {
  it("今日なら時刻だけ、それ以外は日付も出す", () => {
    expect(formatSyncTime(todayAt(8, 5), now)).toBe("08:05");
    expect(formatSyncTime(new Date(2026, 9, 4, 20, 15).toISOString(), now)).toBe("10/4 20:15");
  });
});
