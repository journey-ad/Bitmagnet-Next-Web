"use client";
import { useRouter } from "next/navigation";
import { Pagination, Select, SelectItem } from "@nextui-org/react";
import { useTranslations } from "next-intl";
import { useIsSSR } from "@react-aria/ssr";

import SearchResultsItem from "./SearchResultsItem";

import { SearchResultsListProps } from "@/types";
import { $env } from "@/utils";
import { SEARCH_PARAMS, SEARCH_PAGE_MAX } from "@/config/constant";

export default function SearchResultsList({
  resultList,
  cost_time = 0,
  total_count = 0,
  searchOption,
}: {
  resultList: SearchResultsListProps["torrents"];
  cost_time: number;
  total_count: number;
  searchOption: {
    keyword: string;
    p: number;
    ps: number;
    sortType: string;
    filterTime: string;
    filterSize: string;
  };
}) {
  const router = useRouter();
  const isSSR = useIsSSR();
  const t = useTranslations();

  const handleFilterChange = (type: string, value: string) => {
    const updatedSearchOption = {
      ...searchOption,
      [type]: value,
    };

    handlePageChange(1, updatedSearchOption);
  };

  const handlePageChange = (
    page: number,
    newSearchOption: typeof searchOption,
  ) => {
    const params = new URLSearchParams();

    params.set("keyword", newSearchOption.keyword);
    params.set("p", String(page));
    params.set("ps", String(newSearchOption.ps));

    if (newSearchOption.sortType) {
      params.set("sortType", newSearchOption.sortType);
    }

    if (newSearchOption.filterTime) {
      params.set("filterTime", newSearchOption.filterTime);
    }

    if (newSearchOption.filterSize) {
      params.set("filterSize", newSearchOption.filterSize);
    }

    const url = `/search?${params.toString()}`;

    router.push(url);
  };

  const pagiConf = {
    page: searchOption.p,
    total: Math.min(Math.ceil(total_count / searchOption.ps), SEARCH_PAGE_MAX),
    siblinds: $env.isMobile ? 1 : 3,
  };

  return (
    <>
      <div className="flex gap-2 my-4">
        {Object.entries(SEARCH_PARAMS).map(([key, value]) => (
          <Select
            key={key}
            className="w-full"
            classNames={{
              label: "text-xs md:text-sm",
              trigger: "h-10 min-h-10 md:h-12 md:min-h-12",
              value: "text-xs md:text-sm",
            }}
            defaultSelectedKeys={[
              searchOption[key as keyof typeof searchOption],
            ]}
            label={t(`Search.filterLabel.${key}`)}
            popoverProps={{
              className: "w-full flex justify-center",
              classNames: {
                content: "bg-opacity-70 backdrop-blur-sm min-w-fit px-1",
              },
            }}
            selectedKeys={[searchOption[key as keyof typeof searchOption]]}
            size="sm"
            onChange={(e) => handleFilterChange(key, e.target.value)}
          >
            {value.map((item) => (
              <SelectItem
                key={item}
                className="w-full !bg-opacity-60"
                classNames={{
                  title: "text-xs md:text-sm",
                }}
              >
                {t(`Search.${key}.${item}`)}
              </SelectItem>
            ))}
          </Select>
        ))}
      </div>

      <div className="text-sm text-gray-500 mb-4">
        {t("Search.results_found", { count: total_count })}

        {cost_time > 0 && (
          <span className="ml-1 text-xs">
            {t("Search.cost_time", { cost_time: cost_time })}
          </span>
        )}
      </div>

      {resultList.map((item) => (
        <div key={item.hash} className="mb-6">
          <SearchResultsItem item={item} keyword={searchOption.keyword} />
        </div>
      ))}

      {!isSSR && pagiConf.total > 1 && (
        <Pagination
          key={`pagi_${Object.values(searchOption).join("_")}`}
          className="flex justify-center"
          classNames={{
            wrapper: "gap-x-2",
          }}
          initialPage={pagiConf.page}
          page={pagiConf.page}
          showControls={$env.isDesktop}
          siblings={pagiConf.siblinds}
          size={$env.isMobile ? "lg" : "md"}
          total={pagiConf.total}
          onChange={(page) => handlePageChange(page, searchOption)}
        />
      )}
    </>
  );
}
