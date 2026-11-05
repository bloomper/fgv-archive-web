"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { SettingsInput } from "@/gql/graphql";
import { saveSettingsAction } from "../actions.server";

/**
 * The start page's texts, the largest upload, whether new versions start restricted, the longest share link and who
 * is told about access requests (empty: everyone with EDITOR).
 */
export function SettingsForm({ initial }: { initial: SettingsInput }) {
  const t = useTranslations("AdminSettings");
  const [values, setValues] = useState(initial);
  const [recipients, setRecipients] = useState((initial.accessRequestRecipients ?? []).join("\n"));
  const [pending, startTransition] = useTransition();

  return (
    <form className="max-w-2xl space-y-4" onSubmit={event => {
      event.preventDefault();
      startTransition(async () => {
        const result = await saveSettingsAction({
          ...values,
          welcomeSv: values.welcomeSv?.trim() || null,
          welcomeEn: values.welcomeEn?.trim() || null,
          accessRequestRecipients: recipients.split(/[\s,;]+/).map(value => value.trim()).filter(Boolean),
        });

        if (result.ok) {
          toast.success(t("saved"));
        } else {
          toast.error(result.message);
        }
      });
    }}>
      <div className="space-y-1.5">
        <Label htmlFor="welcome-sv">{t("welcomeSv")}</Label>
        <Textarea id="welcome-sv" rows={3} value={values.welcomeSv ?? ""} maxLength={2000}
                  onChange={event => setValues({ ...values, welcomeSv: event.target.value })} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="welcome-en">{t("welcomeEn")}</Label>
        <Textarea id="welcome-en" rows={3} value={values.welcomeEn ?? ""} maxLength={2000}
                  onChange={event => setValues({ ...values, welcomeEn: event.target.value })} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="max-upload">{t("maxUploadMb")}</Label>
          <Input id="max-upload" type="number" min={1} max={10000} value={values.maxUploadMb}
                 onChange={event => setValues({ ...values, maxUploadMb: Number(event.target.value) })} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="max-share">{t("maxShareLinkMonths")}</Label>
          <Input id="max-share" type="number" min={1} max={24} value={values.maxShareLinkMonths}
                 onChange={event => setValues({ ...values, maxShareLinkMonths: Number(event.target.value) })} />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <Checkbox checked={values.manuscriptRestricted}
                  onCheckedChange={checked => setValues({ ...values, manuscriptRestricted: checked === true })} />
        {t("manuscriptRestricted")}
      </label>
      <label className="flex items-center gap-2 text-sm">
        <Checkbox checked={values.arrangementRestricted}
                  onCheckedChange={checked => setValues({ ...values, arrangementRestricted: checked === true })} />
        {t("arrangementRestricted")}
      </label>
      <div className="space-y-1.5">
        <Label htmlFor="recipients">{t("recipients")}</Label>
        <Textarea id="recipients" rows={3} value={recipients} onChange={event => setRecipients(event.target.value)}
                  placeholder="redaktor@example.org" />
        <p className="text-xs text-muted-foreground">{t("recipientsHint")}</p>
      </div>
      <Button type="submit" disabled={pending}>{t("save")}</Button>
    </form>
  );
}
