import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { Tooltip, Spinner } from "@nextui-org/react";

import apiFetch from "@/utils/api";
import { InfoFilledIcon } from "@/components/icons";
import { formatByteSize, formatDate } from "@/utils";

async function StatsCard() {
  const t = await getTranslations();

  const { data } = await apiFetch("/api/stats", {
    next: { revalidate: 60 },
  });

  return (
    <div className="text-xs text-foreground-600">
      <h4 className="font-bold">{t("Stats.title")}</h4>
      <ul>
        <li>{t("Stats.size", { size: formatByteSize(data.size) })}</li>
        <li>
          {t("Stats.total_count", {
            total_count: data.total_count.toLocaleString(),
          })}
        </li>
        <li>
          {t("Stats.updated_at", {
            updated_at: formatDate(
              data.updated_at,
              t("COMMON.DATE_FORMAT_SHORT"),
            ),
          })}
        </li>
      </ul>
    </div>
  );
}

export function Stats() {
  return (
    <Tooltip
      classNames={{
        content: "bg-opacity-60",
      }}
      closeDelay={0}
      content={
        <Suspense fallback={<Spinner size="sm" />}>
          <StatsCard />
        </Suspense>
      }
      delay={0}
      radius="sm"
    >
      <InfoFilledIcon className="cursor-pointer text-gray-500" size={15} />
    </Tooltip>
  );
}
