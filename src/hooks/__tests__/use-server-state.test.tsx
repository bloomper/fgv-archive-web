import { describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useServerState } from "@/hooks/use-server-state.client";

describe("useServerState", () => {
  it("keeps a local change until the server sends a different value", () => {
    const { result, rerender } = renderHook(({ value }) => useServerState(value), { initialProps: { value: false } });

    act(() => result.current[1](true));
    rerender({ value: false });
    expect(result.current[0]).toBe(true);

    rerender({ value: true });
    rerender({ value: false });
    expect(result.current[0]).toBe(false);
  });

  it("tells copies apart by their key", () => {
    const key = (ids: string[]) => ids.join();
    const {
      result,
      rerender,
    } = renderHook(({ value }) => useServerState(value, key), { initialProps: { value: ["a"] } });

    act(() => result.current[1](["a", "b"]));
    rerender({ value: ["a"] });
    expect(result.current[0]).toEqual(["a", "b"]);

    rerender({ value: ["c"] });
    expect(result.current[0]).toEqual(["c"]);
  });
});
