import { getTranslations } from "next-intl/server";
import { getFileRoles } from "@/lib/archive/archive.server";
import { Policies } from "@/utils/policy.server";
import { withPolicyPage } from "@/utils/route.server";
import { FileRolesEditor } from "./file-roles-editor.client";

export default async function FileRolesPage() {
  return withPolicyPage(Policies.admin.requireAdmin, async () => {
    const t = await getTranslations("AdminFileRoles");
    const roles = await getFileRoles();

    return (
      <div className="max-w-3xl space-y-6 p-4 sm:p-6">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("text")}</p>
        <FileRolesEditor roles={roles.map(role => ({ ...role, fileCount: role.fileCount ?? 0 }))} />
      </div>
    );
  });
}
