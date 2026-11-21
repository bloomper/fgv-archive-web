import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DocumentKindsEditor } from "@/components/admin/document-kinds-editor.client";
import { dialogs as makeDialogs } from "@/components/__tests__/fixtures";

const mocks = vi.hoisted(() => ({
  router: { refresh: vi.fn(), push: vi.fn() },
  toast: { success: vi.fn(), error: vi.fn() },
  actions: {
    saveDocumentKindAction: vi.fn(), reorderDocumentKindsAction: vi.fn(), retireDocumentKindAction: vi.fn(),
    mergeDocumentKindAction: vi.fn(),
  },
  dialogs: undefined as unknown as ReturnType<typeof makeDialogs>,
}));

vi.mock("next/navigation", () => ({ useRouter: () => mocks.router }));
vi.mock("sonner", () => ({ toast: mocks.toast }));
vi.mock("@/app/(app)/admin/actions.server", () => mocks.actions);
vi.mock("@/components/dialogs.client", () => ({ useDialogs: () => mocks.dialogs }));

const kinds = [
  { id: "k1", nameSv: "Manus", nameEn: "Manuscript", aliases: ["manuskript"], position: 1, retired: false, documentCount: 3, book: false },
  { id: "k2", nameSv: "Program", nameEn: "Programme", aliases: [], position: 2, retired: false, documentCount: 0, book: false },
  { id: "k3", nameSv: "Gammal", nameEn: "Old", aliases: [], position: 3, retired: true, documentCount: 1, book: false },
];

beforeEach(() => {
  vi.clearAllMocks();
  mocks.dialogs = makeDialogs();
  Object.values(mocks.actions).forEach(action => action.mockResolvedValue({ ok: true, data: null }));
});

describe("DocumentKindsEditor", () => {
  it("lists the kinds with their counts and aliases", () => {
    render(<DocumentKindsEditor kinds={kinds} />);
    const rows = within(screen.getByRole("list", { name: "list" })).getAllByRole("listitem");

    expect(rows).toHaveLength(3);
    expect(rows[0]).toHaveTextContent("Manuscript · manuskript · documents:{\"count\":3}");
    expect(rows[2]).toHaveTextContent("retired");
  });

  it("adds a kind and renames one with its aliases", async () => {
    render(<DocumentKindsEditor kinds={kinds} />);
    await userEvent.click(screen.getByRole("button", { name: "add" }));
    await userEvent.type(screen.getByLabelText("nameSv"), "Affisch");
    await userEvent.type(screen.getByLabelText("nameEn"), "Poster");
    await userEvent.type(screen.getByLabelText("aliases"), "affischer{enter}{enter}posters");
    await userEvent.click(screen.getByRole("button", { name: "save" }));
    await waitFor(() => expect(mocks.actions.saveDocumentKindAction)
      .toHaveBeenCalledWith(null, { nameSv: "Affisch", nameEn: "Poster", aliases: ["affischer", "posters"], book: false }));

    await userEvent.click(screen.getByRole("button", { name: "edit:{\"name\":\"Program\"}" }));
    await userEvent.clear(screen.getByLabelText("nameSv"));
    await userEvent.type(screen.getByLabelText("nameSv"), "Programblad");
    await userEvent.click(screen.getByRole("button", { name: "save" }));
    await waitFor(() => expect(mocks.actions.saveDocumentKindAction)
      .toHaveBeenLastCalledWith("k2", { nameSv: "Programblad", nameEn: "Programme", aliases: [], book: false }));

    await userEvent.click(screen.getByRole("button", { name: "edit:{\"name\":\"Manus\"}" }));
    await userEvent.click(screen.getByRole("button", { name: "cancel" }));
    expect(screen.queryByLabelText("nameSv")).not.toBeInTheDocument();
  });

  it("reorders, retires and restores", async () => {
    render(<DocumentKindsEditor kinds={kinds} />);
    expect(screen.getByRole("button", { name: "moveUp:{\"name\":\"Manus\"}" })).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: "moveDown:{\"name\":\"Manus\"}" }));
    await waitFor(() => expect(mocks.actions.reorderDocumentKindsAction).toHaveBeenCalledWith(["k2", "k1", "k3"]));

    await userEvent.click(screen.getByRole("button", { name: "retire:{\"name\":\"Program\"}" }));
    await waitFor(() => expect(mocks.actions.retireDocumentKindAction).toHaveBeenCalledWith("k2", true));
    mocks.actions.retireDocumentKindAction.mockResolvedValueOnce({ ok: false, message: "Fel" });
    await userEvent.click(screen.getByRole("button", { name: "restore:{\"name\":\"Gammal\"}" }));
    await waitFor(() => expect(mocks.actions.retireDocumentKindAction).toHaveBeenLastCalledWith("k3", false));
    await waitFor(() => expect(mocks.toast.error).toHaveBeenCalledWith("Fel"));
  });

  it("does not retire the last kind in use", () => {
    render(<DocumentKindsEditor kinds={[kinds[0], kinds[2]]} />);
    expect(screen.getByRole("button", { name: "retire:{\"name\":\"Manus\"}" })).toBeDisabled();
  });

  it("merges a kind into another once confirmed", async () => {
    render(<DocumentKindsEditor kinds={kinds} />);
    const merge = screen.getByRole("button", { name: "merge:{\"name\":\"Manus\"}" });

    await userEvent.click(merge);
    expect(mocks.dialogs.choose.mock.calls[0][0].items).toEqual([{ id: "k2", label: "Program" }, { id: "k3", label: "Gammal" }]);
    expect(mocks.actions.mergeDocumentKindAction).not.toHaveBeenCalled();

    mocks.dialogs.choose.mockResolvedValue("k2");
    mocks.dialogs.confirm.mockResolvedValueOnce(false);
    await userEvent.click(merge);
    expect(mocks.actions.mergeDocumentKindAction).not.toHaveBeenCalled();

    await userEvent.click(merge);
    await waitFor(() => expect(mocks.actions.mergeDocumentKindAction).toHaveBeenCalledWith("k1", "k2"));
    expect(mocks.dialogs.confirm.mock.calls.at(-1)?.[0].destructive).toBe(true);
  });
});
