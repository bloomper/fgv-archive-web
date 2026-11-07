import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FileManager, type ManagedFile } from "@/components/editor/file-manager.client";
import { dialogs as makeDialogs, instruments } from "@/components/__tests__/fixtures";

const mocks = vi.hoisted(() => ({
  refresh: vi.fn(),
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
  uploadFile: vi.fn(),
  actions: {
    addFileAction: vi.fn(), deleteFileAction: vi.fn(), fileGuessAction: vi.fn(), reorderFilesAction: vi.fn(),
    replaceFileAction: vi.fn(), updateFileAction: vi.fn(),
  },
  dialogs: undefined as unknown as ReturnType<typeof makeDialogs>,
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: mocks.refresh }) }));
vi.mock("sonner", () => ({ toast: mocks.toast }));
vi.mock("@/utils/umami", () => ({ track: vi.fn() }));
vi.mock("@/components/upload/tus.client", () => ({ uploadFile: mocks.uploadFile }));
vi.mock("@/app/(app)/manage/actions.server", () => mocks.actions);
vi.mock("@/components/dialogs.client", () => ({ useDialogs: () => mocks.dialogs }));
vi.mock("@/components/archive/share-link-dialog.client", () => ({
  ShareLinkButton: ({ input }: { input: { fileIds: string[] } }) => <span>share {input.fileIds.join(",")}</span>,
}));
// The pickers have tests of their own; here they only report a choice
vi.mock("@/components/editor/pickers.client", () => ({
  InstrumentsPicker: ({ id, onChange }: { id: string; onChange: (ids: string[]) => void }) => (
    <><button type="button" onClick={() => onChange(["flute"])}>{`${id} flute`}</button>
      <button type="button" onClick={() => onChange(["unknown"])}>{`${id} unknown`}</button></>
  ),
  TranspositionPicker: ({ id, onChange }: { id: string; onChange: (value: unknown) => void }) => (
    <button type="button" onClick={() => onChange({ pitch: "E_FLAT", octave: 0 })}>{`${id} e-flat`}</button>
  ),
}));

const roles = [{ id: "part", nameSv: "Stämma", nameEn: "Part" }, { id: "score", nameSv: "Partitur", nameEn: "Score" }];
const file = (id: string, fields: Partial<ManagedFile> = {}): ManagedFile => ({
  id, title: `Fil ${id}`, name: `${id}.pdf`, size: 2048, processing: "DONE", role: roles[0], instruments: [instruments[0]],
  transposition: { pitch: "B_FLAT", octave: 0 }, desk: "1", downloadCount: 3, ...fields,
});
const files = [file("f1"), file("f2", { processing: "PENDING", transposition: null, desk: null, downloadCount: null })];

const manager = (list = files) => render(
  <FileManager versionId="v1" files={list} roles={roles} instruments={instruments} maxUploadMb={1} maxShareLinkMonths={12} shareName="Finalen" />,
);

describe("FileManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.dialogs = makeDialogs();
    Object.values(mocks.actions).forEach(action => action.mockResolvedValue({ ok: true, data: null }));
    mocks.uploadFile.mockImplementation(async (_: File, progress: (fraction: number) => void) => {
      progress(0.5);
      return "upload-1";
    });
  });

  it("says when there are no files", () => {
    manager([]);
    expect(screen.getByText("none")).toBeInTheDocument();
  });

  it("uploads a file, guesses its metadata and adds it once corrected", async () => {
    mocks.actions.fileGuessAction.mockResolvedValue({
      ok: true, data: { title: "Trumpet 1", role: { id: "part" }, instruments: [{ id: "trumpet" }], desk: "1", transposition: { pitch: "B_FLAT", octave: 0 } },
    });
    manager();
    await userEvent.upload(screen.getByTestId("file-input"), [new File(["x"], "trumpet-1.pdf"), new File([new Uint8Array(2 * 1024 * 1024)], "stor.pdf")]);
    expect(mocks.toast.error).toHaveBeenCalledWith(`tooLarge:${JSON.stringify({ name: "stor.pdf", max: 1 })}`);

    const upload = await screen.findByTestId("pending-upload");
    await waitFor(() => expect(within(upload).getByText("uploaded")).toBeInTheDocument());
    await waitFor(() => expect(within(upload).getByLabelText("fileTitle")).toHaveValue("Trumpet 1"));

    await userEvent.type(within(upload).getByLabelText("desk"), "b");
    await userEvent.type(within(upload).getByLabelText("comment"), "Ny");
    await userEvent.selectOptions(within(upload).getByLabelText("role"), "score");
    await userEvent.click(within(upload).getByRole("button", { name: /flute$/ }));
    await userEvent.click(within(upload).getByRole("button", { name: /e-flat$/ }));
    await userEvent.click(within(upload).getByRole("button", { name: "add" }));
    await waitFor(() => expect(mocks.actions.addFileAction).toHaveBeenCalledWith("v1", "upload-1", {
      title: "Trumpet 1", comment: "Ny", roleId: "score", instrumentIds: ["flute"], desk: "1b", transposition: { pitch: "E_FLAT", octave: 0 },
    }));
    await waitFor(() => expect(screen.queryByTestId("pending-upload")).not.toBeInTheDocument());
  });

  it("takes the first instrument's transposition until one is chosen, and adds all at once", async () => {
    mocks.actions.fileGuessAction.mockResolvedValue({ ok: false, message: "nej" });
    manager();
    const zone = screen.getByTestId("drop-zone");

    fireEvent.dragOver(zone, { dataTransfer: { types: ["Files"], files: [] } });
    fireEvent.dragLeave(zone);
    fireEvent.drop(zone, { dataTransfer: { types: ["Files"], files: [new File(["x"], "a.pdf"), new File(["y"], "b.pdf")] } });

    const uploads = await screen.findAllByTestId("pending-upload");
    await waitFor(() => expect(within(uploads[1]).getByText("uploaded")).toBeInTheDocument());
    await userEvent.click(within(uploads[0]).getByRole("button", { name: /flute$/ }));
    await userEvent.click(within(uploads[1]).getByRole("button", { name: /unknown$/ }));

    mocks.actions.addFileAction.mockResolvedValueOnce({ ok: false, message: "Fel" });
    await userEvent.click(screen.getByRole("button", { name: "addAll" }));
    await waitFor(() => expect(mocks.actions.addFileAction).toHaveBeenCalledTimes(2));
    expect(mocks.actions.addFileAction.mock.calls[0][2]).toMatchObject({ title: "a", instrumentIds: ["flute"], transposition: { pitch: "C", octave: 0 } });
    expect(mocks.actions.addFileAction.mock.calls[1][2]).toMatchObject({ instrumentIds: ["unknown"], transposition: null });
    await waitFor(() => expect(mocks.toast.error).toHaveBeenCalledWith("Fel"));

    await userEvent.click(within(screen.getByTestId("pending-upload")).getByRole("button", { name: "cancel" }));
    expect(screen.queryByTestId("pending-upload")).not.toBeInTheDocument();
  });

  it("shows an upload that failed", async () => {
    mocks.actions.fileGuessAction.mockResolvedValue({ ok: true, data: null });
    mocks.uploadFile.mockRejectedValueOnce(new Error("offline"));
    manager();
    await userEvent.upload(screen.getByTestId("file-input"), new File(["x"], "a.pdf"));
    expect(await screen.findByText("failed")).toBeInTheDocument();
  });

  it("edits a file's metadata", async () => {
    manager();
    expect(screen.getByText("processing.PENDING", { exact: false })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: `edit:${JSON.stringify({ title: "Fil f1" })}` }));
    const form = screen.getByRole("form", { name: `editForm:${JSON.stringify({ title: "Fil f1" })}` });

    await userEvent.clear(within(form).getByLabelText("fileTitle"));
    await userEvent.type(within(form).getByLabelText("fileTitle"), "Trumpet");
    await userEvent.click(within(form).getByRole("button", { name: /flute$/ }));
    await userEvent.click(within(form).getByRole("button", { name: "save" }));
    await waitFor(() => expect(mocks.actions.updateFileAction).toHaveBeenCalledWith("f1", expect.objectContaining({
      title: "Trumpet", instrumentIds: ["flute"], transposition: { pitch: "B_FLAT", octave: 0 },
    })));

    await userEvent.click(screen.getByRole("button", { name: `edit:${JSON.stringify({ title: "Fil f1" })}` }));
    mocks.actions.updateFileAction.mockResolvedValueOnce({ ok: false, message: "Fel" });
    await userEvent.click(screen.getByRole("button", { name: "save" }));
    await waitFor(() => expect(mocks.toast.error).toHaveBeenCalledWith("Fel"));
    await userEvent.click(screen.getByRole("button", { name: "cancel" }));
    expect(screen.queryByRole("form")).not.toBeInTheDocument();
  });

  it("reorders by arrows and by dragging", async () => {
    manager();
    await userEvent.click(screen.getByRole("button", { name: `moveDown:${JSON.stringify({ title: "Fil f1" })}` }));
    await waitFor(() => expect(mocks.actions.reorderFilesAction).toHaveBeenCalledWith("v1", ["f2", "f1"]));

    mocks.actions.reorderFilesAction.mockResolvedValueOnce({ ok: false, message: "Fel" });
    const rows = screen.getAllByTestId("managed-file");
    const dataTransfer = { setData: vi.fn(), types: [], files: [] };

    fireEvent.dragStart(rows[1], { dataTransfer });
    fireEvent.dragOver(rows[0], { dataTransfer });
    fireEvent.drop(rows[0], { dataTransfer });
    await waitFor(() => expect(mocks.actions.reorderFilesAction).toHaveBeenLastCalledWith("v1", ["f1", "f2"]));
    await waitFor(() => expect(mocks.toast.error).toHaveBeenCalledWith("Fel"));
    fireEvent.dragStart(rows[0], { dataTransfer });
    fireEvent.drop(rows[0], { dataTransfer });
    fireEvent.dragEnd(rows[0]);
    expect(mocks.actions.reorderFilesAction).toHaveBeenCalledTimes(2);
  });

  it("replaces and deletes files", async () => {
    manager();
    await userEvent.click(screen.getByRole("button", { name: `replace:${JSON.stringify({ title: "Fil f1" })}` }));
    const replaceInput = document.querySelector("input[aria-hidden]") as HTMLInputElement;

    await userEvent.upload(replaceInput, new File(["x"], "ny.pdf"));
    await waitFor(() => expect(mocks.actions.replaceFileAction).toHaveBeenCalledWith("f1", "upload-1"));
    mocks.actions.replaceFileAction.mockResolvedValueOnce({ ok: false, message: "Fel" });
    await userEvent.upload(replaceInput, new File(["x"], "ny.pdf"));
    await waitFor(() => expect(mocks.toast.error).toHaveBeenCalledWith("Fel"));
    mocks.uploadFile.mockRejectedValueOnce(new Error("offline"));
    await act(async () => userEvent.upload(replaceInput, new File(["x"], "ny.pdf")));
    await waitFor(() => expect(mocks.toast.error).toHaveBeenCalledWith("offline"));

    mocks.dialogs.confirm.mockResolvedValueOnce(false);
    await userEvent.click(screen.getByRole("button", { name: `deleteOf:${JSON.stringify({ title: "Fil f2" })}` }));
    expect(mocks.actions.deleteFileAction).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: `deleteOf:${JSON.stringify({ title: "Fil f2" })}` }));
    await waitFor(() => expect(mocks.actions.deleteFileAction).toHaveBeenCalledWith("f2"));
    mocks.actions.deleteFileAction.mockResolvedValueOnce({ ok: false, message: "Nej" });
    await userEvent.click(screen.getByRole("button", { name: `deleteOf:${JSON.stringify({ title: "Fil f2" })}` }));
    await waitFor(() => expect(mocks.toast.error).toHaveBeenCalledWith("Nej"));
  });

  it("shares chosen files", async () => {
    manager();
    await userEvent.click(screen.getByRole("checkbox", { name: `select:${JSON.stringify({ title: "Fil f1" })}` }));
    await userEvent.click(screen.getByRole("checkbox", { name: `select:${JSON.stringify({ title: "Fil f2" })}` }));
    expect(screen.getByText("share f1,f2")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("checkbox", { name: `select:${JSON.stringify({ title: "Fil f1" })}` }));
    expect(screen.getByText("share f2")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "clearSelection" }));
    expect(screen.queryByText(/^share/)).not.toBeInTheDocument();
  });
});
