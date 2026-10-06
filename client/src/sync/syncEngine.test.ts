import { type DishChange, SYNC_LIMITS, type SyncResponse } from "@dish-list/shared";
import { describe, expect, it, vi } from "vitest";
import { SyncError } from "./syncApi";
import { createSyncEngine, type SyncLocalStore } from "./syncEngine";

const emptyResponse: SyncResponse = { results: [], changes: [], lastSeq: 0, hasMore: false };

function fakeStore(pendingCounts: number[] = [0]): SyncLocalStore & { applied: number } {
  const counts = [...pendingCounts];
  const store = {
    applied: 0,
    getSyncCursor: async () => ({ clientId: "client", lastSeq: 0 }),
    collectChanges: async () =>
      Array.from({ length: counts.shift() ?? 0 }, () => ({}) as DishChange),
    applySyncResponse: async () => {
      store.applied += 1;
    },
  };
  return store;
}

/** 外から解決できる Promise（通信中の状態を作るため） */
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const noLock = <T>(task: () => Promise<T>) => task();

describe("syncEngine", () => {
  it("同期して、結果を ok にする", async () => {
    const send = vi.fn(async () => emptyResponse);
    const engine = createSyncEngine({ send, store: fakeStore(), withLock: noLock });

    await engine.requestSync();

    expect(send).toHaveBeenCalledTimes(1);
    expect(engine.getState()).toEqual({ running: false, lastResult: "ok" });
  });

  it("実行中に何度要求されても、終わった後にもう1回だけ実行する", async () => {
    const first = deferred<SyncResponse>();
    const send = vi
      .fn<() => Promise<SyncResponse>>()
      .mockReturnValueOnce(first.promise)
      .mockResolvedValue(emptyResponse);
    const engine = createSyncEngine({ send, store: fakeStore(), withLock: noLock });

    const running = engine.requestSync();
    expect(engine.getState().running).toBe(true);
    void engine.requestSync();
    void engine.requestSync();
    first.resolve(emptyResponse);
    await running;

    expect(send).toHaveBeenCalledTimes(2);
    expect(engine.getState().running).toBe(false);
  });

  it("受け取る差分が残っていれば（hasMore）、続けて取得する", async () => {
    const send = vi
      .fn<() => Promise<SyncResponse>>()
      .mockResolvedValueOnce({ ...emptyResponse, hasMore: true })
      .mockResolvedValueOnce(emptyResponse);
    const store = fakeStore();
    const engine = createSyncEngine({ send, store, withLock: noLock });

    await engine.requestSync();

    expect(send).toHaveBeenCalledTimes(2);
    expect(store.applied).toBe(2);
  });

  it("送る変更が上限を超えていれば、分けて送る", async () => {
    const send = vi.fn(async () => emptyResponse);
    const store = fakeStore([SYNC_LIMITS.pushMaxCount, 5]);
    const engine = createSyncEngine({ send, store, withLock: noLock });

    await engine.requestSync();

    expect(send).toHaveBeenCalledTimes(2);
  });

  it("接続できなければ offline、それ以外の失敗は error にする（reject はしない）", async () => {
    const offline = createSyncEngine({
      send: async () => {
        throw new SyncError("offline", "x");
      },
      store: fakeStore(),
      withLock: noLock,
    });
    await expect(offline.requestSync()).resolves.toBeUndefined();
    expect(offline.getState().lastResult).toBe("offline");

    const broken = createSyncEngine({
      send: async () => {
        throw new SyncError("server", "x");
      },
      store: fakeStore(),
      withLock: noLock,
    });
    await broken.requestSync();
    expect(broken.getState().lastResult).toBe("error");
  });

  it("失敗したときは、実行中に来た要求があってもすぐには再試行しない", async () => {
    const first = deferred<SyncResponse>();
    const send = vi.fn<() => Promise<SyncResponse>>().mockReturnValueOnce(first.promise);
    const engine = createSyncEngine({ send, store: fakeStore(), withLock: noLock });

    const running = engine.requestSync();
    void engine.requestSync();
    first.reject(new SyncError("offline", "x"));
    await running;

    expect(send).toHaveBeenCalledTimes(1);
    expect(engine.getState().lastResult).toBe("offline");
  });

  it("状態が変わると購読者に知らせる", async () => {
    const engine = createSyncEngine({
      send: async () => emptyResponse,
      store: fakeStore(),
      withLock: noLock,
    });
    const listener = vi.fn();
    engine.subscribe(listener);
    await engine.requestSync();
    expect(listener).toHaveBeenCalled();
  });
});
