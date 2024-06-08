"use client";
import { useRouter } from "next/navigation";
import { Pagination } from "@nextui-org/react";
import { useTranslations } from "next-intl";

import SearchResultsItem from "./SearchResultsItem";

import { SearchResultsListProps } from "@/types";

export default function SearchResultsList({
  data,
  searchOption,
}: {
  data: SearchResultsListProps;
  searchOption: {
    keyword: string;
    p: number;
    ps: number;
  };
}) {
  const router = useRouter();
  const t = useTranslations();

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams();

    params.set("keyword", searchOption.keyword);
    params.set("p", String(page));
    params.set("ps", String(searchOption.ps));

    const url = `/search?${params.toString()}`;

    // router.push(url);
    location.href = url;
  };

  const pagiConf = {
    page: searchOption.p,
    total: Math.ceil(data.total_count / searchOption.ps),
    siblinds: 3,
  };

  return (
    <>
      <div className="text-sm text-gray-500 mb-4">
        {t("Search.results_found", { count: data.total_count })}
      </div>
      {data.items.map((item) => (
        <div key={item.hash} className="mb-4">
          <SearchResultsItem item={item} keyword={searchOption.keyword} />
        </div>
      ))}

      <Pagination
        showControls
        initialPage={pagiConf.page}
        siblings={pagiConf.siblinds}
        total={pagiConf.total}
        onChange={handlePageChange}
      />
    </>
  );
}
