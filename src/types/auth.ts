export type Role = "USER" | "EDITOR" | "ADMIN";

export type AuthzFail = { ok: false; status: 401 | 403; message: string };
export type AuthzOk = { ok: true; roles: Role[] };
export type AuthzResult = AuthzOk | AuthzFail;

export type AccessTokenClaims = {
  resource_access?: {
    "fgv-archive"?: {
      roles?: string[];
    };
    [resource: string]:
      | {
      roles?: string[];
    }
      | undefined;
  };
};
