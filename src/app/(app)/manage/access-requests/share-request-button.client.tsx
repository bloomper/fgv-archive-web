"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Mail } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ShareLinkButton } from "@/components/archive/share-link-dialog.client";
import { handleAccessRequestAction } from "@/app/(app)/manage/actions.server";

/**
 * Answers an access request with a share link for exactly the requested files, named after the person. Once the link
 * is made, the dialog offers an email to them with the address, and marks the request handled when it closes (unless
 * the editor unticks it).
 */
export function ShareRequestButton({ id, name, email, fileIds, handled, maxMonths }: {
  id: string;
  name: string | null;
  email: string | null;
  fileIds: string[];
  handled: boolean;
  maxMonths: number;
}) {
  const t = useTranslations("AccessRequests");
  const router = useRouter();
  const [markHandled, setMarkHandled] = useState(true);
  const who = name ?? email ?? "";

  const done = async () => {
    if (handled || !markHandled) {
      return;
    }

    const result = await handleAccessRequestAction(id, true);

    if (result.ok) {
      toast.success(t("handledDone"));
      router.refresh();
    } else {
      toast.error(result.message);
    }
  };

  return (
    <ShareLinkButton input={{ fileIds }} defaultName={t("shareName", { name: who })} maxMonths={maxMonths} size="xs"
                     label={t("share")} disabled={fileIds.length === 0} onDone={() => void done()}
                     afterCreate={(url, months) => (
                       <div className="grid gap-3">
                         {email && (
                           <a className={buttonVariants({ variant: "outline", className: "justify-self-start" })}
                              href={`mailto:${email}?subject=${encodeURIComponent(t("mailSubject"))}&body=${encodeURIComponent(t("mailBody", { name: who, url, months }))}`}>
                             <Mail /> {t("mail", { name: who })}
                           </a>
                         )}
                         {!handled && (
                           <label className="flex items-center gap-2 text-sm">
                             <Checkbox checked={markHandled} onCheckedChange={checked => setMarkHandled(checked === true)} />
                             {t("markOnClose")}
                           </label>
                         )}
                       </div>
                     )} />
  );
}
