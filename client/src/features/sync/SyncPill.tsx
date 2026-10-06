import type { SyncStatusKind } from "./syncStatus";
import { requestManualSync, useSyncStatus } from "./useSyncStatus";

/** 同期状態のピル（F-11、DESIGN.md 5章 SyncPill）。タップで手動同期する */

const DOT_CLASSES: Record<SyncStatusKind, string> = {
  synced: "bg-success",
  pending: "bg-warning",
  offline: "bg-text-muted",
  error: "bg-danger",
  syncing: "bg-success animate-pulse",
};

export function SyncPill() {
  const status = useSyncStatus();
  return (
    <button
      type="button"
      onClick={() => void requestManualSync()}
      aria-label={`${status.label}。タップして同期`}
      aria-live="polite"
      className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border bg-surface px-3 text-xs whitespace-nowrap text-text-sub"
    >
      <span className={`size-2 rounded-full ${DOT_CLASSES[status.kind]}`} aria-hidden />
      {status.shortLabel}
    </button>
  );
}
