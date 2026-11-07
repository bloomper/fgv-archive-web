import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { VersionForm, type EditableVersion } from "@/components/editor/version-form.client";
import { VersionState } from "@/components/editor/version-state.client";
import { dialogs as makeDialogs, instruments } from "@/components/__tests__/fixtures";

const mocks = vi.hoisted(() => ({
  router: { refresh: vi.fn(), push: vi.fn() },
  toast: { success: vi.fn(), error: vi.fn() },
  actions: {
    updateVersionAction: vi.fn(), copyVersionAction: vi.fn(), deleteVersionAction: vi.fn(), publishVersionAction: vi.fn(),
    recommendVersionAction: vi.fn(), trashVersionAction: vi.fn(),
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

const arrangement: EditableVersion = {
  id: "v1", kind: "ARRANGEMENT", label: "Original", usedInSpexId: null, date: null, notes: null, arranger: "Kim",
  key: { tonic: "F", mode: "MAJOR" }, modulations: [{ tonic: "G", mode: "MAJOR" }], tempo: null, duration: null, restricted: false,
  instrumentation: [{ count: 2, instrument: { id: "trumpet" } }, { count: 1, instrument: { id: "gone" } }],
};
const spex = [{ id: "s1", title: "Nobel", year: 1975, revival: false }, { id: "s2", title: "Nobel", year: 2001, revival: true }];

describe("VersionForm", () => {
  it("saves an arrangement's fields and instrumentation", async () => {
    render(<VersionForm version={arrangement} spex={spex} instruments={instruments} />);
    await userEvent.clear(screen.getByLabelText("label"));
    await userEvent.type(screen.getByLabelText("label"), "Ny");
    await userEvent.selectOptions(screen.getByLabelText("usedIn"), "s2");
    await userEvent.type(screen.getByLabelText("date"), "2001-02-14");
    await userEvent.type(screen.getByLabelText("tempo"), "Allegro");
    await userEvent.type(screen.getByLabelText("duration"), "3:20");
    await userEvent.type(screen.getByLabelText("notes"), " Anteckning ");
    await userEvent.clear(screen.getByLabelText("arranger"));
    await userEvent.clear(screen.getByLabelText(`countOf:${JSON.stringify({ name: "Trumpet" })}`));
    await userEvent.type(screen.getByLabelText(`countOf:${JSON.stringify({ name: "Trumpet" })}`), "3");
    await userEvent.click(screen.getByRole("button", { name: `removeInstrument:${JSON.stringify({ name: "gone" })}` }));
    await userEvent.selectOptions(screen.getByRole("combobox", { name: "addInstrument" }), "flute");
    await userEvent.click(screen.getByRole("checkbox"));
    await userEvent.click(screen.getByRole("button", { name: "save" }));

    await waitFor(() => expect(mocks.actions.updateVersionAction).toHaveBeenCalledWith("v1", {
      label: "Ny", usedInSpexId: "s2", date: "2001-02-14", notes: "Anteckning", restricted: true, arranger: null,
      key: { tonic: "F", mode: "MAJOR" }, modulations: [{ tonic: "G", mode: "MAJOR" }], tempo: "Allegro", duration: "3:20",
      instrumentation: [{ instrumentId: "trumpet", count: 3 }, { instrumentId: "flute", count: 1 }],
    }));
    await waitFor(() => expect(mocks.router.refresh).toHaveBeenCalled());

    await userEvent.selectOptions(screen.getAllByRole("combobox", { name: "tonic" })[0], "");
    mocks.actions.updateVersionAction.mockResolvedValueOnce({ ok: false, message: "Fel" });
    await userEvent.click(screen.getByRole("button", { name: "save" }));
    await waitFor(() => expect(mocks.toast.error).toHaveBeenCalledWith("Fel"));
    expect(mocks.actions.updateVersionAction.mock.calls[1][1]).toMatchObject({ key: null, modulations: [] });
  });

  it("leaves out an arrangement's fields for a manuscript", async () => {
    render(<VersionForm version={{ ...arrangement, kind: "MANUSCRIPT", key: null, modulations: [], instrumentation: [] }} spex={spex} instruments={instruments} />);
    expect(screen.queryByLabelText("arranger")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "save" }));
    await waitFor(() => expect(mocks.actions.updateVersionAction).toHaveBeenCalledWith("v1", {
      label: "Original", usedInSpexId: null, date: null, notes: null, restricted: false,
    }));
  });
});

describe("VersionState", () => {
  it("publishes, recommends, copies and trashes", async () => {
    render(<VersionState id="v1" published={false} recommended={false} trashed={false} admin={false} parentHref="/manuscripts/m1" />);
    await userEvent.click(screen.getByRole("button", { name: "publish" }));
    await waitFor(() => expect(mocks.actions.publishVersionAction).toHaveBeenCalledWith("v1", true));
    await userEvent.click(screen.getByRole("button", { name: "recommend" }));
    await waitFor(() => expect(mocks.actions.recommendVersionAction).toHaveBeenCalledWith("v1", true));

    mocks.actions.copyVersionAction.mockResolvedValueOnce({ ok: true, data: "v2" });
    await userEvent.click(screen.getByRole("button", { name: "copy" }));
    await waitFor(() => expect(mocks.router.push).toHaveBeenCalledWith(expect.stringContaining("v2")));
    mocks.actions.copyVersionAction.mockResolvedValueOnce({ ok: false, message: "Fel" });
    await userEvent.click(screen.getByRole("button", { name: "copy" }));
    await waitFor(() => expect(mocks.toast.error).toHaveBeenCalledWith("Fel"));

    mocks.dialogs.confirm.mockResolvedValueOnce(false);
    await userEvent.click(screen.getByRole("button", { name: "toTrash" }));
    expect(mocks.actions.trashVersionAction).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "toTrash" }));
    await waitFor(() => expect(mocks.router.push).toHaveBeenCalledWith("/manuscripts/m1"));
  });

  it("restores and deletes a trashed version for admins", async () => {
    render(<VersionState id="v1" published recommended trashed admin parentHref="/arrangements/a1" />);
    expect(screen.getByRole("button", { name: "unpublish" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "unrecommend" })).toBeDisabled();

    mocks.actions.trashVersionAction.mockResolvedValueOnce({ ok: false, message: "Fel" });
    await userEvent.click(screen.getByRole("button", { name: "restore" }));
    await waitFor(() => expect(mocks.toast.error).toHaveBeenCalledWith("Fel"));
    await userEvent.click(screen.getByRole("button", { name: "restore" }));
    await waitFor(() => expect(mocks.router.refresh).toHaveBeenCalled());

    mocks.dialogs.confirm.mockResolvedValueOnce(false);
    await userEvent.click(screen.getByRole("button", { name: "delete" }));
    expect(mocks.actions.deleteVersionAction).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "delete" }));
    await waitFor(() => expect(mocks.router.push).toHaveBeenCalledWith("/arrangements/a1"));
  });
});
