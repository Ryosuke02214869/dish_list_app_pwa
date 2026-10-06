import { formatDateTime } from "../../lib/formatDateTime";
import type { SyncState } from "../../sync/syncEngine";

/**
 * 同期状態の表示（F-11、DESIGN.md 5章 SyncPill）。
 * エンジンの状態・未同期の件数・最終同期時刻から、画面に出す状態を1つに決める。
 * 優先順：同期中 → 接続できない → 失敗 → 未同期あり → 同期済み
 */

export type SyncStatusKind = "syncing" | "offline" | "error" | "pending" | "synced";

export interface SyncStatus {
  kind: SyncStatusKind;
  /** 同期状態のピルに出す短い文言 */
  shortLabel: string;
  /** 設定画面に出す文言 */
  label: string;
  pendingCount: number;
  /** 最終同期時刻の表示（未同期なら null） */
  lastSyncedLabel: string | null;
}

export function describeSyncStatus(
  engine: SyncState,
  pendingCount: number,
  lastSyncedAt: string | undefined,
  now: Date = new Date(),
): SyncStatus {
  const lastSyncedLabel = lastSyncedAt ? formatSyncTime(lastSyncedAt, now) : null;
  const base = { pendingCount, lastSyncedLabel };

  if (engine.running) {
    return { ...base, kind: "syncing", shortLabel: "同期中…", label: "同期中…" };
  }
  if (engine.lastResult === "offline") {
    return {
      ...base,
      kind: "offline",
      shortLabel: "接続できません",
      label: "サーバーに接続できません",
    };
  }
  if (engine.lastResult === "error") {
    return {
      ...base,
      kind: "error",
      shortLabel: "同期できません",
      label: "同期できませんでした",
    };
  }
  if (pendingCount > 0) {
    const text = `未同期 ${pendingCount}件`;
    return { ...base, kind: "pending", shortLabel: text, label: text };
  }
  return {
    ...base,
    kind: "synced",
    shortLabel: lastSyncedLabel ? `同期済み ${lastSyncedLabel}` : "同期済み",
    label: "同期済み",
  };
}

/** 今日なら「20:15」、それ以外は「10/4 20:15」 */
export function formatSyncTime(iso: string, now: Date): string {
  const formatted = formatDateTime(iso);
  return new Date(iso).toDateString() === now.toDateString()
    ? (formatted.split(" ")[1] ?? formatted)
    : formatted;
}
