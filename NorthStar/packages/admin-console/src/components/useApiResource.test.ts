// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useApiResource } from "./useApiResource";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe("useApiResource", () => {
  it("loads the initial resource", async () => {
    const load = vi.fn().mockResolvedValue("initial");

    const { result } = renderHook(() => useApiResource(load));

    await act(async () => {
      await load.mock.results[0].value;
    });

    expect(result.current.data).toBe("initial");
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it("ignores refresh results after unmount", async () => {
    const first = deferred<string>();
    const second = deferred<string>();
    const load = vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const { result, unmount } = renderHook(() => useApiResource(load));

    await act(async () => {
      first.resolve("initial");
      await first.promise;
    });

    act(() => {
      result.current.refresh();
      unmount();
    });

    await act(async () => {
      second.resolve("late");
      await second.promise;
    });

    expect(load).toHaveBeenCalledTimes(2);
    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it("keeps only the latest refresh result", async () => {
    const first = deferred<string>();
    const second = deferred<string>();
    const third = deferred<string>();
    const load = vi
      .fn()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise)
      .mockReturnValueOnce(third.promise);

    const { result } = renderHook(() => useApiResource(load));

    await act(async () => {
      first.resolve("initial");
      await first.promise;
    });

    act(() => {
      result.current.refresh();
      result.current.refresh();
    });

    await act(async () => {
      third.resolve("latest");
      await third.promise;
    });

    await act(async () => {
      second.resolve("stale");
      await second.promise;
    });

    expect(result.current.data).toBe("latest");
    expect(result.current.loading).toBe(false);
  });
});
