"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { buttonVariants } from "@/components/ui/button";
import { loginHref } from "@/utils/auth";

/**
 * Logs in and comes back to the page the user opened, e.g. a version linked from an email.
 */
export function LoginButton() {
  const t = useTranslations("Common");
  const pathname = usePathname();
  const params = useSearchParams();
  const here = params.size ? `${pathname}?${params}` : pathname;

  return <a href={loginHref(here)} className={buttonVariants()}>{t("login")}</a>;
}
