import type { SqliteDatabase } from "../db/database";
import { createBackup, hasBackupForDay, pruneBackups } from "./backup";

/**
 * 1日1回のバックアップ（REQUIREMENTS.md 12.1）。
 * PCがスリープや電源オフで決まった時刻に動いていないことがあるため、時刻を決めずに
 * 「起動時と1時間ごとに、今日のバックアップがまだなければ作る」ようにしている。
 */

export interface BackupSchedulerOptions {
  dir: string;
  /** 残す世代数 */
  keep: number;
  /** 「今日」を決めるタイムゾーン */
  timeZone: string;
  checkIntervalMs?: number;
  now?: () => Date;
  log?: (message: string) => void;
}

const ONE_HOUR_MS = 60 * 60 * 1000;

/** 必要ならバックアップを作る。作ったら true */
export function runBackupIfNeeded(db: SqliteDatabase, options: BackupSchedulerOptions): boolean {
  const { dir, keep, timeZone, now = () => new Date(), log = console.log } = options;
  const current = now();
  if (hasBackupForDay(dir, current, timeZone)) return false;

  const file = createBackup(db, dir, current, timeZone);
  const removed = pruneBackups(dir, keep);
  log(`バックアップを作成しました: ${file}（削除: ${removed.length}件）`);
  return true;
}

/** スケジューラーを始める。戻り値の関数を呼ぶと止まる */
export function startBackupScheduler(
  db: SqliteDatabase,
  options: BackupSchedulerOptions,
): () => void {
  const run = () => {
    try {
      runBackupIfNeeded(db, options);
    } catch (error) {
      // バックアップに失敗してもアプリは止めない。次の確認で再試行する
      console.error("バックアップに失敗しました", error);
    }
  };
  run();
  const timer = setInterval(run, options.checkIntervalMs ?? ONE_HOUR_MS);
  timer.unref();
  return () => clearInterval(timer);
}
