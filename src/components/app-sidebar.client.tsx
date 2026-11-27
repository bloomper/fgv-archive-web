"use client";

import * as React from "react";
import { useMemo } from "react";
import {
  Archive,
  Drama,
  House,
  Library,
  type LucideIcon,
  Pencil,
  Search,
  Settings,
  Wrench,
} from "lucide-react";

import { NavMain } from "@bloomper/fgv-web-ui/shell/nav-main";
import { NavSecondary, SidebarBrand } from "@bloomper/fgv-web-ui/shell/sidebar-parts";
import { NavUser } from "@/components/nav-user.client";
import { Sidebar, SidebarContent, SidebarFooter, useSidebar } from "@bloomper/fgv-web-ui/ui/sidebar";
import { Role } from "@/types/auth";
import { isAdmin, isEditor } from "@/utils/auth";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useIsClient } from "@bloomper/fgv-web-ui/hooks/use-is-client";
import { type DocumentKindBrief, kindIcon } from "@/utils/document-kinds";
import { documentsHref } from "@/utils/links";

interface NavLink {
  title: string;
  url: string;
  icon?: LucideIcon;
  isActive?: boolean;
  items?: NavLink[];
}

/** A group without an address only opens and closes its entries. */
interface NavItem extends Omit<NavLink, "url"> {
  url?: string;
}

interface NavSecondaryItem extends Omit<NavLink, "icon"> {
  icon: LucideIcon;
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  roles: Role[];
  accountUrl: string;
  /** The document kinds for the menu, in order (menuKinds). */
  documentKinds?: DocumentKindBrief[];
}

export function AppSidebar({ roles, accountUrl, documentKinds = [], ...props }: AppSidebarProps) {
  const pathname = usePathname();
  const t = useTranslations();
  const locale = useLocale();
  const isClient = useIsClient();
  const { isMobile, setOpenMobile } = useSidebar();

  const closeOnNavigate = (event: React.MouseEvent) => {
    if (isMobile && (event.target as Element).closest("a")) {
      setOpenMobile(false);
    }
  };

  const navigation = useMemo((): { main: NavItem[]; secondary: NavSecondaryItem[] } => {
    const mainItems: NavItem[] = [
      { title: t("Nav.home"), url: "/", icon: House, isActive: pathname === "/" },
      { title: t("Nav.search"), url: "/search", icon: Search, isActive: pathname.startsWith("/search") },
      { title: t("Nav.spex"), url: "/spex", icon: Archive, isActive: pathname.startsWith("/spex") },
    ];

    const kindItems = documentKinds
      .map(kind => ({ title: kind.name, url: documentsHref(kind.id), icon: kindIcon(kind) }))
      .sort((a, b) => a.title.localeCompare(b.title, locale));

    if (kindItems.length > 0) {
      mainItems.push({
        title: t("Nav.documents"),
        icon: Library,
        isActive: pathname.startsWith("/documents/"),
        items: kindItems,
      });
    }

    if (isEditor(roles)) {
      mainItems.push({
        title: t("Nav.manage"),
        icon: Pencil,
        isActive: pathname.startsWith("/manage"),
        items: [
          { title: t("Nav.newManuscript"), url: "/manage/manuscripts/new" },
          { title: t("Nav.missing"), url: "/manage/missing" },
          { title: t("Nav.shareLinks"), url: "/manage/share-links" },
          { title: t("Nav.accessRequests"), url: "/manage/access-requests" },
          { title: t("Nav.trash"), url: "/manage/trash" },
          { title: t("Nav.auditLog"), url: "/manage/audit" },
        ],
      });
    }

    if (isAdmin(roles)) {
      mainItems.push({
        title: t("Nav.admin"),
        icon: Settings,
        isActive: pathname.startsWith("/admin/"),
        items: [
          { title: t("Nav.adminSettings"), url: "/admin/settings" },
          { title: t("Nav.adminInstruments"), url: "/admin/instruments" },
          { title: t("Nav.adminDocumentKinds"), url: "/admin/document-kinds" },
          { title: t("Nav.adminFileRoles"), url: "/admin/file-roles" },
          { title: t("Nav.adminShareLinks"), url: "/admin/share-links" },
          { title: t("Nav.adminStorage"), url: "/admin/storage" },
          { title: t("Nav.adminMaintenance"), url: "/admin/maintenance" },
        ],
      });
    }

    return {
      main: mainItems,
      secondary: [
        {
          title: t("Support.title"),
          url: "/support",
          icon: Wrench,
        },
        {
          title: t("About.title"),
          url: "/about",
          icon: Drama,
        },
      ],
    };
  }, [roles, pathname, t, locale, documentKinds]);

  return (
    <Sidebar collapsible="icon"
             className="top-(--header-height) h-[calc(100svh-var(--header-height))]!"
             {...props}
    >
      <SidebarBrand />
      <SidebarContent onClickCapture={closeOnNavigate}>
        {isClient ? (
          <>
            <NavMain items={navigation.main} />
            <NavSecondary items={navigation.secondary} className="mt-auto" />
          </>
        ) : (
          <div className="flex flex-col gap-2 p-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-2 py-1.5">
                <div className="size-4 shrink-0 animate-pulse rounded bg-sidebar-accent/50" />
                <div
                  className="h-3 w-24 animate-pulse rounded bg-sidebar-accent/50 group-data-[collapsible=icon]:hidden" />
              </div>
            ))}
          </div>
        )}
      </SidebarContent>
      <SidebarFooter onClickCapture={closeOnNavigate}>
        {isClient && <NavUser accountUrl={accountUrl} />}
      </SidebarFooter>
    </Sidebar>
  );
}
