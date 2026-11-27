"use client";

import { SiteHeader as FgvSiteHeader } from "@bloomper/fgv-web-ui/shell/site-header";
import type { Application } from "@bloomper/fgv-web-ui/shell/applications";
import { LanguageToggle, ModeToggle } from "@bloomper/fgv-web-ui/shell/toggles";
import { HeaderSearch } from "@/components/header-search.client";
import { CommandPalette } from "@/components/command-palette.client";
import type { Role } from "@/types/auth";
import type { DocumentKindBrief } from "@/utils/document-kinds";

/**
 * The FGV header with Spexarkiv's own controls: search and the command palette.
 */
export function SiteHeader({
  applications,
  roles,
  documentKinds = [],
}: {
  applications: Application[];
  roles: Role[];
  documentKinds?: DocumentKindBrief[];
}) {
  return (
    <FgvSiteHeader
      applications={applications}
      actions={
        <>
          <HeaderSearch />
          <CommandPalette
            roles={roles}
            documentKinds={documentKinds}
          />
          <LanguageToggle />
          <ModeToggle />
        </>
      }
    />
  );
}
