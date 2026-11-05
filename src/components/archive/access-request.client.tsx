"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { accessRequestAction } from "@/app/(app)/actions.server";
import { track } from "@/utils/umami";

/**
 * A restricted version's notice for users who may not open it, with "Ask for access": the editors get an email with the
 * user's name, the files and the reason.
 */
export function AccessRequest({ files }: { files: { id: string; title: string }[] }) {
  const t = useTranslations("AccessRequest");
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();

  const send = () => startTransition(async () => {
    const result = await accessRequestAction(files.map(file => file.id), reason);

    if (result.ok) {
      toast.success(t("sent"));
      track("access-request", { files: files.length });
      setSent(true);
      setOpen(false);
      setReason("");
    } else {
      toast.error(result.message);
    }
  });

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-dashed bg-muted/50 p-3 text-sm"
         data-testid="restricted-notice">
      <Lock className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      <p className="min-w-0 flex-1 basis-56 text-pretty">{t("notice")}</p>
      {files.length > 0 && (
        <Button size="sm" variant="outline" onClick={() => setOpen(true)} disabled={sent}>
          {sent ? t("asked") : t("ask")}
        </Button>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <form className="grid gap-4" onSubmit={event => {
            event.preventDefault();
            send();
          }}>
            <DialogHeader>
              <DialogTitle>{t("title")}</DialogTitle>
              <DialogDescription>{t("description", { count: files.length })}</DialogDescription>
            </DialogHeader>
            <ul className="max-h-32 list-disc overflow-y-auto pl-5 text-sm text-muted-foreground">
              {files.map(file => <li key={file.id}>{file.title}</li>)}
            </ul>
            <div className="space-y-1.5">
              <Label htmlFor="access-reason">{t("reason")}</Label>
              <Textarea id="access-reason" value={reason} maxLength={2000} required rows={4}
                        placeholder={t("reasonPlaceholder")} onChange={event => setReason(event.target.value)} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>{t("cancel")}</Button>
              <Button type="submit" disabled={pending || !reason.trim()}>{t("send")}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
