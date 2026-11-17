import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-8">
      <Skeleton className="h-8 w-48" />
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-16" />
        </div>
      ))}
    </div>
  );
}
