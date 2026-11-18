import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { FilePlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { DataEmpty } from "@/components/data-empty";
import { getDocumentKinds, getKindDocuments } from "@/lib/archive/archive.server";
import { isEditor } from "@/utils/auth";
import { groupBySpex, kindIcon } from "@/utils/document-kinds";
import { ID } from "@/utils/filters";
import { manuscriptHref, newDocumentHref, spexHref, spexName } from "@/utils/links";
import { Policies } from "@/utils/policy.server";
import { withPolicyPage } from "@/utils/route.server";

/**
 * The documents of a kind across every spex, grouped by spex, newest spex first, and FGV's own, of no spex, last.
 */
export default async function DocumentsPage({ params }: { params: Promise<{ kindId: string }> }) {
  return withPolicyPage(Policies.app.requireAccess, async (authz) => {
    const { kindId } = await params;
    const [kinds, documents] = ID.test(kindId)
      ? await Promise.all([getDocumentKinds(true), getKindDocuments(kindId)])
      : [[], []];
    const kind = kinds.find(candidate => candidate.id === kindId);

    if (!kind) {
      notFound();
    }

    const t = await getTranslations("DocumentsPage");
    const editor = isEditor(authz.roles);
    const groups = groupBySpex(documents);
    const Icon = kindIcon(kind);

    return (
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-8">
        <header className="space-y-2">
          <h1 className="flex flex-wrap items-center gap-2 text-2xl font-bold tracking-tight">
            {kind.name} {kind.retired && <Badge variant="secondary">{t("retired")}</Badge>}
          </h1>
          <p className="text-sm text-muted-foreground">{t("count", { count: documents.length })}</p>
          {editor && !kind.retired && (
            <Link href={newDocumentHref({ kindId: kind.id })} className={buttonVariants({ variant: "outline", size: "sm" })}>
              <FilePlus /> {t("new")}
            </Link>
          )}
        </header>

        {groups.length === 0 ? <DataEmpty title={t("none")} description={null} icon={Icon} /> : groups.map(group => {
          const heading = group.spex ? spexName(group.spex) : t("own");
          const headingId = `group-${group.spex?.id ?? "own"}`;

          return (
            <section key={group.spex?.id ?? ""} aria-labelledby={headingId} className="space-y-2">
              <h2 id={headingId} className="text-lg font-semibold">
                {group.spex
                  ? <Link href={spexHref(group.spex.id)} className="hover:text-primary">{heading}</Link>
                  : heading}
              </h2>
              <ul className="divide-y overflow-hidden rounded-lg border bg-card">
                {group.documents.map(document => (
                  <li key={document.id} className="link-row px-3 py-2">
                    <Link href={manuscriptHref(document.id)} className="row-link flex items-center gap-2 font-medium">
                      <Icon className="size-4 shrink-0 text-primary" aria-hidden /> {document.title}
                      {document.trashed && <Badge variant="destructive">{t("trashed")}</Badge>}
                    </Link>
                    {document.authors && <p className="text-sm text-muted-foreground">{document.authors}</p>}
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    );
  });
}
