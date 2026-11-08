import type { Metadata } from "next";
import * as React from "react";
import { Logo } from "@/components/logo";
import { LogoText } from "@/components/logo-text";
import { LanguageToggle } from "@/components/language-toggle.client";
import { ModeToggle } from "@/components/mode-toggle.client";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

/**
 * A share link's own layout: FGV's logo, the application's name and the language and theme, nothing else of the archive. No login, no
 * sidebar or application switcher, and no visitor statistics (the tracker is only in the (app) layout).
 */
export default function ShareLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col [--header-height:calc(--spacing(14))]">
      <header className="sticky top-0 z-40 flex h-(--header-height) items-center justify-between gap-3 border-b bg-background px-4 print:hidden">
        <div className="flex min-w-0 items-center gap-3">
          <div className="size-9 shrink-0"><Logo /></div>
          <LogoText className="hidden h-9 w-auto text-foreground sm:block" />
          <span className="truncate text-base font-semibold">Spexarkiv</span>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <LanguageToggle />
          <ModeToggle />
        </div>
      </header>
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
