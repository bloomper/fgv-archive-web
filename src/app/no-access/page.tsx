import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/logout-button.client";
import { requireUser } from "@/utils/auth.server";
import { hasAccess } from "@/utils/auth";
import { NoAccessPage as FgvNoAccessPage } from "@bloomper/fgv-web-ui/shell/status-pages";

/**
 * Shown to someone who is logged in without the `USER` role on `fgv-archive`.
 */
export default async function NoAccessPage() {
  const { session, roles } = await requireUser();

  if (!session || hasAccess(roles)) {
    redirect("/");
  }

  return (
    <FgvNoAccessPage email={session.user.email} application="archive" actions={<LogoutButton variant="default" />} />
  );
}
