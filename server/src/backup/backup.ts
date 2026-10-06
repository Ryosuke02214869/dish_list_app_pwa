import fs from "node:fs";
import path from "node:path";
import type { SqliteDatabase } from "../db/database";

/**
 * SQLite のバックアップ（REQUIREMENTS.md 12.1）。
 * VACUUM INTO で、書き込み中でも整合性のとれたスナップショットを1つのファイルとして作る。
 * ファイル名は dish-list-20261006-031500.db（指定したタイムゾーンの日時）。
 */

const PREFIX = "dish-list-";
const EXTENSION = ".db";
const FILE_PATTERN = /^dish-list-(\d{8})-(\d{6})\.db$/;

/** 日時を「20261006-031500」の形にする */
export function formatStamp(date: Date, timeZone: string): string {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(date)
      .map((part) => [part.type, part.value]),
  );
  return `${parts.year}${parts.month}${parts.day}-${parts.hour}${parts.minute}${parts.second}`;
}

/** バックアップのファイル名を、古い順に返す */
export function listBackups(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((name) => FILE_PATTERN.test(name))
    .sort();
}

/** その日（指定したタイムゾーンでの日付）のバックアップがすでにあるか */
export function hasBackupForDay(dir: string, now: Date, timeZone: string): boolean {
  const day = formatStamp(now, timeZone).slice(0, 8);
  return listBackups(dir).some((name) => name.startsWith(`${PREFIX}${day}-`));
}

/** バックアップを作り、そのファイルのパスを返す */
export function createBackup(db: SqliteDatabase, dir: string, now: Date, timeZone: string): string {
  fs.mkdirSync(dir, { recursive: true });
  const target = path.join(dir, `${PREFIX}${formatStamp(now, timeZone)}${EXTENSION}`);
  // 作成途中のファイルを完成品と見誤らないよう、別名で作ってから名前を変える
  const temporary = `${target}.partial`;
  fs.rmSync(temporary, { force: true });
  db.prepare("VACUUM INTO ?").run(temporary);
  fs.renameSync(temporary, target);
  return target;
}

/** 新しいものから keep 個を残して、古いバックアップを消す。消したファイル名を返す */
export function pruneBackups(dir: string, keep: number): string[] {
  const backups = listBackups(dir);
  const removed = backups.slice(0, Math.max(0, backups.length - keep));
  for (const name of removed) fs.rmSync(path.join(dir, name));
  return removed;
}
