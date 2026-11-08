import type { ReactNode } from "react";

/**
 * A page's title, as in all FGV applications: the heading with its actions beside it, and an optional description
 * below. Pages put it first in `flex flex-1 flex-col gap-4 p-4 md:p-8`.
 */
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
    </>
  );
}
