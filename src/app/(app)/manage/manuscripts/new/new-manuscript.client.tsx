"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { type PickedSpex, SpexPicker } from "@/components/spex/spex-picker.client";
import { createManuscriptAction } from "@/app/(app)/manage/actions.server";
import { versionEditHref } from "@/utils/links";
import { track } from "@/utils/umami";

/**
 * A new manuscript for an original spex, with its first version, "Original", unpublished; the title defaults to the
 * spex' title.
 */
export function NewManuscript({ spex: initial }: { spex: PickedSpex | null }) {
  const t = useTranslations("NewManuscript");
  const router = useRouter();
  const [spex, setSpex] = useState<PickedSpex | null>(initial);
  const [title, setTitle] = useState("");
  const [authors, setAuthors] = useState("");
  const [description, setDescription] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <form className="grid max-w-2xl gap-4" onSubmit={event => {
      event.preventDefault();
      if (!spex) {
        return;
      }
      startTransition(async () => {
        const result = await createManuscriptAction({
          spexId: spex.id,
          title: title.trim() || null,
          authors: authors.trim() || null,
          description: description.trim() || null,
        });

        if (result.ok) {
          track("manuscript-create");
          router.push(result.data.versionId ? versionEditHref(result.data.versionId) : `/manuscripts/${result.data.id}`);
        } else {
          toast.error(result.message);
        }
      });
    }}>
      <SpexPicker value={spex} onChange={setSpex} originalsOnly />
      <div className="space-y-1.5">
        <Label htmlFor="manuscript-title">{t("title")}</Label>
        <Input id="manuscript-title" value={title} maxLength={255} placeholder={spex?.title ?? ""}
               onChange={event => setTitle(event.target.value)} />
        <p className="text-xs text-muted-foreground">{t("titleHint")}</p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="manuscript-authors">{t("authors")}</Label>
        <Input id="manuscript-authors" value={authors} maxLength={500} onChange={event => setAuthors(event.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="manuscript-description">{t("description")}</Label>
        <Textarea id="manuscript-description" value={description} rows={4} maxLength={10000}
                  onChange={event => setDescription(event.target.value)} />
      </div>
      <div>
        <Button type="submit" disabled={pending || !spex}>{t("create")}</Button>
      </div>
    </form>
  );
}
