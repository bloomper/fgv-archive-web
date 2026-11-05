import Link from "next/link";
import { cn } from "@/utils/utils";

type Item = { href: string; label: string; active: boolean };

/**
 * Underlined tabs that are links, for choosing what a page shows, e.g. what a top list ranks by. They look unlike the
 * filter chips below them on purpose: a tab changes the list, a chip narrows it.
 */
export function LinkTabs({ items, label }: { items: Item[]; label: string }) {
  return (
    <nav aria-label={label} className="-mb-px flex gap-1 overflow-x-auto border-b">
      {items.map(item => (
        <Link key={item.href} href={item.href} aria-current={item.active ? "page" : undefined}
              className={cn("shrink-0 border-b-2 px-3 py-2 text-sm font-medium transition-colors",
                item.active
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground")}>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

/**
 * A two- or three-way switch that is links, for showing the same list as something else, e.g. songs or albums.
 */
export function LinkSegments({ items, label }: { items: Item[]; label: string }) {
  return (
    <nav aria-label={label} className="inline-flex rounded-lg bg-muted p-1">
      {items.map(item => (
        <Link key={item.href} href={item.href} aria-current={item.active ? "page" : undefined}
              className={cn("rounded-md px-3 py-1 text-sm font-medium transition-colors",
                item.active ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
