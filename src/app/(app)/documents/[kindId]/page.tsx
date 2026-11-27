import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { FilePlus } from "lucide-react";
import { Badge } from "@bloomper/fgv-web-ui/ui/badge";
import { buttonVariants } from "@bloomper/fgv-web-ui/ui/button";
import { DataEmpty } from "@bloomper/fgv-web-ui/shell/data-empty";
import { getDocumentKinds, getKindDocuments } from "@/lib/archive/archive.server";
import { isEditor } from "@/utils/auth";
import { groupBySpex, kindIcon } from "@/utils/document-kinds";
import { ID } from "@/utils/filters";
import { manuscriptHref, newDocumentHref, spexHref, spexName } from "@/utils/links";
import { Policies } from "@/utils/policy.server";
import { withPolicyPage } from "@/utils/route.server";
import { Page, PageHeader } from "@bloomper/fgv-web-ui/shell/page-header";

/**
 * The documents of a kind across every spex, grouped by spex, newest spex first, and FGV's own, of no spex, last.
 */
export default async function DocumentsPage({ params }: { params: Promise<{ kindId: string }> }) {
  return withPolicyPage(Policies.app.requireAccess, async (authz) => {
    const { kindId } = await params;
    const [kinds, documents] = ID.test(kindId)
      ? await Promise.all([getDocumentKinds(true), getKindDocuments(kindId)])
      : [[], []];
    const kind = kinds.find((candidate) => candidate.id === kindId);

    if (!kind) {
      notFound();
    }

    const t = await getTranslations("DocumentsPage");
    const editor = isEditor(authz.roles);
    const groups = groupBySpex(documents);
    const Icon = kindIcon(kind);

    return (
      <Page variant="content">
        <PageHeader
          title={kind.name}
          badges={kind.retired && <Badge variant="secondary">{t("retired")}</Badge>}
          description={t("count", { count: documents.length })}
          actions={
            editor &&
            !kind.retired && (
              <Link
                href={newDocumentHref({ kindId: kind.id })}
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                <FilePlus /> {t("new")}
              </Link>
            )
          }
        />

        {groups.length === 0 ? (
          <DataEmpty
            title={t("none")}
            description={null}
            icon={Icon}
          />
        ) : (
          groups.map((group) => {
            const heading = group.spex ? spexName(group.spex) : t("own");
            const headingId = `group-${group.spex?.id ?? "own"}`;

            return (
              <section
                key={group.spex?.id ?? ""}
                aria-labelledby={headingId}
                className="space-y-2"
              >
                <h2
                  id={headingId}
                  className="text-lg font-semibold"
                >
                  {group.spex ? (
                    <Link
                      href={spexHref(group.spex.id)}
                      className="hover:text-link"
                    >
                      {heading}
                    </Link>
                  ) : (
                    heading
                  )}
                </h2>
                <ul className="bg-card divide-y overflow-hidden rounded-lg border">
                  {group.documents.map((document) => (
                    <li
                      key={document.id}
                      className="link-row px-3 py-2"
                    >
                      <Link
                        href={manuscriptHref(document.id)}
                        className="row-link flex items-center gap-2 font-medium"
                      >
                        <Icon
                          className="text-link size-4 shrink-0"
                          aria-hidden
                        />{" "}
                        {document.title}
                        {document.trashed && <Badge variant="destructive">{t("trashed")}</Badge>}
                      </Link>
                      {document.authors && <p className="text-muted-foreground text-sm">{document.authors}</p>}
                    </li>
                  ))}
                </ul>
              </section>
            );
          })
        )}
      </Page>
    );
  });
}
