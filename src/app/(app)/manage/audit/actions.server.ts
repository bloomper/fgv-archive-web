"use server";

import { getAuditLog } from "@/lib/admin/admin.server";
import { Policies } from "@/utils/policy.server";
import { withPolicyAction } from "@/utils/route.server";
import { isAdmin } from "@/utils/auth";
import { type AuditPage, type AuditSearch, auditSearchOf, toAuditFilter, toAuditRows } from "@/utils/audit";
import { auditLink } from "./links";

const PATH = "/manage/audit";
const MAX_PAGE = 10_000;

/**
 * A further page of the change log, for "Load more": the same filter as the page, the person only for admins.
 */
export async function loadAuditPage(search: AuditSearch, page: number, size: number): Promise<AuditPage> {
  return withPolicyAction(Policies.editor.requireEditor, async authz => {
    if (!Number.isInteger(page) || page < 0 || page > MAX_PAGE || !Number.isInteger(size) || size < 1 || size > 50) {
      throw new Error("Invalid page");
    }

    const filter = auditSearchOf(search);
    const log = await getAuditLog(page, size, toAuditFilter(filter, isAdmin(authz.roles)));

    return {
      rows: toAuditRows(log?.entries ?? [], PATH, auditLink, !filter.entity),
      totalCount: log?.totalCount ?? 0,
    };
  });
}
