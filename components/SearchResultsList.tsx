"use client";

import { useTranslations } from "next-intl";

import SearchResultsItem from "./SearchResultsItem";

import { SearchResultsListProps } from "@/types";

export default function SearchResultsList({
  results,
  keyword,
}: {
  results: SearchResultsListProps;
  keyword: string;
}) {
  const t = useTranslations();

  return (
    <>
      <div className="text-sm text-gray-500 mb-4">
        {t("Search.results_found", { count: results.total_count })}
      </div>
      {results.items.map((item) => (
        <div key={item.hash} className="mb-4">
          <SearchResultsItem item={item} keyword={keyword} />
        </div>
      ))}
    </>
  );
}
