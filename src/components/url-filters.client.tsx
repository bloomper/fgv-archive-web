"use client";

import { createContext, type ReactNode, useContext, useEffect, useRef, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Search, SquareCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useServerState } from "@/hooks/use-server-state.client";
import { cn } from "@/utils/utils";

const ALL = "__all__";
const SEARCH_DELAY = 400;

type Values = Record<string, string | undefined>;

const FilterValues = createContext<Values>({});

/**
 * The filter's values and a way to set them: in the address (empty ones are removed), without adding to the history.
 * The values come from the page, which read them on the server.
 */
function useSetParams() {
  const router = useRouter();
  const path = usePathname();
  const values = useContext(FilterValues);
  const [isPending, startTransition] = useTransition();
  const params = { get: (name: string) => values[name] ?? null };

  const set = (changes: Values) => {
    const next = new URLSearchParams();

    for (const [key, value] of Object.entries(values)) {
      if (value) {
        next.set(key, value);
      }
    }
    for (const [key, value] of Object.entries(changes)) {
      if (value) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
    }
    next.delete("page");

    const query = next.toString();

    startTransition(() => router.replace(query ? `${path}?${query}` : path, { scroll: false }));
  };

  return { params, set, isPending };
}

/**
 * A toolbar of filters that apply at once and travel in the address, as Spexregister's tables have them. `values` are
 * the address' parameters as the page read them; parameters not in it are dropped when a filter changes.
 */
export function FilterBar({ label, values, children }: { label: string; values: Values; children: ReactNode }) {
  return (
    <FilterValues value={values}>
      <div
        role="search"
        aria-label={label}
        className="flex flex-wrap items-center gap-2"
      >
        {children}
      </div>
    </FilterValues>
  );
}

/** A search in the address' `name`, sent a moment after typing stops. */
export function FilterSearch({ name, label }: { name: string; label: string }) {
  const { params, set } = useSetParams();
  const [value, setValue] = useServerState(params.get(name) ?? "");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <div className="relative w-full sm:w-56">
      <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        value={value}
        maxLength={100}
        placeholder={label}
        aria-label={label}
        className="h-8 pl-8"
        onChange={e => {
          const next = e.target.value;

          setValue(next);
          clearTimeout(timer.current);
          timer.current = setTimeout(() => set({ [name]: next.trim() || undefined }), SEARCH_DELAY);
        }}
      />
    </div>
  );
}

/** One value of the address' `name` from a list, or all. */
export function FilterSelect({
  name,
  label,
  allLabel,
  options,
}: {
  name: string;
  label: string;
  allLabel: string;
  options: { value: string; label: string }[];
}) {
  const { params, set } = useSetParams();
  const items = [{ value: ALL, label: allLabel }, ...options];

  return (
    <Select
      value={params.get(name) || ALL}
      onValueChange={next => next !== null && set({ [name]: next === ALL ? undefined : next })}
      items={items}
    >
      <SelectTrigger
        size="sm"
        className="w-full sm:w-44"
        aria-label={label}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {items.map(item => (
          <SelectItem
            key={item.value}
            value={item.value}
          >
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** An on/off filter: the address' `name` is "1" while it is on. */
export function FilterToggle({ name, label }: { name: string; label: string }) {
  const { params, set } = useSetParams();
  const on = params.get(name) === "1";

  return (
    <Button
      variant="outline"
      size="sm"
      aria-pressed={on}
      className={cn("h-8 border-dashed", on && "border-solid border-primary")}
      onClick={() => set({ [name]: on ? undefined : "1" })}
    >
      <SquareCheck className={cn("mr-2 h-4 w-4", !on && "text-muted-foreground")} />
      {label}
    </Button>
  );
}

/** Clears these parameters; shown only while one of them is set. */
export function FilterReset({ names, label }: { names: string[]; label: string }) {
  const { params, set } = useSetParams();

  if (!names.some(name => params.get(name))) {
    return null;
  }
  return (
    <Button
      variant="ghost"
      className="h-8 px-2 lg:px-3"
      onClick={() => set(Object.fromEntries(names.map(name => [name, undefined])))}
    >
      <X className="mr-2 h-4 w-4" />
      {label}
    </Button>
  );
}
