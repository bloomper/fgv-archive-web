import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { CollapseSidebarOnTablet, TABLET } from "@/components/reader/collapse-sidebar-on-tablet.client";
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";

const width = (matchesTablet: boolean) => vi.stubGlobal("matchMedia", (query: string) => ({
  matches: query === TABLET ? matchesTablet : false,
  media: query,
  addEventListener: () => {
  },
  removeEventListener: () => {
  },
}));

function State() {
  return <span>{useSidebar().open ? "open" : "closed"}</span>;
}

const tree = (reader: boolean, defaultOpen = true) => (
  <SidebarProvider defaultOpen={defaultOpen}>
    {reader && <CollapseSidebarOnTablet />}
    <State />
  </SidebarProvider>
);

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("CollapseSidebarOnTablet", () => {
  it("collapses the sidebar on tablets while the reader is shown and opens it again after", () => {
    width(true);
    const { rerender } = render(tree(true));

    expect(screen.getByText("closed")).toBeInTheDocument();
    rerender(tree(false));
    expect(screen.getByText("open")).toBeInTheDocument();
  });

  it("leaves a closed sidebar closed", () => {
    width(true);
    const { rerender } = render(tree(true, false));

    rerender(tree(false, false));
    expect(screen.getByText("closed")).toBeInTheDocument();
  });

  it("leaves the sidebar alone on wider screens", () => {
    width(false);
    render(tree(true));

    expect(screen.getByText("open")).toBeInTheDocument();
  });
});
