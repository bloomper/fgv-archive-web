import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CommandPalette } from "@/components/command-palette.client";

const push = vi.fn();

vi.mock("next/navigation", () => ({ useRouter: () => ({ push, replace: vi.fn(), refresh: vi.fn() }) }));
vi.mock("@/utils/umami", () => ({ track: vi.fn() }));

const openPalette = async () => {
  const user = userEvent.setup();

  await user.click(screen.getByRole("button", { name: "CommandPalette.open" }));
  return user;
};

describe("CommandPalette", () => {
  beforeEach(() => push.mockClear());

  it("offers members the reading pages only", async () => {
    render(<CommandPalette roles={["USER"]} />);
    expect(screen.queryByText("Nav.spex")).not.toBeInTheDocument();

    await openPalette();

    expect(await screen.findByText("Nav.spex")).toBeInTheDocument();
    expect(screen.getByText("About.title")).toBeInTheDocument();
    expect(screen.queryByText("Nav.missing")).not.toBeInTheDocument();
    expect(screen.queryByText("Nav.adminSettings")).not.toBeInTheDocument();
  });

  it("offers editors the manage pages and a new manuscript, and admins the admin pages", async () => {
    const { unmount } = render(<CommandPalette roles={["USER", "EDITOR"]} />);

    await openPalette();
    expect(await screen.findByText("Nav.auditLog")).toBeInTheDocument();
    expect(screen.getByText("Nav.newManuscript")).toBeInTheDocument();
    expect(screen.queryByText("Nav.adminSettings")).not.toBeInTheDocument();
    unmount();

    render(<CommandPalette roles={["USER", "ADMIN"]} />);
    await openPalette();
    expect(await screen.findByText("Nav.adminStorage")).toBeInTheDocument();
  });

  it("opens on Ctrl/Cmd+K, filters, and goes to the chosen page", async () => {
    const user = userEvent.setup();

    render(<CommandPalette roles={["USER", "EDITOR"]} />);
    await user.keyboard("{Control>}k{/Control}");
    await user.type(await screen.findByPlaceholderText("CommandPalette.placeholder"), "trash");

    expect(screen.queryByText("Nav.spex")).not.toBeInTheDocument();
    await user.click(screen.getByRole("option", { name: "Nav.trash" }));
    expect(push).toHaveBeenCalledWith("/manage/trash");
  });

  it("searches the archive for what was typed", async () => {
    const user = await (async () => {
      render(<CommandPalette roles={["USER"]} />);
      return openPalette();
    })();

    await user.type(await screen.findByPlaceholderText("CommandPalette.placeholder"), "Nobel 75");
    await user.click(screen.getByRole("option", { name: /CommandPalette.searchFor/ }));
    expect(push).toHaveBeenCalledWith("/search?q=Nobel%2075");
  });
});
