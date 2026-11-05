import { notFound, redirect } from "next/navigation";
import { getVersion } from "@/lib/archive/archive.server";
import { ID } from "@/utils/filters";
import { versionHref } from "@/utils/links";
import { Policies } from "@/utils/policy.server";
import { withPolicyPage } from "@/utils/route.server";

/**
 * A version's own address, e.g. in the emails about access requests: the version in its manuscript's or arrangement's
 * page.
 */
export default async function VersionPage({ params }: { params: Promise<{ id: string }> }) {
  return withPolicyPage(Policies.app.requireAccess, async () => {
    const { id } = await params;
    const version = ID.test(id) ? await getVersion(id) : null;

    if (!version) {
      notFound();
    }
    redirect(versionHref(version));
  });
}
