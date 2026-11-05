import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { LogoutButton } from "@/components/logout-button.client";
import { requireUser } from "@/utils/auth.server";
import { hasAccess } from "@/utils/auth";

/**
 * Shown to someone who is logged in without the `USER` role on `fgv-archive`.
 */
export default async function NoAccessPage() {
  const { session, roles } = await requireUser();

  if (!session || hasAccess(roles)) {
    redirect("/");
  }

  const t = await getTranslations();

  return (
    <div className="flex min-h-dvh flex-1 items-center justify-center p-6">
      <div className="mx-auto max-w-md space-y-4 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("NoAccess.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("NoAccess.text", { email: session.user.email })}
        </p>
        <div className="flex justify-center gap-2 pt-2">
          <LogoutButton variant="default" />
        </div>
      </div>
    </div>
  );
}
