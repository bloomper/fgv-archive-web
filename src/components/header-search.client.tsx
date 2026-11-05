"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

/**
 * Search across albums, tracks, performers, melodies and lyrics; opens the search page.
 */
export function HeaderSearch() {
  const t = useTranslations("Search");
  const router = useRouter();
  const params = useSearchParams();

  return (
    <form role="search" className="relative" onSubmit={event => {
      event.preventDefault();

      const q = new FormData(event.currentTarget).get("q")?.toString().trim() ?? "";

      router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
    }}>
      <Search className="pointer-events-none absolute top-1/2 left-2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input name="q" type="search" defaultValue={params.get("q") ?? ""} placeholder={t("placeholder")}
             aria-label={t("placeholder")} className="h-8 w-36 pl-8 sm:w-64" />
    </form>
  );
}
