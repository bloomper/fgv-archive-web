import type { ReactNode } from "react";
import { Info } from "lucide-react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppSidebar } from "@/components/app-sidebar.client";
import { SiteHeader } from "@/components/site-header.client";
import { AboutPage } from "@/components/about-page.client";
import { SupportPage } from "@/components/support-page.client";
import { HeaderSearch } from "@/components/header-search.client";
import { LoginButton } from "@/components/login-button.client";
import { NavSecondary } from "@/components/nav-secondary.client";
import { LinkSegments, LinkTabs } from "@/components/link-tabs";
import { DataEmpty } from "@/components/data-empty";
import { HomeSection } from "@/components/home-section";
import { Logo } from "@/components/logo";
import { LogoHome } from "@/components/logo-home";
import { LogoText } from "@/components/logo-text";
import { Umami } from "@/components/umami";

const mocks = vi.hoisted(() => ({ push: vi.fn(), pathname: "/", params: "" }));

vi.mock("next/navigation", () => ({
  usePathname: () => mocks.pathname,
  useRouter: () => ({ push: mocks.push, refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(mocks.params),
}));
vi.mock("next/link", () => ({
  default: ({ children, href, ...rest }: { children?: ReactNode; href: string }) => <a href={href} {...rest}>{children}</a>,
}));
vi.mock("next/script", () => ({ default: (props: { src: string }) => <script data-src={props.src} /> }));
vi.mock("next/server", () => ({ connection: async () => undefined }));
vi.mock("@/hooks/use-is-client.client", () => ({ useIsClient: () => true }));
vi.mock("@/components/nav-user.client", () => ({ NavUser: () => <span>nav-user</span> }));
vi.mock("@/components/app-switcher.client", () => ({ AppSwitcher: ({ title }: { title: string }) => <span>{title}</span> }));
// Tested in toggles.test.tsx, with the locale provider they need
vi.mock("@/components/language-toggle.client", () => ({ LanguageToggle: () => null }));

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("the shell", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.pathname = "/";
    mocks.params = "";
  });

  it("shows editors and admins more pages than users", () => {
    const sidebar = (roles: ("USER" | "EDITOR" | "ADMIN")[]) => render(
      <TooltipProvider><SidebarProvider><AppSidebar roles={roles} accountUrl="https://auth/account" /></SidebarProvider></TooltipProvider>,
    );

    const user = sidebar(["USER"]);
    const userLinks = screen.getAllByRole("link").length;
    user.unmount();

    mocks.pathname = "/manage/share-links";
    sidebar(["USER", "EDITOR", "ADMIN"]);
    expect(screen.getAllByRole("link").length).toBeGreaterThan(userLinks);
    expect(screen.getByText("nav-user")).toBeInTheDocument();
  });

  it("has a header with the menu button and search", async () => {
    render(<TooltipProvider><SidebarProvider><SiteHeader applications={[]} /></SidebarProvider></TooltipProvider>);
    await userEvent.click(screen.getByRole("button", { name: "showMenu" }));
    expect(screen.getByRole("link", { name: "title" })).toHaveAttribute("href", "/search");
  });

  it("searches from the header", async () => {
    mocks.params = "q=finalen";
    render(<HeaderSearch />);
    const field = screen.getByRole("searchbox");

    expect(field).toHaveValue("finalen");
    await userEvent.clear(field);
    await userEvent.type(field, "kören{enter}");
    expect(mocks.push).toHaveBeenCalledWith("/search?q=k%C3%B6ren");
    await userEvent.clear(field);
    await userEvent.type(field, "{enter}");
    expect(mocks.push).toHaveBeenLastCalledWith("/search");
  });

  it("logs in back to the page, with its query", () => {
    mocks.pathname = "/versions/v1";
    mocks.params = "page=2";
    render(<LoginButton />);
    expect(screen.getByRole("link").getAttribute("href")).toContain(encodeURIComponent("/versions/v1?page=2"));
  });

  it("renders the about and support pages, the secondary links and small pieces", () => {
    render(
      <SidebarProvider>
        <AboutPage feedbackEmail="feedback@example.org" />
        <SupportPage supportEmail="support@example.org" />
        <NavSecondary items={[{ title: "Om", url: "/about", icon: Info }]} />
        <LinkTabs label="Vy" items={[{ href: "/a", label: "A", active: true }, { href: "/b", label: "B", active: false }]} />
        <LinkSegments label="Typ" items={[{ href: "/c", label: "C", active: false }]} />
        <DataEmpty title="Inget" description="Här finns inget" />
        <HomeSection id="s" title="Senaste" more={{ href: "/spex", label: "Alla" }}>innehåll</HomeSection>
        <Logo /><LogoHome /><LogoText />
      </SidebarProvider>,
    );
    expect(screen.getByRole("link", { name: "A" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Alla" })).toHaveAttribute("href", "/spex");
  });

  it("loads Umami only when it is configured", async () => {
    expect(await Umami()).toBeNull();
    vi.stubEnv("UMAMI_URL", "http://umami");
    vi.stubEnv("UMAMI_WEBSITE_ID", "w1");
    render(await Umami() as React.ReactElement);
    expect(document.querySelector("script[data-src='/stats/script.js']")).not.toBeNull();
  });
});
