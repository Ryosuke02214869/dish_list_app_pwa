import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { API_PATHS } from "@dish-list/shared";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../app";

let staticDir: string;

beforeAll(() => {
  staticDir = fs.mkdtempSync(path.join(os.tmpdir(), "dish-list-static-"));
  fs.mkdirSync(path.join(staticDir, "assets"));
  fs.writeFileSync(path.join(staticDir, "index.html"), "<title>ごはんメモ</title>");
  fs.writeFileSync(path.join(staticDir, "sw.js"), "// service worker");
  fs.writeFileSync(path.join(staticDir, "assets", "index-abc123.js"), "console.log(1)");
});

afterAll(() => {
  fs.rmSync(staticDir, { recursive: true, force: true });
});

const app = () =>
  createApp({
    version: "1.0.0",
    staticDir,
    sync: () => ({ results: [], changes: [], lastSeq: 0, hasMore: false }),
  });

describe("PWA本体の配信", () => {
  it("トップで index.html を返し、毎回確認させる", async () => {
    const response = await app().request("/");
    expect(await response.text()).toContain("ごはんメモ");
    expect(response.headers.get("Cache-Control")).toBe("no-cache");
  });

  it("Service Worker は毎回確認させる（新しいバージョンに気づけるように）", async () => {
    const response = await app().request("/sw.js");
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-cache");
  });

  it("ハッシュ付きのファイルは、ずっとキャッシュさせる", async () => {
    const response = await app().request("/assets/index-abc123.js");
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toContain("immutable");
  });

  it("見つからないページは index.html を返す", async () => {
    const response = await app().request("/some/page");
    expect(response.status).toBe(200);
    expect(await response.text()).toContain("ごはんメモ");
  });

  it("存在しないファイルは index.html ではなく 404 を返す（index.html を長くキャッシュさせない）", async () => {
    const response = await app().request("/assets/index-old999.js");
    expect(response.status).toBe(404);
    expect(response.headers.get("Cache-Control")).toBeNull();
  });

  it("フォルダーの外のファイルは返さない", async () => {
    const response = await app().request("/../package.json");
    expect(await response.text()).not.toContain('"name"');
  });

  it("/api は引き続き API が返す。存在しない /api は 404", async () => {
    expect((await app().request(API_PATHS.health)).status).toBe(200);
    const missing = await app().request("/api/unknown");
    expect(missing.status).toBe(404);
    expect(await missing.json()).toEqual({ error: "not_found" });
  });
});
