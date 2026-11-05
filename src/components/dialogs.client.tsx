"use client";

import * as React from "react";
import { createContext, useCallback, useContext, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ConfirmOptions = {
  title: string;
  description?: string;
  /** Defaults to "Confirm". */
  confirmLabel?: string;
  /** Red confirm button, for what cannot be undone. */
  destructive?: boolean;
};

type PromptOptions = {
  title: string;
  label: string;
  defaultValue?: string;
  confirmLabel?: string;
  maxLength?: number;
};

type ChooseOptions = {
  title: string;
  /** What can be chosen, in the order shown. */
  items: { id: string; label: string }[];
  /** Offered last, e.g. "New playlist"; choosing it resolves with "". */
  createLabel?: string;
};

type Request =
  | { type: "confirm"; options: ConfirmOptions; resolve: (value: boolean) => void }
  | { type: "prompt"; options: PromptOptions; resolve: (value: string | null) => void }
  | { type: "choose"; options: ChooseOptions; resolve: (value: string | null) => void };

/** More items than this get a search field. */
const SEARCH_FROM = 8;

type Dialogs = {
  /** Resolves with true when confirmed, false when cancelled. */
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  /** Resolves with the trimmed text, or null when cancelled or left empty. */
  prompt: (options: PromptOptions) => Promise<string | null>;
  /** Resolves with the chosen item's id, "" for the create choice, or null when cancelled. */
  choose: (options: ChooseOptions) => Promise<string | null>;
};

const DialogsContext = createContext<Dialogs | null>(null);

/**
 * In-app replacements for window.confirm and window.prompt, styled like the rest of the application, and a list to
 * choose from that can be searched when it is long. One dialog at a time; asking again while one is open cancels the
 * first.
 */
export function DialogsProvider({ children }: { children: React.ReactNode }) {
  const t = useTranslations("Common");
  const [request, setRequest] = useState<Request | null>(null);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const current = useRef<Request | null>(null);

  const settle = useCallback((value: boolean | string | null) => {
    const pending = current.current;

    current.current = null;
    setOpen(false);
    if (pending?.type === "confirm") {
      pending.resolve(value === true);
    } else if (pending?.type === "prompt") {
      pending.resolve(typeof value === "string" && value.trim() ? value.trim() : null);
    } else if (pending?.type === "choose") {
      pending.resolve(typeof value === "string" ? value : null);
    }
  }, []);

  const ask = useCallback((next: Request) => {
    settle(null);
    current.current = next;
    setText(next.type === "prompt" ? next.options.defaultValue ?? "" : "");
    setRequest(next);
    setOpen(true);
  }, [settle]);

  const dialogs = React.useMemo<Dialogs>(() => ({
    confirm: options => new Promise(resolve => ask({ type: "confirm", options, resolve })),
    prompt: options => new Promise(resolve => ask({ type: "prompt", options, resolve })),
    choose: options => new Promise(resolve => ask({ type: "choose", options, resolve })),
  }), [ask]);
  const query = text.trim().toLocaleLowerCase();
  const choices = request?.type === "choose"
    ? request.options.items.filter(item => !query || item.label.toLocaleLowerCase().includes(query))
    : [];

  return (
    <DialogsContext.Provider value={dialogs}>
      {children}
      <Dialog open={open} onOpenChange={next => !next && settle(null)}>
        {request?.type === "choose" && (
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{request.options.title}</DialogTitle>
            </DialogHeader>
            {request.options.items.length > SEARCH_FROM && (
              <Input type="search" autoFocus value={text} aria-label={t("search")} placeholder={t("search")}
                     onChange={event => setText(event.target.value)} />
            )}
            <ul className="-mx-2 max-h-80 overflow-y-auto">
              {choices.map(item => (
                <li key={item.id}>
                  <button type="button" onClick={() => settle(item.id)}
                          className="w-full truncate rounded-md px-2 py-2 text-left text-sm hover:bg-accent focus-visible:bg-accent focus-visible:outline-none">
                    {item.label}
                  </button>
                </li>
              ))}
              {choices.length === 0 && <li className="px-2 py-2 text-sm text-muted-foreground">{t("noMatches")}</li>}
            </ul>
            {request.options.createLabel && (
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => settle("")}>{request.options.createLabel}</Button>
              </DialogFooter>
            )}
          </DialogContent>
        )}
        {request && request.type !== "choose" && (
          <DialogContent showCloseButton={false} className="sm:max-w-md">
            <form className="grid gap-4" onSubmit={event => {
              event.preventDefault();
              settle(request.type === "prompt" ? text : true);
            }}>
              <DialogHeader>
                <DialogTitle>{request.options.title}</DialogTitle>
                {request.type === "confirm" && request.options.description && (
                  <DialogDescription>{request.options.description}</DialogDescription>
                )}
              </DialogHeader>
              {request.type === "prompt" && (
                <div className="space-y-1.5">
                  <Label htmlFor="dialog-prompt">{request.options.label}</Label>
                  <Input id="dialog-prompt" autoFocus value={text} maxLength={request.options.maxLength}
                         onChange={event => setText(event.target.value)} />
                </div>
              )}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => settle(null)}>{t("cancel")}</Button>
                <Button type="submit"
                        variant={request.type === "confirm" && request.options.destructive ? "destructive" : "default"}
                        disabled={request.type === "prompt" && !text.trim()}
                        autoFocus={request.type === "confirm"}>
                  {request.options.confirmLabel ?? t("confirm")}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        )}
      </Dialog>
    </DialogsContext.Provider>
  );
}

export function useDialogs(): Dialogs {
  const dialogs = useContext(DialogsContext);

  if (!dialogs) {
    throw new Error("useDialogs must be used inside DialogsProvider");
  }
  return dialogs;
}
