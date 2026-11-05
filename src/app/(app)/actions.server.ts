"use server";

import { accessRequestCreate } from "@/lib/archive/editing.server";
import { type ActionResult, toActionResult } from "@/lib/graphql.server";
import { ID } from "@/utils/filters";
import { Policies } from "@/utils/policy.server";
import { withPolicyAction } from "@/utils/route.server";

/**
 * Asks the editors by email for access to restricted files, with the user's reason.
 */
export async function accessRequestAction(fileIds: string[], reason: string): Promise<ActionResult<null>> {
  if (fileIds.length === 0 || fileIds.length > 200 || !fileIds.every(id => ID.test(id))) {
    throw new Error("Invalid files");
  }

  const text = reason.trim();

  if (!text || text.length > 2000) {
    throw new Error("Invalid reason");
  }
  return withPolicyAction(Policies.app.requireAccess, () => toActionResult(async () => {
    await accessRequestCreate({ fileIds, reason: text });
    return null;
  }));
}
