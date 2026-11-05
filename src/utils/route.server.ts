import "server-only";

import type { AuthzOk, AuthzResult } from "@/types/auth";
import { forbidden, redirect } from "next/navigation";
import { requireUser } from "@/utils/auth.server";
import { hasAccess } from "@/utils/auth";

const LOGIN_PATH = "/api/auth/login";
const NO_ACCESS_PATH = "/no-access";

export async function withPolicyAction<T>(
  policy: () => Promise<AuthzResult>,
  handler: (authz: AuthzOk) => Promise<T>,
): Promise<T> {
  const authz = await policy();
  if (!authz.ok) {
    if (authz.status === 401) {
      redirect(LOGIN_PATH);
    }
    throw new Error(authz.message);
  }
  return handler(authz);
}

/**
 * As {@link withPolicyAction}, but a user who is logged in without access to Spexarkivet at all is sent to the
 * no-access page, and one who lacks the page's role gets the forbidden page instead of an error.
 */
export async function withPolicyPage<T>(
  policy: () => Promise<AuthzResult>,
  handler: (authz: AuthzOk) => Promise<T>,
): Promise<T> {
  const authz = await policy();
  if (!authz.ok && authz.status === 403 && !hasAccess((await requireUser()).roles)) {
    redirect(NO_ACCESS_PATH);
  }
  if (!authz.ok && authz.status === 403) {
    forbidden();
  }
  return withPolicyAction(async () => authz, handler);
}
