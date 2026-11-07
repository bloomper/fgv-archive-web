import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NumberEditor, type EditableNumber } from "@/components/archive/number-editor.client";
import { dialogs as makeDialogs } from "@/components/__tests__/fixtures";

const mocks = vi.hoisted(() => ({
  router: { refresh: vi.fn() },
  toast: { success: vi.fn(), error: vi.fn() },
  actions: {
    createNumberAction: vi.fn(), deleteNumberAction: vi.fn(), mergeNumberAction: vi.fn(), pasteNumbersAction: vi.fn(),
    reorderNumbersAction: vi.fn(), updateNumberAction: vi.fn(),
  },
  dialogs: undefined as unknown as ReturnType<typeof makeDialogs>,
}));

vi.mock("next/navigation", () => ({ useRouter: () => mocks.router }));
vi.mock("sonner", () => ({ toast: mocks.toast }));
vi.mock("@/app/(app)/manage/actions.server", () => mocks.actions);
vi.mock("@/components/dialogs.client", () => ({ useDialogs: () => mocks.dialogs }));

const numbers: EditableNumber[] = [
  { id: "n1", position: 1, title: "Ouvertyr", hasArrangement: true, composer: "Kim" },
  { id: "n2", position: 2, title: "Duett", originalSong: "Fly me", lyricist: "Tina", hasArrangement: false },
  { id: "n3", position: 3, title: "Final", hasArrangement: false },
];
const name = (key: string, title: string) => `${key}:${JSON.stringify({ title })}`;

describe("NumberEditor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.dialogs = makeDialogs();
    Object.values(mocks.actions).forEach(action => action.mockResolvedValue({ ok: true, data: null }));
  });

  it("says when there are no numbers, and adds one", async () => {
    render(<NumberEditor spexId="s1" numbers={[]} />);
    expect(screen.getByText("none")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "add" }));
    await userEvent.click(screen.getByRole("button", { name: "save" }));
    expect(mocks.actions.createNumberAction).not.toHaveBeenCalled();
    await userEvent.type(screen.getByLabelText("fields.title"), "Ny");
    await userEvent.click(screen.getByRole("button", { name: "save" }));
    await waitFor(() => expect(mocks.actions.createNumberAction).toHaveBeenCalledWith("s1", { title: "Ny", originalSong: "", lyricist: "", composer: "" }));

    await userEvent.click(screen.getByRole("button", { name: "add" }));
    await userEvent.click(screen.getByRole("button", { name: "cancel" }));
    expect(screen.queryByRole("form")).not.toBeInTheDocument();
  });

  it("edits a number and says when saving fails", async () => {
    mocks.actions.updateNumberAction.mockResolvedValueOnce({ ok: false, message: "Fel" });
    render(<NumberEditor spexId="s1" numbers={numbers} />);
    expect(screen.getByText("Fly me · Tina")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: name("edit", "Duett") }));
    await userEvent.type(screen.getByLabelText("fields.composer"), "Ana");
    await userEvent.click(screen.getByRole("button", { name: "save" }));
    await waitFor(() => expect(mocks.actions.updateNumberAction).toHaveBeenCalledWith("n2", { title: "Duett", originalSong: "Fly me", lyricist: "Tina", composer: "Ana" }));
    await waitFor(() => expect(mocks.toast.error).toHaveBeenCalledWith("Fel"));
  });

  it("reorders by arrows and dragging", async () => {
    render(<NumberEditor spexId="s1" numbers={numbers} />);
    await userEvent.click(screen.getByRole("button", { name: name("moveDown", "Ouvertyr") }));
    await waitFor(() => expect(mocks.actions.reorderNumbersAction).toHaveBeenCalledWith("s1", ["n2", "n1", "n3"]));
    await userEvent.click(screen.getByRole("button", { name: name("moveUp", "Final") }));
    await waitFor(() => expect(mocks.actions.reorderNumbersAction).toHaveBeenLastCalledWith("s1", ["n2", "n3", "n1"]));

    const rows = screen.getAllByTestId("number-row");
    fireEvent.dragStart(rows[2]);
    fireEvent.dragOver(rows[0]);
    fireEvent.drop(rows[0]);
    await waitFor(() => expect(mocks.actions.reorderNumbersAction).toHaveBeenLastCalledWith("s1", ["n1", "n2", "n3"]));
    fireEvent.dragStart(rows[0]);
    fireEvent.drop(rows[0]);
    fireEvent.dragEnd(rows[0]);
    expect(mocks.actions.reorderNumbersAction).toHaveBeenCalledTimes(3);
  });

  it("deletes a number without an arrangement and merges one with", async () => {
    render(<NumberEditor spexId="s1" numbers={numbers} />);
    expect(screen.getByRole("button", { name: name("deleteOf", "Ouvertyr") })).toBeDisabled();
    mocks.dialogs.confirm.mockResolvedValueOnce(false);
    await userEvent.click(screen.getByRole("button", { name: name("deleteOf", "Duett") }));
    expect(mocks.actions.deleteNumberAction).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: name("deleteOf", "Duett") }));
    await waitFor(() => expect(mocks.actions.deleteNumberAction).toHaveBeenCalledWith("n2"));

    await userEvent.click(screen.getByRole("button", { name: name("mergeOf", "Ouvertyr") }));
    expect(mocks.actions.mergeNumberAction).not.toHaveBeenCalled();
    mocks.dialogs.choose.mockResolvedValueOnce("n3");
    await userEvent.click(screen.getByRole("button", { name: name("mergeOf", "Ouvertyr") }));
    await waitFor(() => expect(mocks.actions.mergeNumberAction).toHaveBeenCalledWith("n1", "n3"));
    expect(mocks.dialogs.choose.mock.calls[1][0].items?.map(item => item.id)).toEqual(["n2", "n3"]);
  });

  it("pastes a list", async () => {
    render(<NumberEditor spexId="s1" numbers={numbers} />);
    expect(screen.getByRole("button", { name: "pasteButton" })).toBeDisabled();
    await userEvent.type(screen.getByLabelText("paste"), "Ett{enter}Två");
    await userEvent.click(screen.getByRole("button", { name: "pasteButton" }));
    await waitFor(() => expect(mocks.actions.pasteNumbersAction).toHaveBeenCalledWith("s1", "Ett\nTvå"));
    expect(screen.getByLabelText("paste")).toHaveValue("");
  });
});
