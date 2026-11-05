import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { RefreshWhileRunning } from "../refresh-while-running.client";

const refresh = vi.fn();

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

describe("RefreshWhileRunning", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("refreshes every five seconds while a job is running", () => {
    render(<RefreshWhileRunning running />);

    vi.advanceTimersByTime(4999);
    expect(refresh).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(refresh).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(5000);
    expect(refresh).toHaveBeenCalledTimes(2);
  });

  it("does not refresh when no job is running", () => {
    render(<RefreshWhileRunning running={false} />);

    vi.advanceTimersByTime(20000);
    expect(refresh).not.toHaveBeenCalled();
  });

  it("stops refreshing once the jobs have finished", () => {
    const { rerender } = render(<RefreshWhileRunning running />);

    vi.advanceTimersByTime(5000);
    rerender(<RefreshWhileRunning running={false} />);
    vi.advanceTimersByTime(20000);
    expect(refresh).toHaveBeenCalledTimes(1);
  });
});
