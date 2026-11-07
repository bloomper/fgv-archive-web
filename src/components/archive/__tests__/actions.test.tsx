import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ParentActions } from "@/components/archive/parent-actions.client";
import { ShareLinkButton } from "@/components/archive/share-link-dialog.client";
import { ShareLinkActions } from "@/components/archive/share-link-actions.client";
import { dialogs as makeDialogs } from "@/components/__tests__/fixtures";

const mocks = vi.hoisted(() => ({
  router: { refresh: vi.fn(), push: vi.fn() },
  toast: { success: vi.fn(), error: vi.fn() },
  actions: {
    createVersionAction: vi.fn(), trashParentAction: vi.fn(), updateManuscriptAction: vi.fn(), updateArrangementAction: vi.fn(),
    createShareLinkAction: vi.fn(), renameShareLinkAction: vi.fn(), extendShareLinkAction: vi.fn(), revokeShareLinkAction: vi.fn(),
  },
  dialogs: undefined as unknown as ReturnType<typeof makeDialogs>,
}));

vi.mock("next/navigation", () => ({ useRouter: () => mocks.router }));
vi.mock("sonner", () => ({ toast: mocks.toast }));
vi.mock("@/utils/umami", () => ({ track: vi.fn() }));
vi.mock("@/app/(app)/manage/actions.server", () => mocks.actions);
vi.mock("@/components/dialogs.client", () => ({ useDialogs: () => mocks.dialogs }));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.dialogs = makeDialogs();
  Object.values(mocks.actions).forEach(action => action.mockResolvedValue({ ok: true, data: null }));
});

describe("ParentActions", () => {
  it("makes a new version and edits a manuscript", async () => {
    render(<ParentActions kind="MANUSCRIPT" id="m1" trashed={false} fields={{ title: "Manus", authors: null }} spexHref="/spex/s1" />);
    mocks.actions.createVersionAction.mockResolvedValueOnce({ ok: true, data: "v9" });
    await userEvent.click(screen.getByRole("button", { name: "newVersion" }));
    await waitFor(() => expect(mocks.router.push).toHaveBeenCalledWith(expect.stringContaining("v9")));
    mocks.actions.createVersionAction.mockResolvedValueOnce({ ok: false, message: "Fel" });
    await userEvent.click(screen.getByRole("button", { name: "newVersion" }));
    await waitFor(() => expect(mocks.toast.error).toHaveBeenCalledWith("Fel"));
    mocks.dialogs.prompt.mockResolvedValueOnce(null);
    await userEvent.click(screen.getByRole("button", { name: "newVersion" }));
    expect(mocks.actions.createVersionAction).toHaveBeenCalledTimes(2);

    await userEvent.click(screen.getByRole("button", { name: "editManuscript" }));
    await userEvent.type(screen.getByLabelText("authors"), "Kim");
    await userEvent.type(screen.getByLabelText("description"), "Text");
    await userEvent.click(screen.getByRole("button", { name: "save" }));
    await waitFor(() => expect(mocks.actions.updateManuscriptAction).toHaveBeenCalledWith("m1", { title: "Manus", authors: "Kim", description: "Text" }));
    await waitFor(() => expect(screen.queryByLabelText("authors")).not.toBeInTheDocument());

    await userEvent.click(screen.getByRole("button", { name: "editManuscript" }));
    await userEvent.click(screen.getByRole("button", { name: "cancel" }));
    expect(screen.queryByLabelText("title")).not.toBeInTheDocument();
  });

  it("edits an arrangement and puts it in the trash", async () => {
    render(<ParentActions kind="ARRANGEMENT" id="a1" trashed={false} fields={{ description: "Gammal" }} spexHref="/spex/s1" />);
    await userEvent.click(screen.getByRole("button", { name: "editArrangement" }));
    mocks.actions.updateArrangementAction.mockResolvedValueOnce({ ok: false, message: "Fel" });
    await userEvent.clear(screen.getByLabelText("description"));
    await userEvent.click(screen.getByRole("button", { name: "save" }));
    await waitFor(() => expect(mocks.actions.updateArrangementAction).toHaveBeenCalledWith("a1", null));
    await waitFor(() => expect(mocks.toast.error).toHaveBeenCalledWith("Fel"));

    mocks.dialogs.confirm.mockResolvedValueOnce(false);
    await userEvent.click(screen.getByRole("button", { name: "toTrash" }));
    expect(mocks.actions.trashParentAction).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "toTrash" }));
    await waitFor(() => expect(mocks.router.push).toHaveBeenCalledWith("/spex/s1"));
  });

  it("restores from the trash", async () => {
    render(<ParentActions kind="ARRANGEMENT" id="a1" trashed fields={{}} spexHref="/spex/s1" />);
    expect(screen.getByRole("button", { name: "newVersion" })).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: "restore" }));
    await waitFor(() => expect(mocks.actions.trashParentAction).toHaveBeenCalledWith("ARRANGEMENT", "a1", false));
    await waitFor(() => expect(mocks.router.refresh).toHaveBeenCalled());
    mocks.actions.trashParentAction.mockResolvedValueOnce({ ok: false, message: "Fel" });
    await userEvent.click(screen.getByRole("button", { name: "restore" }));
    await waitFor(() => expect(mocks.toast.error).toHaveBeenCalledWith("Fel"));
  });
});

describe("ShareLinkButton", () => {
  it("makes a link, shows it once and copies it", async () => {
    const writeText = vi.fn().mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error("denied"));

    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    render(<ShareLinkButton input={{ versionIds: ["v1"] }} defaultName="Finalen" maxMonths={6} />);
    mocks.actions.createShareLinkAction.mockResolvedValueOnce({ ok: false, message: "Fel" });
    await userEvent.click(screen.getByRole("button", { name: "create" }));
    expect(screen.getByLabelText("months")).toHaveValue(6);
    await userEvent.click(screen.getByRole("button", { name: "createButton" }));
    await waitFor(() => expect(mocks.toast.error).toHaveBeenCalledWith("Fel"));

    mocks.actions.createShareLinkAction.mockResolvedValueOnce({ ok: true, data: { token: "abc" } });
    await userEvent.clear(screen.getByLabelText("name"));
    await userEvent.type(screen.getByLabelText("name"), "Orkester");
    await userEvent.click(screen.getByRole("button", { name: "createButton" }));
    await waitFor(() => expect(mocks.actions.createShareLinkAction).toHaveBeenLastCalledWith({ versionIds: ["v1"], name: "Orkester", months: 6 }));
    expect(await screen.findByLabelText("address")).toHaveValue(`${window.location.origin}/share/abc`);

    await userEvent.click(screen.getByRole("button", { name: "copy" }));
    await waitFor(() => expect(mocks.toast.success).toHaveBeenCalledWith("copied"));
    await userEvent.click(screen.getByRole("button", { name: "copy" }));
    await waitFor(() => expect(mocks.toast.error).toHaveBeenCalledWith("copyFailed"));
    await userEvent.click(screen.getByRole("button", { name: "done" }));
    await waitFor(() => expect(screen.queryByLabelText("address")).not.toBeInTheDocument());
  });

  it("is closed with cancel", async () => {
    render(<ShareLinkButton input={{ fileIds: ["f1"] }} maxMonths={24} label="Dela" size="default" />);
    await userEvent.click(screen.getByRole("button", { name: "Dela" }));
    expect(screen.getByLabelText("months")).toHaveValue(12);
    expect(screen.getByRole("button", { name: "createButton" })).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: "cancel" }));
    await waitFor(() => expect(screen.queryByLabelText("name")).not.toBeInTheDocument());
  });
});

describe("ShareLinkActions", () => {
  const label = (key: string) => `${key}:${JSON.stringify({ name: "Orkester" })}`;

  it("shows nothing for a revoked link", () => {
    const { container } = render(<ShareLinkActions id="l1" name="Orkester" revoked maxMonths={12} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("renames, extends and revokes", async () => {
    render(<ShareLinkActions id="l1" name="Orkester" revoked={false} maxMonths={12} />);
    await userEvent.click(screen.getByRole("button", { name: label("renameOf") }));
    await waitFor(() => expect(mocks.actions.renameShareLinkAction).toHaveBeenCalledWith("l1", "Svar"));
    mocks.actions.renameShareLinkAction.mockResolvedValueOnce({ ok: false, message: "Fel" });
    await userEvent.click(screen.getByRole("button", { name: label("renameOf") }));
    await waitFor(() => expect(mocks.toast.error).toHaveBeenCalledWith("Fel"));

    mocks.dialogs.prompt.mockResolvedValueOnce("13");
    await userEvent.click(screen.getByRole("button", { name: label("extendOf") }));
    await waitFor(() => expect(mocks.toast.error).toHaveBeenCalledWith(`monthsInvalid:${JSON.stringify({ max: 12 })}`));
    mocks.dialogs.prompt.mockResolvedValueOnce("6");
    await userEvent.click(screen.getByRole("button", { name: label("extendOf") }));
    await waitFor(() => expect(mocks.actions.extendShareLinkAction).toHaveBeenCalledWith("l1", 6));
    mocks.dialogs.prompt.mockResolvedValueOnce("3");
    mocks.actions.extendShareLinkAction.mockResolvedValueOnce({ ok: false, message: "Nej" });
    await userEvent.click(screen.getByRole("button", { name: label("extendOf") }));
    await waitFor(() => expect(mocks.toast.error).toHaveBeenCalledWith("Nej"));

    mocks.dialogs.confirm.mockResolvedValueOnce(false);
    await userEvent.click(screen.getByRole("button", { name: label("revokeOf") }));
    expect(mocks.actions.revokeShareLinkAction).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: label("revokeOf") }));
    await waitFor(() => expect(mocks.toast.success).toHaveBeenCalledWith("revoked"));
    mocks.actions.revokeShareLinkAction.mockResolvedValueOnce({ ok: false, message: "Borta" });
    await userEvent.click(screen.getByRole("button", { name: label("revokeOf") }));
    await waitFor(() => expect(mocks.toast.error).toHaveBeenCalledWith("Borta"));
  });
});
