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
      <div className="max-w-3xl flex flex-1 flex-col gap-6 p-4 md:p-8">
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("text")}</p>
        <FileRolesEditor roles={roles.map(role => ({ ...role, fileCount: role.fileCount ?? 0 }))} />
      </div>
    );
  });
}
