import "server-only";

import { requireAnyRole } from "@/utils/auth.server";
import { AuthzResult } from "@/types/auth";

/**
 * Page and action guards by role. They only decide which pages to show; the server enforces every rule.
 */
export const Policies = {
  app: {
    async requireAccess(): Promise<AuthzResult> {
      return requireAnyRole(["USER"]);
    },
  },
  editor: {
    async requireEditor(): Promise<AuthzResult> {
      const access = await requireAnyRole(["USER"]);

      return access.ok ? requireAnyRole(["EDITOR", "ADMIN"]) : access;
    },
  },
  admin: {
    async requireAdmin(): Promise<AuthzResult> {
      const access = await requireAnyRole(["USER"]);

      return access.ok ? requireAnyRole(["ADMIN"]) : access;
    },
  },
} as const;
