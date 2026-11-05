"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDialogs } from "@/components/dialogs.client";
import { useServerState } from "@/hooks/use-server-state.client";
import type { ActionResult } from "@/lib/graphql.server";
import { localName } from "@/utils/music";
import { createFileRoleAction, deleteFileRoleAction, reorderFileRolesAction, updateFileRoleAction } from "../actions.server";

type Role = { id: string; nameSv: string; nameEn: string; position: number; fileCount: number };

/**
 * The file roles in order, with Swedish and English names. A role in use cannot be deleted, nor the last one.
 */
export function FileRolesEditor({ roles }: { roles: Role[] }) {
  const t = useTranslations("AdminFileRoles");
  const locale = useLocale();
  const router = useRouter();
  const dialogs = useDialogs();
  const [order, setOrder] = useServerState(roles, list => list.map(role => `${role.id}:${role.nameSv}:${role.nameEn}:${role.fileCount}`).join("|"));
  const [editing, setEditing] = useState<string | null>(null);
  const [nameSv, setNameSv] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [pending, startTransition] = useTransition();

  const run = (work: () => Promise<ActionResult<unknown>>, done: string) => startTransition(async () => {
    const result = await work();

    if (result.ok) {
      toast.success(done);
    } else {
      toast.error(result.message);
    }
    router.refresh();
  });
  const move = (index: number, delta: number) => {
    const next = [...order];
    const [item] = next.splice(index, 1);

    next.splice(index + delta, 0, item);
    setOrder(next);
    run(() => reorderFileRolesAction(next.map(role => role.id)), t("reordered"));
  };
  const form = (
    <form className="flex flex-wrap items-end gap-2" aria-label={t("form")} onSubmit={event => {
      event.preventDefault();

      const id = editing;

      setEditing(null);
      run(() => id && id !== "new" ? updateFileRoleAction(id, { nameSv, nameEn }) : createFileRoleAction({ nameSv, nameEn }), t("saved"));
    }}>
      <div className="space-y-1">
        <Label htmlFor="role-sv">{t("nameSv")}</Label>
        <Input id="role-sv" value={nameSv} required maxLength={100} onChange={event => setNameSv(event.target.value)} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="role-en">{t("nameEn")}</Label>
        <Input id="role-en" value={nameEn} required maxLength={100} onChange={event => setNameEn(event.target.value)} />
      </div>
      <Button type="submit" size="sm" disabled={pending}>{t("save")}</Button>
      <Button type="button" size="sm" variant="outline" onClick={() => setEditing(null)}>{t("cancel")}</Button>
    </form>
  );

  return (
    <div className="space-y-4">
      <ul className="divide-y rounded-lg border bg-card">
        {order.map((role, index) => (
          <li key={role.id} className="px-3 py-2">
            {editing === role.id ? form : (
              <div className="flex flex-wrap items-center gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{localName(role, locale)}</p>
                  <p className="text-xs text-muted-foreground">
                    {locale === "en" ? role.nameSv : role.nameEn} · {t("files", { count: role.fileCount })}
                  </p>
                </div>
                <Button size="icon-sm" variant="ghost" disabled={index === 0 || pending}
                        aria-label={t("moveUp", { name: role.nameSv })} onClick={() => move(index, -1)}><ArrowUp /></Button>
                <Button size="icon-sm" variant="ghost" disabled={index === order.length - 1 || pending}
                        aria-label={t("moveDown", { name: role.nameSv })} onClick={() => move(index, 1)}><ArrowDown /></Button>
                <Button size="icon-sm" variant="ghost" aria-label={t("edit", { name: role.nameSv })} onClick={() => {
                  setNameSv(role.nameSv);
                  setNameEn(role.nameEn);
                  setEditing(role.id);
                }}><Pencil /></Button>
                <Button size="icon-sm" variant="ghost" disabled={role.fileCount > 0 || order.length === 1}
                        title={role.fileCount > 0 ? t("inUse") : undefined}
                        aria-label={t("delete", { name: role.nameSv })} onClick={async () => {
                  if (await dialogs.confirm({ title: t("deleteTitle", { name: localName(role, locale) }), confirmLabel: t("deleteButton"), destructive: true })) {
                    run(() => deleteFileRoleAction(role.id), t("deleted"));
                  }
                }}><Trash2 /></Button>
              </div>
            )}
          </li>
        ))}
      </ul>
      {editing === "new" ? form : (
        <Button variant="outline" onClick={() => {
          setNameSv("");
          setNameEn("");
          setEditing("new");
        }}><Plus /> {t("add")}</Button>
      )}
    </div>
  );
}
