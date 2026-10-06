import { afterEach, describe, expect, it, vi } from "vitest";
import { postSync, SyncError } from "./syncApi";

const request = { clientId: "7d2c1b4a-1f3e-4c5d-8e9f-0a1b2c3d4e5f", lastSeq: 0, changes: [] };
const validResponse = { results: [], changes: [], lastSeq: 0, hasMore: false };

const mockFetch = (impl: () => Promise<Response>) => vi.stubGlobal("fetch", vi.fn(impl));
const json = (body: unknown, status = 200) =>
  Promise.resolve(new Response(JSON.stringify(body), { status }));

afterEach(() => {
  vi.unstubAllGlobals();
});

const failureKind = async () => {
  const error: unknown = await postSync(request).catch((e: unknown) => e);
  expect(error).toBeInstanceOf(SyncError);
  return (error as SyncError).kind;
};

describe("postSync", () => {
  it("正しい応答を返す", async () => {
    mockFetch(() => json(validResponse));
    await expect(postSync(request)).resolves.toEqual(validResponse);
  });

  it("通信できなければ offline", async () => {
    mockFetch(() => Promise.reject(new TypeError("Failed to fetch")));
    expect(await failureKind()).toBe("offline");
  });

  it("中継がサーバーに届かなかった（502/503/504）なら offline", async () => {
    mockFetch(() => json({}, 502));
    expect(await failureKind()).toBe("offline");
  });

  it("サーバーのエラーなら server", async () => {
    mockFetch(() => json({ error: "invalid_request" }, 400));
    expect(await failureKind()).toBe("server");
  });

  it("応答が定義に合わなければ server（端末のデータベースに書き込まない）", async () => {
    mockFetch(() => json({ results: "x" }));
    expect(await failureKind()).toBe("server");
  });
});
