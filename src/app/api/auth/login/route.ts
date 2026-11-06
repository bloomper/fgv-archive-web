import { NextRequest } from "next/server";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { normalizeLocale } from "@/utils/utils.server";
import { normalizeTheme } from "@/utils/auth";

export const GET = async (req: NextRequest) => {
  const cookieLocale = req.cookies.get("locale")?.value;
  const locale = normalizeLocale(cookieLocale);

  const cookieTheme = req.cookies.get("theme")?.value;
  const theme = normalizeTheme(cookieTheme);

  const { url } = await auth.api.signInSocial({
    body: {
      provider: "keycloak",
      callbackURL: returnTo(req.nextUrl.searchParams.get("returnTo")),
      additionalParams: {
        ui_locales: locale,
        ...(theme ? { theme } : {}),
      },
    },
  });

  if (!url) {
    throw new Error("Keycloak did not return an authorization URL");
  }

  redirect(url);
};

/**
 * Where to go after logging in: a path of this application only, e.g. the version an access request email links to.
 */
function returnTo(value: string | null): string {
  return value && /^\/(?![/\\])[^\s]*$/.test(value) && !value.startsWith("/api/") ? value : "/";
}
