import { getTranslations } from "next-intl/server";
import { getFileRoles } from "@/lib/archive/archive.server";
import { Policies } from "@/utils/policy.server";
import { withPolicyPage } from "@/utils/route.server";
import { FileRolesEditor } from "./file-roles-editor.client";
import { Page, PageHeader } from "@bloomper/fgv-web-ui/shell/page-header";

export default async function FileRolesPage() {
  return withPolicyPage(Policies.admin.requireAdmin, async () => {
    const t = await getTranslations("AdminFileRoles");
    const roles = await getFileRoles();

    return (
      <Page
        variant="content"
        className="max-w-3xl"
      >
        <PageHeader
          title={t("title")}
          description={t("text")}
        />
        <FileRolesEditor roles={roles.map((role) => ({ ...role, fileCount: role.fileCount ?? 0 }))} />
      </Page>
    );
  });
}
