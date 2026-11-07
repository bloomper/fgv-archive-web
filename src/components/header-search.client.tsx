"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Search across spex, manuscripts, arrangements and files; opens the search page. On a phone the header has no room for
 * the field next to the application's name, so it is a button to the search page, which has a field of its own.
 */
export function HeaderSearch() {
  const t = useTranslations("Search");
  const router = useRouter();
  const params = useSearchParams();
  const q = params.get("q") ?? "";

  return (
    <>
      <Link href="/search" aria-label={t("title")} title={t("title")}
            className={buttonVariants({ variant: "ghost", size: "icon", className: "h-8 w-8 sm:hidden" })}>
        <Search />
      </Link>
      <form role="search" className="relative hidden sm:block" onSubmit={event => {
        event.preventDefault();

        const value = new FormData(event.currentTarget).get("q")?.toString().trim() ?? "";

        router.push(value ? `/search?q=${encodeURIComponent(value)}` : "/search");
      }}>
        <Search className="pointer-events-none absolute top-1/2 left-2 size-4 -translate-y-1/2 text-muted-foreground" />
        {/* Keyed by the address' query, so that the field follows a search made on the search page itself */}
        <Input key={q} name="q" type="search" defaultValue={q} placeholder={t("placeholder")}
               aria-label={t("placeholder")} className="h-8 w-48 pl-8 md:w-64" />
      </form>
    </>
  );
}
