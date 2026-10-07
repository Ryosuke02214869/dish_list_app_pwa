import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { DISH_PHASE2_DEFAULTS } from "@dish-list/shared";
import Database from "better-sqlite3";
import { afterEach, describe, expect, it } from "vitest";
import { CLIENT_A, makeDish } from "../testing/fixtures";
import { openDatabase } from "./database";
import { createDishStore } from "./dishStore";
import { MIGRATIONS } from "./migrations";

const tempDirs: string[] = [];
const tempFile = () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "dish-list-"));
  tempDirs.push(dir);
  return path.join(dir, "test.db");
};

afterEach(() => {
  for (const dir of tempDirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
});

describe("openDatabase", () => {
  it("WALモードで開き、すべてのマイグレーションを適用する", () => {
    const db = openDatabase(tempFile());
    expect(db.pragma("journal_mode", { simple: true })).toBe("wal");
    expect(db.pragma("user_version", { simple: true })).toBe(MIGRATIONS.length);
    db.close();
  });

  it("開き直してもデータが残り、マイグレーションを重ねて適用しない", () => {
    const file = tempFile();
    const first = openDatabase(file);
    createDishStore(first).save(makeDish({ version: 1, serverSeq: 1 }));
    first.close();

    const second = openDatabase(file);
    expect(createDishStore(second).get(makeDish().id)).toMatchObject({ name: "肉じゃが" });
    second.close();
  });

  it("フェーズ2より前のデータベースを開くと、既存の料理は新しい項目が既定値になる", () => {
    const file = tempFile();
    // 初期スキーマ（版1）だけを適用し、当時の形で1件入れておく
    const legacy = new Database(file);
    legacy.exec(MIGRATIONS[0] ?? "");
    legacy.pragma("user_version = 1");
    legacy
      .prepare(
        `INSERT INTO dishes VALUES ('${makeDish().id}', '肉じゃが', '', '[]',
         '2026-10-04T10:00:00.000Z', 'ママ', '2026-10-04T10:00:00.000Z', 'ママ',
         '${CLIENT_A}', 0, 1, 1)`,
      )
      .run();
    legacy.close();

    const upgraded = openDatabase(file);
    expect(createDishStore(upgraded).get(makeDish().id)).toMatchObject({
      name: "肉じゃが",
      ...DISH_PHASE2_DEFAULTS,
    });
    upgraded.close();
  });
});

describe("dishStore", () => {
  it("料理を保存して、同じ内容で読み出せる（タグ配列と削除フラグを含む）", () => {
    const store = createDishStore(openDatabase(":memory:"));
    const dish = makeDish({ tags: ["和食", "主菜"], deleted: true, version: 2, serverSeq: 5 });
    store.save(dish);
    expect(store.get(dish.id)).toEqual(dish);
  });

  it("お気に入り・URL・作った記録も保存して読み出せる", () => {
    const store = createDishStore(openDatabase(":memory:"));
    const dish = makeDish({
      favorite: true,
      recipeUrl: "https://example.com/recipe",
      cookedCount: 5,
      lastCookedAt: "2026-10-06T09:00:00.000Z",
    });
    store.save(dish);
    expect(store.get(dish.id)).toEqual(dish);
  });

  it("連番は1から順に採番する", () => {
    const store = createDishStore(openDatabase(":memory:"));
    expect(store.currentSeq()).toBe(0);
    expect(store.nextSeq()).toBe(1);
    expect(store.nextSeq()).toBe(2);
    expect(store.currentSeq()).toBe(2);
  });
});
