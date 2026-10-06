import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { openDatabase, type SqliteDatabase } from "../db/database";
import { createDishStore } from "../db/dishStore";
import { makeDish } from "../testing/fixtures";
import { createBackup, formatStamp, hasBackupForDay, listBackups, pruneBackups } from "./backup";
import { runBackupIfNeeded } from "./backupScheduler";

const TZ = "Asia/Tokyo";
let dir: string;
let db: SqliteDatabase;

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "dish-list-backup-"));
  db = openDatabase(":memory:");
  createDishStore(db).save(makeDish({ version: 1, serverSeq: 1 }));
});

afterEach(() => {
  db.close();
  fs.rmSync(dir, { recursive: true, force: true });
});

const touch = (name: string) => fs.writeFileSync(path.join(dir, name), "");

describe("formatStamp", () => {
  it("指定したタイムゾーンの日時にする", () => {
    // UTC 2026-10-05 18:15:00 = 日本時間 2026-10-06 03:15:00
    expect(formatStamp(new Date("2026-10-05T18:15:00Z"), TZ)).toBe("20261006-031500");
  });
});

describe("createBackup", () => {
  it("中身を読み出せるバックアップのファイルを作る", () => {
    const file = createBackup(db, dir, new Date("2026-10-05T18:15:00Z"), TZ);

    expect(path.basename(file)).toBe("dish-list-20261006-031500.db");
    const restored = openDatabase(file);
    expect(createDishStore(restored).get(makeDish().id)?.name).toBe("肉じゃが");
    restored.close();
    expect(fs.readdirSync(dir).some((name) => name.endsWith(".partial"))).toBe(false);
  });
});

describe("pruneBackups", () => {
  it("新しいものから指定の数だけ残し、関係ないファイルは消さない", () => {
    for (let day = 1; day <= 16; day++) {
      touch(`dish-list-202610${String(day).padStart(2, "0")}-030000.db`);
    }
    touch("README.txt");

    const removed = pruneBackups(dir, 14);

    expect(removed).toEqual(["dish-list-20261001-030000.db", "dish-list-20261002-030000.db"]);
    expect(listBackups(dir)).toHaveLength(14);
    expect(fs.existsSync(path.join(dir, "README.txt"))).toBe(true);
  });
});

describe("runBackupIfNeeded", () => {
  const options = (iso: string) => ({
    dir,
    keep: 14,
    timeZone: TZ,
    now: () => new Date(iso),
    log: () => {},
  });

  it("その日のバックアップがなければ作り、あれば作らない", () => {
    expect(runBackupIfNeeded(db, options("2026-10-05T18:15:00Z"))).toBe(true);
    expect(runBackupIfNeeded(db, options("2026-10-06T05:00:00Z"))).toBe(false); // 同じ日（日本時間）
    expect(runBackupIfNeeded(db, options("2026-10-06T16:00:00Z"))).toBe(true); // 翌日 01:00
    expect(listBackups(dir)).toHaveLength(2);
  });

  it("日付はタイムゾーンで判定する", () => {
    touch("dish-list-20261006-031500.db");
    expect(hasBackupForDay(dir, new Date("2026-10-06T14:59:59Z"), TZ)).toBe(true);
    expect(hasBackupForDay(dir, new Date("2026-10-06T15:00:00Z"), TZ)).toBe(false);
  });
});
