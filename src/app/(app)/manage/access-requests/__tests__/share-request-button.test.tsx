import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ShareRequestButton } from "../share-request-button.client";

const mocks = vi.hoisted(() => ({
  router: { refresh: vi.fn(), push: vi.fn() },
  toast: { success: vi.fn(), error: vi.fn() },
  actions: { createShareLinkAction: vi.fn(), handleAccessRequestAction: vi.fn() },
}));

vi.mock("next/navigation", () => ({ useRouter: () => mocks.router }));
vi.mock("sonner", () => ({ toast: mocks.toast }));
vi.mock("@/utils/umami", () => ({ track: vi.fn() }));
vi.mock("@/app/(app)/manage/actions.server", () => mocks.actions);

const make = async () => {
  mocks.actions.createShareLinkAction.mockResolvedValueOnce({ ok: true, data: { token: "abc", id: "l1" } });
  await userEvent.click(screen.getByRole("button", { name: "share" }));
  expect(screen.getByLabelText("name")).toHaveValue('shareName:{"name":"Kim Testsson"}');
  await userEvent.click(screen.getByRole("button", { name: "createButton" }));
  await screen.findByLabelText("address");
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.actions.handleAccessRequestAction.mockResolvedValue({ ok: true, data: null });
});

describe("ShareRequestButton", () => {
  it("shares the requested files, offers an email and marks the request handled on close", async () => {
    render(<ShareRequestButton id="r1" name="Kim Testsson" email="kim@example.org" fileIds={["f1", "f2"]} handled={false} maxMonths={12} />);
    await make();
    expect(mocks.actions.createShareLinkAction).toHaveBeenCalledWith({ fileIds: ["f1", "f2"], name: 'shareName:{"name":"Kim Testsson"}', months: 12 });

    const mail = screen.getByRole("link", { name: /mail/ });

    expect(mail.getAttribute("href")).toMatch(/^mailto:kim@example\.org\?subject=/);
    expect(decodeURIComponent(mail.getAttribute("href") ?? "")).toContain(`${window.location.origin}/share/abc`);

    await userEvent.click(screen.getByRole("button", { name: "done" }));
    await waitFor(() => expect(mocks.actions.handleAccessRequestAction).toHaveBeenCalledWith("r1", true));
    expect(mocks.toast.success).toHaveBeenCalledWith("handledDone");
  });

  it("leaves the request open when the editor unticks it", async () => {
    render(<ShareRequestButton id="r1" name="Kim Testsson" email={null} fileIds={["f1"]} handled={false} maxMonths={12} />);
    await make();
    expect(screen.queryByRole("link", { name: /mail/ })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("checkbox"));
    await userEvent.click(screen.getByRole("button", { name: "done" }));
    await waitFor(() => expect(screen.queryByLabelText("address")).not.toBeInTheDocument());
    expect(mocks.actions.handleAccessRequestAction).not.toHaveBeenCalled();
  });

  it("does not offer marking an already handled request", async () => {
    render(<ShareRequestButton id="r1" name="Kim Testsson" email={null} fileIds={["f1"]} handled maxMonths={12} />);
    await make();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "done" }));
    expect(mocks.actions.handleAccessRequestAction).not.toHaveBeenCalled();
  });
});
