"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@bloomper/fgv-web-ui/ui/button";
import { Input } from "@bloomper/fgv-web-ui/ui/input";
import { Label } from "@bloomper/fgv-web-ui/ui/label";
import { NativeSelect, NativeSelectOption } from "@bloomper/fgv-web-ui/ui/native-select";
import { Textarea } from "@bloomper/fgv-web-ui/ui/textarea";
import { type PickedSpex, SpexPicker } from "@/components/spex/spex-picker.client";
import { createManuscriptAction } from "@/app/(app)/manage/actions.server";
import { manuscriptHref, versionEditHref } from "@/utils/links";
import { track } from "@/utils/umami";

/**
 * A new document of a kind, for an original spex or of FGV's own (no spex), with its first version, "Original",
 * unpublished; the title defaults to the spex' title, or the kind's name.
 */
export function NewManuscript({ spex: initial, kinds, kindId: initialKind }: {
  spex: PickedSpex | null;
  kinds: { id: string; name: string }[];
  kindId: string;
}) {
  const t = useTranslations("NewManuscript");
  const router = useRouter();
  const [spex, setSpex] = useState<PickedSpex | null>(initial);
  const [kindId, setKindId] = useState(initialKind);
  const [title, setTitle] = useState("");
  const [authors, setAuthors] = useState("");
  const [description, setDescription] = useState("");
  const [pending, startTransition] = useTransition();
  const kindName = kinds.find(kind => kind.id === kindId)?.name ?? "";

  return (
    <form className="grid max-w-2xl gap-4" onSubmit={event => {
      event.preventDefault();
      startTransition(async () => {
        const result = await createManuscriptAction({
          spexId: spex?.id ?? null,
          kindId: kindId || null,
          title: title.trim() || null,
          authors: authors.trim() || null,
          description: description.trim() || null,
        });

        if (result.ok) {
          track("manuscript-create");
          router.push(result.data.versionId ? versionEditHref(result.data.versionId) : manuscriptHref(result.data.id));
        } else {
          toast.error(result.message);
        }
      });
    }}>
      <div className="space-y-1.5">
        <Label htmlFor="manuscript-kind">{t("kind")}</Label>
        <NativeSelect id="manuscript-kind" value={kindId} className="w-full" required onChange={event => setKindId(event.target.value)}>
          {kinds.map(kind => <NativeSelectOption key={kind.id} value={kind.id}>{kind.name}</NativeSelectOption>)}
        </NativeSelect>
      </div>
      <div className="space-y-1">
        <SpexPicker value={spex} onChange={setSpex} originalsOnly />
        {!spex && <p className="text-xs text-muted-foreground">{t("noSpex")}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="manuscript-title">{t("title")}</Label>
        <Input id="manuscript-title" value={title} maxLength={255} placeholder={spex?.title ?? kindName}
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
        <Button type="submit" disabled={pending || kinds.length === 0}>{t("create")}</Button>
      </div>
    </form>
  );
}
