import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { debounce } from "./debounce";

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe("debounce", () => {
  it("続けて呼ばれたら、最後の呼び出しから待って1回だけ実行する", () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 2000);

    debounced();
    vi.advanceTimersByTime(1500);
    debounced();
    vi.advanceTimersByTime(1999);
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("cancel で実行を取りやめる", () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 2000);
    debounced();
    debounced.cancel();
    vi.advanceTimersByTime(5000);
    expect(fn).not.toHaveBeenCalled();
  });
});
