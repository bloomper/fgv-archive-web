import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { RunJobButton } from "../run-job-button.client";
import { runMaintenanceJobAction } from "../../actions.server";

const refresh = vi.fn();

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));
vi.mock("../../actions.server", () => ({ runMaintenanceJobAction: vi.fn() }));

describe("RunJobButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("starts the job and refreshes", async () => {
    vi.mocked(runMaintenanceJobAction).mockResolvedValue({ ok: true, data: true });
    render(<RunJobButton job="SPEX_REFRESH" running={false} />);

    await userEvent.click(screen.getByRole("button"));

    await waitFor(() => expect(toast.success).toHaveBeenCalled());
    expect(runMaintenanceJobAction).toHaveBeenCalledWith("SPEX_REFRESH");
    expect(refresh).toHaveBeenCalled();
  });

  it("says when the job is already running", async () => {
    vi.mocked(runMaintenanceJobAction).mockResolvedValue({ ok: true, data: false });
    render(<RunJobButton job="UPLOAD_CLEANUP" running={false} />);

    await userEvent.click(screen.getByRole("button"));

    await waitFor(() => expect(toast.info).toHaveBeenCalled());
    expect(refresh).not.toHaveBeenCalled();
  });

  it("shows the error", async () => {
    vi.mocked(runMaintenanceJobAction).mockResolvedValue({ ok: false, code: "FORBIDDEN", message: "Nope" });
    render(<RunJobButton job="SPEX_REFRESH" running={false} />);

    await userEvent.click(screen.getByRole("button"));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Nope"));
  });

  it("is disabled while the job runs", () => {
    render(<RunJobButton job="SPEX_REFRESH" running />);

    expect(screen.getByRole("button")).toBeDisabled();
  });
});
