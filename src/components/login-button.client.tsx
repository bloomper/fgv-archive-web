"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { buttonVariants } from "@/components/ui/button";

/**
 * Logs in and comes back to the page the user opened, e.g. a version linked from an email.
 */
export function LoginButton() {
  const t = useTranslations("Common");
  const pathname = usePathname();
  const params = useSearchParams();
  const here = params.size ? `${pathname}?${params}` : pathname;
  const href = here && here !== "/" ? `/api/auth/login?returnTo=${encodeURIComponent(here)}` : "/api/auth/login";

  return <a href={href} className={buttonVariants()}>{t("login")}</a>;
}
