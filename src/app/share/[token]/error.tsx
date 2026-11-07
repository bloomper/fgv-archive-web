"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

/**
 * A share link page that failed, e.g. while the server is away, inside the share layout. Without the app's "Log in": a
 * share link's visitor need not have an account.
 */
export default function ShareError({ error, reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("Error");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60dvh] items-center justify-center p-6">
      <div className="mx-auto max-w-md space-y-4 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("text")}</p>
        <Button onClick={() => reset()}>{t("retry")}</Button>
      </div>
    </div>
  );
}
