import { Skeleton } from "@bloomper/fgv-web-ui/ui/skeleton";
import { Page } from "@bloomper/fgv-web-ui/shell/page-header";

export default function Loading() {
  return (
    <Page variant="content">
      <Skeleton className="h-8 w-48" />
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-16" />
        </div>
      ))}
    </Page>
  );
}
