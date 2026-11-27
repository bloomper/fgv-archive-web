"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@bloomper/fgv-web-ui/ui/button";

export default function AppError({ error, retry }: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const t = useTranslations();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="mx-auto max-w-md space-y-4 text-center">
        <h1 className="text-2xl font-bold tracking-tight">
          {t("Error.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("Error.text")}
        </p>
        <div className="flex justify-center gap-2 pt-2">
          <Button onClick={() => retry()}>{t("Error.retry")}</Button>
          <Button variant="outline" nativeButton={false}
                  render={<a href="/api/auth/login" />}>{t("Common.login")}</Button>
        </div>
      </div>
    </div>
  );
}
