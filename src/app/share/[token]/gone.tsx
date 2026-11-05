import { getTranslations } from "next-intl/server";
import { LinkIcon } from "lucide-react";

/**
 * An expired or revoked share link, or none at all, naming who made it so the visitor knows whom to ask.
 */
export async function SharedGone({ status, createdByName }: { status: "EXPIRED" | "REVOKED" | "UNKNOWN"; createdByName?: string | null }) {
  const t = await getTranslations("SharePage");

  return (
    <div className="flex min-h-[60dvh] items-center justify-center p-6">
      <div className="max-w-md space-y-3 text-center" data-testid="share-gone">
        <LinkIcon className="mx-auto size-8 text-muted-foreground" aria-hidden />
        <h1 className="text-2xl font-semibold tracking-tight">{t(`gone.${status}.title`)}</h1>
        <p className="text-muted-foreground">
          {createdByName ? t(`gone.${status}.textBy`, { name: createdByName }) : t(`gone.${status}.text`)}
        </p>
      </div>
    </div>
  );
}
