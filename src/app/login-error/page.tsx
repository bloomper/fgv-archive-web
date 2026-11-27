import { getTranslations } from "next-intl/server";
import { Button } from "@bloomper/fgv-web-ui/ui/button";
import { StatusPage } from "@bloomper/fgv-web-ui/shell/status-pages";

export default async function LoginErrorPage() {
  const t = await getTranslations();

  return (
    <StatusPage
      title={t("LoginError.title")}
      text={t("LoginError.text")}
      actions={
        <Button
          nativeButton={false}
          render={<a href="/api/auth/login" />}
        >
          {t("LoginError.retry")}
        </Button>
      }
    />
  );
}
