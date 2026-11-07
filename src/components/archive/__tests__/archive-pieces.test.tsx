import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PartFilterControls } from "@/components/archive/part-filter.client";
import { FileList, instrumentsOf, type ArchiveFile } from "@/components/archive/file-list";
import { KeyText, VersionBadges, VersionFacts } from "@/components/archive/version-meta";
import { AccessRequest } from "@/components/archive/access-request.client";
import { CreateArrangementButton } from "@/components/archive/create-buttons.client";
import { ShareLinkList } from "@/components/archive/share-link-list";
import { instruments } from "@/components/__tests__/fixtures";

const mocks = vi.hoisted(() => ({
  router: { refresh: vi.fn(), push: vi.fn(), replace: vi.fn() },
  params: "",
  toast: { success: vi.fn(), error: vi.fn() },
  accessRequestAction: vi.fn(),
  createArrangementAction: vi.fn(),
  getShareLinks: vi.fn(),
  getMe: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => mocks.router,
  usePathname: () => "/spex/s1/parts",
  useSearchParams: () => new URLSearchParams(mocks.params),
}));
vi.mock("next/link", () => ({
  default: ({ children, href, ...rest }: { children?: ReactNode; href: string }) => <a href={href} {...rest}>{children}</a>,
}));
vi.mock("next-intl/server", () => ({
  getTranslations: async () => (key: string, values?: Record<string, unknown>) => (values ? `${key}:${JSON.stringify(values)}` : key),
  getLocale: async () => "sv",
}));
vi.mock("sonner", () => ({ toast: mocks.toast }));
vi.mock("@/utils/umami", () => ({ track: vi.fn() }));
vi.mock("@/app/(app)/actions.server", () => ({ accessRequestAction: mocks.accessRequestAction }));
vi.mock("@/app/(app)/manage/actions.server", () => ({ createArrangementAction: mocks.createArrangementAction }));
vi.mock("@/lib/admin/admin.server", () => ({ getShareLinks: mocks.getShareLinks }));
vi.mock("@/lib/archive/archive.server", () => ({ getMe: mocks.getMe }));
vi.mock("@/components/archive/share-link-actions.client", () => ({ ShareLinkActions: () => null }));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.params = "";
});

describe("PartFilterControls", () => {
  it("toggles instruments and pitches in the address, and clears them", async () => {
    const TRUMPET = "00000000-0000-7000-8000-000000000001";
    const FLUTE = "00000000-0000-7000-8000-000000000002";

    mocks.params = `q=1&instruments=${TRUMPET}`;
    render(<PartFilterControls instruments={[{ ...instruments[0], id: TRUMPET }, { ...instruments[1], id: FLUTE }]} pitches={["C", "B_FLAT"]} />);
    expect(screen.getByRole("button", { name: "Trumpet" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getAllByRole("button", { name: /Trumpet|Flöjt/ }).map(button => button.textContent)).toEqual(["Flöjt", "Trumpet"]);

    await userEvent.click(screen.getByRole("button", { name: "Flöjt" }));
    expect(mocks.router.replace).toHaveBeenCalledWith(`/spex/s1/parts?q=1&instruments=${TRUMPET},${FLUTE}`, { scroll: false });
    await userEvent.click(screen.getByRole("button", { name: `pitch:${JSON.stringify({ pitch: "B" })}` }));
    expect(mocks.router.replace).toHaveBeenLastCalledWith(expect.stringContaining("pitches=B_FLAT"), { scroll: false });
    await userEvent.click(screen.getByRole("button", { name: "clear" }));
    expect(mocks.router.replace).toHaveBeenLastCalledWith("/spex/s1/parts?q=1", { scroll: false });
  });

  it("works on state passed in", async () => {
    const onChange = vi.fn();

    render(<PartFilterControls instruments={[]} pitches={[]} value={{ instrumentIds: [], transpositions: ["C"] }} onChange={onChange} />);
    await userEvent.click(screen.getByRole("button", { name: "clear" }));
    expect(onChange).toHaveBeenCalledWith({ instrumentIds: [], transpositions: [] });
    expect(mocks.router.replace).not.toHaveBeenCalled();
  });
});

const archiveFile = (id: string, fields: Partial<ArchiveFile> = {}) => ({
  id, versionId: "v1", title: `Fil ${id}`, comment: null, name: `${id}.pdf`, extension: "pdf", contentType: "application/pdf", size: 4096,
  pages: 2, position: 0, desk: "1", processing: "DONE", hasPreview: true, hasText: true, canOpen: true, downloadCount: 0,
  createdAt: "2026-01-01T00:00:00Z", role: { id: "part", nameSv: "Stämma", nameEn: "Part" }, instruments: [instruments[0]],
  transposition: { pitch: "B_FLAT", octave: 0 }, ...fields,
}) as unknown as ArchiveFile;

describe("FileList", () => {
  it("lists files to read and download, and locked ones", () => {
    const { container } = render(<FileList files={[]} />);

    expect(container).toBeEmptyDOMElement();
    render(<FileList label="Filer" files={[
      archiveFile("f1", { comment: "Rättad" }),
      archiveFile("f2", { extension: "jpg", contentType: "image/jpeg", hasPreview: false, pages: null, transposition: null, desk: null }),
      archiveFile("f3", { canOpen: false }),
    ]} />);
    expect(screen.getByRole("link", { name: `readOf:${JSON.stringify({ title: "Fil f1" })}` })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: `downloadOf:${JSON.stringify({ title: "Fil f2" })}` })).toBeInTheDocument();
    expect(screen.getAllByText("locked").length).toBeGreaterThan(0);
    expect(instrumentsOf([{ instruments: [instruments[1], instruments[0]] }, { instruments: [instruments[0]] }]).map(i => i.id)).toEqual(["flute", "trumpet"]);
  });
});

describe("version meta", () => {
  it("shows badges and facts", () => {
    render(<>
      <VersionBadges version={{ label: "v", recommended: true, restricted: true, published: false, trashed: true }} />
      <KeyText keyValue={{ tonic: "F", mode: "MAJOR" }} />
      <KeyText />
      <VersionFacts version={{
        label: "v", usedIn: { id: "s1", title: "Nobel", year: 1975 }, key: { tonic: "B_FLAT", mode: "MINOR" }, arranger: "Kim",
        instrumentation: [{ count: 2, instrument: instruments[0] as never }, { count: 1, instrument: instruments[1] as never }],
        tempo: "Allegro", duration: "3:00", date: "1975-02-14", notes: "Anteckning",
      }} />
      <VersionFacts version={{ label: "tom" }} showSpex={false} />
    </>);
    expect(screen.getByText("recommended")).toBeInTheDocument();
    expect(screen.getByText("2 Trumpet, Flöjt")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Nobel/ })).toBeInTheDocument();
    expect(screen.getByText("Anteckning")).toBeInTheDocument();
  });
});

describe("AccessRequest", () => {
  it("asks the editors with a reason", async () => {
    render(<AccessRequest files={[{ id: "f1", title: "Partitur" }]} />);
    mocks.accessRequestAction.mockResolvedValueOnce({ ok: false, message: "Fel" });
    await userEvent.click(screen.getByRole("button", { name: "ask" }));
    await userEvent.type(screen.getByLabelText("reason"), "Jag spelar trumpet");
    await userEvent.click(screen.getByRole("button", { name: "send" }));
    await waitFor(() => expect(mocks.toast.error).toHaveBeenCalledWith("Fel"));

    mocks.accessRequestAction.mockResolvedValueOnce({ ok: true, data: null });
    await userEvent.click(screen.getByRole("button", { name: "send" }));
    await waitFor(() => expect(mocks.accessRequestAction).toHaveBeenLastCalledWith(["f1"], "Jag spelar trumpet"));
    expect(await screen.findByRole("button", { name: "asked" })).toBeDisabled();
  });

  it("offers nothing to ask for without files, and is cancelled", async () => {
    const { unmount } = render(<AccessRequest files={[]} />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    unmount();
    render(<AccessRequest files={[{ id: "f1", title: "Partitur" }]} />);
    await userEvent.click(screen.getByRole("button", { name: "ask" }));
    await userEvent.click(screen.getByRole("button", { name: "cancel" }));
    await waitFor(() => expect(screen.queryByLabelText("reason")).not.toBeInTheDocument());
  });
});

describe("CreateArrangementButton", () => {
  it("makes an arrangement and opens its first version, or the arrangement", async () => {
    render(<CreateArrangementButton numberId="n1" title="Duett" />);
    const button = screen.getByRole("button", { name: `createArrangementOf:${JSON.stringify({ title: "Duett" })}` });

    mocks.createArrangementAction.mockResolvedValueOnce({ ok: true, data: { id: "a1", versionId: "v1" } });
    await userEvent.click(button);
    await waitFor(() => expect(mocks.router.push).toHaveBeenCalledWith(expect.stringContaining("v1")));
    mocks.createArrangementAction.mockResolvedValueOnce({ ok: true, data: { id: "a1", versionId: null } });
    await userEvent.click(button);
    await waitFor(() => expect(mocks.router.push).toHaveBeenLastCalledWith("/arrangements/a1"));
    mocks.createArrangementAction.mockResolvedValueOnce({ ok: false, message: "Fel" });
    await userEvent.click(button);
    await waitFor(() => expect(mocks.toast.error).toHaveBeenCalledWith("Fel"));
  });
});

describe("ShareLinkList", () => {
  it("says when there are none", async () => {
    mocks.getShareLinks.mockResolvedValue([]);
    mocks.getMe.mockResolvedValue(null);
    render(await ShareLinkList({ all: false }));
    expect(screen.getByText("none")).toBeInTheDocument();
  });

  it("lists what each link shares and its downloads", async () => {
    mocks.getMe.mockResolvedValue({ settings: { maxShareLinkMonths: 12 } });
    mocks.getShareLinks.mockResolvedValue([
      { id: "l1", name: "Orkester", status: "VALID", createdById: "u1", createdByName: null, createdAt: "2026-01-01T00:00:00Z",
        expiresAt: "2027-01-01T00:00:00Z", revokedAt: null, downloadCount: 3, spex: { id: "s1", title: "Nobel", year: 1975 },
        instruments: [instruments[0]], transpositions: ["B_FLAT"],
        versions: [{ id: "v1", kind: "ARRANGEMENT", label: "Original", manuscript: null, arrangement: { id: "a1", number: { title: "Duett" } } }],
        files: [{ id: "f1", title: "Partitur" }], downloads: [{ file: { id: "f1", title: "Partitur" }, count: 3 }] },
      { id: "l2", name: "Gammal", status: "REVOKED", createdById: "u1", createdByName: "Kim", createdAt: "2026-01-01T00:00:00Z",
        expiresAt: "2027-01-01T00:00:00Z", revokedAt: "2026-02-01T00:00:00Z", revokedByName: "Kim", downloadCount: 0, spex: null,
        instruments: [], transpositions: [], versions: [{ id: "v2", kind: "MANUSCRIPT", label: "1", manuscript: { id: "m1", title: "Manus" }, arrangement: null }],
        files: [], downloads: [] },
    ]);
    render(await ShareLinkList({ all: true }));
    expect(screen.getAllByTestId("share-link")).toHaveLength(2);
    expect(screen.getByRole("link", { name: "Duett" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Manus" })).toBeInTheDocument();
    expect(screen.getByText("perFile")).toBeInTheDocument();
  });
});
