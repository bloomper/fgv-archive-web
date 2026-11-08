"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Archive,
  ClipboardList,
  Command as CommandIcon,
  Drama,
  FileQuestion,
  FileText,
  HardDrive,
  History,
  House,
  KeyRound,
  Link2,
  type LucideIcon,
  Music,
  Plus,
  Search,
  SlidersHorizontal,
  Tags,
  Trash2,
  Wrench,
} from "lucide-react";
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Role } from "@/types/auth";
import { isAdmin, isEditor } from "@/utils/auth";
import { track } from "@/utils/umami";

type PaletteEntry = {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
};

const normalize = (value: string) => value.trim().toLowerCase();

/**
 * Cmd/Ctrl+K: go to any page the sidebar has, as in Spexregister and Nyuppsättning, or search the archive for what was
 * typed. The button is for wide screens; on a phone the sidebar and the header's search do the same.
 */
export function CommandPalette({ roles }: { roles: Role[] }) {
  const t = useTranslations();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen(previous => !previous);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const { navigation, actions } = useMemo(() => {
    // In the same order as the sidebar
    const navigationEntries: PaletteEntry[] = [
      { id: "home", label: t("Nav.home"), href: "/", icon: House },
      { id: "spex", label: t("Nav.spex"), href: "/spex", icon: Archive },
      { id: "search", label: t("Nav.search"), href: "/search", icon: Search },
    ];
    const actionEntries: PaletteEntry[] = [];

    if (isEditor(roles)) {
      navigationEntries.push(
        { id: "missing", label: t("Nav.missing"), href: "/manage/missing", icon: FileQuestion },
        { id: "share-links", label: t("Nav.shareLinks"), href: "/manage/share-links", icon: Link2 },
        { id: "access-requests", label: t("Nav.accessRequests"), href: "/manage/access-requests", icon: KeyRound },
        { id: "trash", label: t("Nav.trash"), href: "/manage/trash", icon: Trash2 },
        { id: "audit", label: t("Nav.auditLog"), href: "/manage/audit", icon: History }
      );
      actionEntries.push({
        id: "new-manuscript",
        label: t("Nav.newManuscript"),
        href: "/manage/manuscripts/new",
        icon: Plus,
      });
    }
    if (isAdmin(roles)) {
      navigationEntries.push(
        { id: "admin-settings", label: t("Nav.adminSettings"), href: "/admin/settings", icon: SlidersHorizontal },
        { id: "admin-instruments", label: t("Nav.adminInstruments"), href: "/admin/instruments", icon: Music },
        { id: "admin-file-roles", label: t("Nav.adminFileRoles"), href: "/admin/file-roles", icon: Tags },
        { id: "admin-share-links", label: t("Nav.adminShareLinks"), href: "/admin/share-links", icon: FileText },
        { id: "admin-storage", label: t("Nav.adminStorage"), href: "/admin/storage", icon: HardDrive },
        { id: "admin-maintenance", label: t("Nav.adminMaintenance"), href: "/admin/maintenance", icon: ClipboardList }
      );
    }
    navigationEntries.push(
      { id: "support", label: t("Support.title"), href: "/support", icon: Wrench },
      { id: "about", label: t("About.title"), href: "/about", icon: Drama }
    );

    return { navigation: navigationEntries, actions: actionEntries };
  }, [roles, t]);

  const term = normalize(query);
  const matching = (entries: PaletteEntry[]) =>
    term ? entries.filter(entry => normalize(entry.label).includes(term)) : entries;
  const matchingNavigation = matching(navigation);
  const matchingActions = matching(actions);

  const go = (id: string, href: string) => {
    track("command-palette", { target: id });
    setOpen(false);
    setQuery("");
    router.push(href);
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="hidden h-8 gap-2 md:inline-flex"
        onClick={() => setOpen(true)}
        aria-label={t("CommandPalette.open")}
      >
        <CommandIcon className="h-4 w-4" />
        <span className="hidden text-xs text-muted-foreground lg:inline">{t("CommandPalette.hint")}</span>
      </Button>

      <Dialog
        open={open}
        onOpenChange={setOpen}
      >
        <DialogContent
          className="overflow-hidden p-0"
          showCloseButton={false}
        >
          <DialogTitle className="sr-only">{t("CommandPalette.title")}</DialogTitle>
          <DialogDescription className="sr-only">{t("CommandPalette.description")}</DialogDescription>
          <Command shouldFilter={false}>
            <CommandInput
              placeholder={t("CommandPalette.placeholder")}
              value={query}
              onValueChange={setQuery}
            />
            <CommandList>
              {term && (
                <CommandGroup heading={t("CommandPalette.search")}>
                  <CommandItem
                    value="search-archive"
                    onSelect={() => go("search-archive", `/search?q=${encodeURIComponent(query.trim())}`)}
                  >
                    <Search />
                    <span>{t("CommandPalette.searchFor", { query: query.trim() })}</span>
                  </CommandItem>
                </CommandGroup>
              )}

              {matchingNavigation.length > 0 && (
                <CommandGroup heading={t("CommandPalette.navigation")}>
                  {matchingNavigation.map(entry => (
                    <CommandItem
                      key={entry.id}
                      value={entry.id}
                      onSelect={() => go(entry.id, entry.href)}
                    >
                      <entry.icon />
                      <span>{entry.label}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {matchingActions.length > 0 && (
                <CommandGroup heading={t("CommandPalette.create")}>
                  {matchingActions.map(entry => (
                    <CommandItem
                      key={entry.id}
                      value={entry.id}
                      onSelect={() => go(entry.id, entry.href)}
                    >
                      <entry.icon />
                      <span>{entry.label}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  );
}
