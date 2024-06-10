"use client";
import { useRouter } from "next/navigation";
import { Pagination, Select, SelectItem } from "@nextui-org/react";
import { useTranslations } from "next-intl";

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
      <div className="flex my-4">
        <Select
          className="w-full"
          defaultSelectedKeys={[searchOption.sortType]}
          label={t("Search.filterLabel.sortType")}
          selectedKeys={[searchOption.sortType]}
          size="sm"
          onChange={(e) => handleFilterChange("sortType", e.target.value)}
        >
          {SEARCH_PARAMS.sortType.map((item) => (
            <SelectItem key={item} className="w-full">
              {t(`Search.sortType.${item}`)}
            </SelectItem>
          ))}
        </Select>

        <Select
          className="w-full ml-4"
          defaultSelectedKeys={[searchOption.filterSize]}
          label={t("Search.filterLabel.filterSize")}
          selectedKeys={[searchOption.filterSize]}
          size="sm"
          onChange={(e) => handleFilterChange("filterSize", e.target.value)}
        >
          {SEARCH_PARAMS.filterSize.map((item) => (
            <SelectItem key={item} className="w-full">
              {t(`Search.filterSize.${item}`)}
            </SelectItem>
          ))}
        </Select>

        <Select
          className="w-full ml-4"
          defaultSelectedKeys={[searchOption.filterTime]}
          label={t("Search.filterLabel.filterTime")}
          selectedKeys={[searchOption.filterTime]}
          size="sm"
          onChange={(e) => handleFilterChange("filterTime", e.target.value)}
        >
          {SEARCH_PARAMS.filterTime.map((item) => (
            <SelectItem key={item} className="w-full">
              {t(`Search.filterTime.${item}`)}
            </SelectItem>
          ))}
        </Select>
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

      {pagiConf.total > 1 && (
        <Pagination
          key={`pagi_${Object.values(searchOption).join("_")}`}
          showControls
          className="flex justify-center"
          initialPage={pagiConf.page}
          page={pagiConf.page}
          siblings={pagiConf.siblinds}
          total={pagiConf.total}
          onChange={(page) => handlePageChange(page, searchOption)}
        />
      )}
    </>
  );
}
