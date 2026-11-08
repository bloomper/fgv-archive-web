import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { LucideIcon, Search } from "lucide-react";
import { useTranslations } from "next-intl";

export function DataEmpty({
                            title,
                            description,
                            icon: Icon = Search,
                          }: {
  title?: string,
  /** null leaves the description out. */
  description?: string | null,
  icon?: LucideIcon
}) {
  const t = useTranslations();

  return (
    <Empty className="col-span-full">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Icon />
        </EmptyMedia>
        <EmptyTitle>{title ?? t("Common.noDataHeading")}</EmptyTitle>
        {description !== null && (
          <EmptyDescription>
            {description ?? t("Common.noDataDescription")}
          </EmptyDescription>
        )}
      </EmptyHeader>
    </Empty>
  );
}
