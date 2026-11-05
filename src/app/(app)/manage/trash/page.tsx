import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getTrash } from "@/lib/admin/admin.server";
import { isAdmin } from "@/utils/auth";
import { arrangementHref, manuscriptHref, spexName, versionEditHref } from "@/utils/links";
import { Policies } from "@/utils/policy.server";
import { withPolicyPage } from "@/utils/route.server";
import { EmptyTrashButton, TrashActions } from "./trash.client";

/**
 * What is in the trash: manuscripts and arrangements (with their versions) and versions trashed on their own. Files stay
 * until an admin empties the trash or deletes an item.
 */
export default async function TrashPage() {
  return withPolicyPage(Policies.editor.requireEditor, async (authz) => {
    const t = await getTranslations("Trash");
    const trash = await getTrash();
    const admin = isAdmin(authz.roles);
    const empty = !trash || trash.manuscripts.length + trash.arrangements.length + trash.versions.length === 0;
    const list = "divide-y rounded-lg border bg-card";
    const row = "flex flex-wrap items-center justify-between gap-2 px-3 py-2";

    return (
      <div className="max-w-4xl space-y-6 p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
          {admin && !empty && <EmptyTrashButton />}
        </div>
        <p className="text-sm text-muted-foreground">{admin ? t("textAdmin") : t("text")}</p>
        {empty ? <p className="text-muted-foreground">{t("none")}</p> : (
          <>
            {trash.manuscripts.length > 0 && (
              <section className="space-y-2">
                <h2 className="text-lg font-semibold">{t("manuscripts")}</h2>
                <ul className={list}>
                  {trash.manuscripts.map(manuscript => (
                    <li key={manuscript.id} className={row}>
                      <span>
                        <Link href={manuscriptHref(manuscript.id)} className="font-medium hover:underline">{manuscript.title}</Link>
                        <span className="text-sm text-muted-foreground"> · {spexName(manuscript.spex)} · {t("versions", { count: manuscript.versions.length })}</span>
                      </span>
                      <TrashActions kind="MANUSCRIPT" id={manuscript.id} title={manuscript.title} admin={admin} />
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {trash.arrangements.length > 0 && (
              <section className="space-y-2">
                <h2 className="text-lg font-semibold">{t("arrangements")}</h2>
                <ul className={list}>
                  {trash.arrangements.map(arrangement => (
                    <li key={arrangement.id} className={row}>
                      <span>
                        <Link href={arrangementHref(arrangement.id)} className="font-medium hover:underline">{arrangement.number.title}</Link>
                        <span className="text-sm text-muted-foreground"> · {spexName(arrangement.number.spex)} · {t("versions", { count: arrangement.versions.length })}</span>
                      </span>
                      <TrashActions kind="ARRANGEMENT" id={arrangement.id} title={arrangement.number.title} admin={admin} />
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {trash.versions.length > 0 && (
              <section className="space-y-2">
                <h2 className="text-lg font-semibold">{t("versionsHeading")}</h2>
                <ul className={list}>
                  {trash.versions.map(version => {
                    const title = version.manuscript?.title ?? version.arrangement?.number.title ?? "";
                    const spex = version.manuscript?.spex ?? version.arrangement?.number.spex;

                    return (
                      <li key={version.id} className={row}>
                        <span>
                          <Link href={versionEditHref(version.id)} className="font-medium hover:underline">{title}, {version.label}</Link>
                          <span className="text-sm text-muted-foreground"> · {spexName(spex)}</span>
                        </span>
                        <TrashActions kind="VERSION" id={version.id} title={`${title}, ${version.label}`} admin={admin} />
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}
          </>
        )}
      </div>
    );
  });
}
