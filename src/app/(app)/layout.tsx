import * as React from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AppSidebar } from "@/components/app-sidebar.client";
import { SiteHeader } from "@/components/site-header.client";
import { getApplications } from "@/utils/applications.server";
import { SidebarInset, SidebarProvider } from "@bloomper/fgv-web-ui/ui/sidebar";
import { LoginButton } from "@/components/login-button.client";
import { Logo } from "@bloomper/fgv-web-ui/shell/logo";
import { LogoHome } from "@bloomper/fgv-web-ui/shell/logo-home";
import { LogoText } from "@bloomper/fgv-web-ui/shell/logo-text";
import { ModeToggle } from "@bloomper/fgv-web-ui/shell/toggles";
import { LanguageToggle } from "@bloomper/fgv-web-ui/shell/toggles";
import { DialogsProvider } from "@bloomper/fgv-web-ui/shell/dialogs";
import { requireUser } from "@/utils/auth.server";
import { hasAccess, RETURN_TO_HEADER, silentLoginHref, SSO_CHECKED_COOKIE } from "@/utils/auth";
import { Umami } from "@/components/umami";
import { getDocumentKinds } from "@/lib/archive/archive.server";
import { menuKinds } from "@/utils/document-kinds";

export const instant = false;

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { session, roles } = await requireUser();
  const t = await getTranslations();

  if (!session) {
    // Someone logged in to another FGV application gets in without pressing the login button
    if (!(await cookies()).has(SSO_CHECKED_COOKIE)) {
      redirect(silentLoginHref((await headers()).get(RETURN_TO_HEADER)));
    }

    return (
      <div className="bg-background flex min-h-dvh flex-col">
        <header className="px-4 py-2">
          <div className="flex w-full flex-nowrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center justify-start gap-3">
              <a
                href="https://www.fgv.nu"
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-nowrap items-center gap-3"
              >
                <div className="flex aspect-square size-10 items-center justify-center rounded-lg">
                  <Logo />
                </div>
                <div className="min-w-0 overflow-hidden">
                  <LogoText className="text-foreground h-10 w-auto" />
                </div>
              </a>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <LanguageToggle />
              <ModeToggle />
            </div>
          </div>
        </header>

        <main className="flex flex-1 items-center">
          <div className="mx-auto w-full max-w-5xl px-4 py-10">
            <div className="space-y-4 text-center">
              <div className="mx-auto flex justify-center">
                <div className="text-foreground h-20 w-20 sm:h-24 sm:w-24">
                  <LogoHome />
                </div>
              </div>

              <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">{t("Home.title")}</h1>

              <p className="text-muted-foreground mx-auto mt-3 max-w-prose text-sm">{t("Home.mustBeLoggedIn")}</p>

              <div className="pt-2">
                <React.Suspense>
                  <LoginButton />
                </React.Suspense>
              </div>
            </div>
          </div>
        </main>
        <React.Suspense>
          <Umami />
        </React.Suspense>
      </div>
    );
  }

  if (!hasAccess(roles)) {
    redirect("/no-access");
  }

  const accountUrl = `${(process.env.KEYCLOAK_ISSUER ?? "").replace(/\/$/, "")}/account`;
  const [applications, allKinds] = await Promise.all([
    getApplications(),
    // The menu has an entry per document kind; without them the pages still work
    getDocumentKinds(true).catch(() => []),
  ]);
  const documentKinds = menuKinds(allKinds, roles).map(
    ({ id, name, nameSv, nameEn, aliases, retired, documentCount }) => ({
      id,
      name,
      nameSv,
      nameEn,
      aliases,
      retired,
      documentCount,
    })
  );

  return (
    <div className="[--header-height:calc(--spacing(14))]">
      <DialogsProvider>
        <SidebarProvider className="flex flex-col">
          <SiteHeader
            applications={applications}
            roles={roles}
            documentKinds={documentKinds}
          />
          <div className="flex flex-1">
            <AppSidebar
              roles={roles}
              accountUrl={accountUrl}
              documentKinds={documentKinds}
            />
            <SidebarInset className="min-w-0">{children}</SidebarInset>
          </div>
        </SidebarProvider>
      </DialogsProvider>
      <React.Suspense>
        <Umami />
      </React.Suspense>
    </div>
  );
}
