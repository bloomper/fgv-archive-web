"use client";

import { type ReactNode, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Check, Copy, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ShareLinkInput } from "@/gql/graphql";
import { createShareLinkAction } from "@/app/(app)/manage/actions.server";
import { track } from "@/utils/umami";

/**
 * Makes a share link for what is given (versions, files, or a spex' instruments and transpositions): a name saying who
 * it is for and how many months it lasts. The address is shown once, with a copy button; only its hash is kept.
 * `afterCreate` adds to the dialog once the link is made (e.g. emailing it), and `onDone` runs when that dialog closes.
 */
export function ShareLinkButton({ input, defaultName = "", maxMonths, label, disabled = false, size = "sm", afterCreate, onDone }: {
  input: Omit<ShareLinkInput, "name" | "months">;
  defaultName?: string;
  maxMonths: number;
  label?: string;
  disabled?: boolean;
  size?: "xs" | "sm" | "default";
  afterCreate?: (url: string, months: number) => ReactNode;
  onDone?: () => void;
}) {
  const t = useTranslations("ShareLinks");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(defaultName);
  const [months, setMonths] = useState(String(Math.min(12, maxMonths)));
  const [url, setUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  const changeOpen = (next: boolean) => {
    setOpen(next);
    if (!next && url) {
      onDone?.();
    }
  };

  const create = () => startTransition(async () => {
    const result = await createShareLinkAction({ ...input, name, months: Number(months) });

    if (result.ok) {
      track("share-link-create", {
        versions: input.versionIds?.length ?? 0,
        files: input.fileIds?.length ?? 0,
        instruments: input.instrumentIds?.length ?? 0,
      });
      setUrl(`${window.location.origin}/share/${result.data.token}`);
      router.refresh();
    } else {
      toast.error(result.message);
    }
  });

  const copy = async () => {
    if (!url) {
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success(t("copied"));
    } catch {
      toast.error(t("copyFailed"));
    }
  };

  return (
    <>
      <Button size={size} variant="outline" disabled={disabled} onClick={() => {
        setUrl(null);
        setCopied(false);
        setName(defaultName);
        setMonths(String(Math.min(12, maxMonths)));
        setOpen(true);
      }}>
        <Share2 /> {label ?? t("create")}
      </Button>
      <Dialog open={open} onOpenChange={changeOpen}>
        <DialogContent className="sm:max-w-lg">
          {url ? (
            <div className="grid gap-4">
              <DialogHeader>
                <DialogTitle>{t("createdTitle")}</DialogTitle>
                <DialogDescription>{t("shownOnce")}</DialogDescription>
              </DialogHeader>
              <div className="flex gap-2">
                <Input readOnly value={url} aria-label={t("address")} onFocus={event => event.target.select()}
                       className="font-mono text-xs" />
                <Button type="button" variant="outline" onClick={copy} aria-label={t("copy")}>
                  {copied ? <Check /> : <Copy />} {t("copy")}
                </Button>
              </div>
              {afterCreate?.(url, Number(months))}
              <DialogFooter>
                <Button type="button" onClick={() => changeOpen(false)}>{t("done")}</Button>
              </DialogFooter>
            </div>
          ) : (
            <form className="grid gap-4" onSubmit={event => {
              event.preventDefault();
              create();
            }}>
              <DialogHeader>
                <DialogTitle>{t("createTitle")}</DialogTitle>
                <DialogDescription>{t("createText")}</DialogDescription>
              </DialogHeader>
              <div className="space-y-1.5">
                <Label htmlFor="share-name">{t("name")}</Label>
                <Input id="share-name" value={name} required maxLength={200} placeholder={t("namePlaceholder")}
                       onChange={event => setName(event.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="share-months">{t("months")}</Label>
                <Input id="share-months" type="number" min={1} max={maxMonths} value={months} required className="w-28"
                       onChange={event => setMonths(event.target.value)} />
                <p className="text-xs text-muted-foreground">{t("monthsHint", { max: maxMonths })}</p>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>{t("cancel")}</Button>
                <Button type="submit" disabled={pending || !name.trim()}>{t("createButton")}</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
