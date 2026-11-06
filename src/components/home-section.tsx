import type { ReactNode } from "react";
import Link from "next/link";

/**
 * A row of the start page: a heading, a link to everything of its kind, and its content.
 */
export function HomeSection({ id, title, more, children }: {
  id: string;
  title: string;
  more?: { href: string; label: string };
  children: ReactNode;
}) {
  return (
    <section className="space-y-3" aria-labelledby={id}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4">
        <h2 id={id} className="text-lg font-semibold">{title}</h2>
        {more && <Link href={more.href} className="text-sm text-primary hover:underline">{more.label}</Link>}
      </div>
      {children}
    </section>
  );
}
