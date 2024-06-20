import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@nextui-org/react";

import { SearchInput } from "@/components/SearchInput";
import SearchResultsList from "@/components/SearchResultsList";
import apiFetch from "@/utils/api";
import { MagnetIcon } from "@/components/icons";
import { siteConfig } from "@/config/site";
import {
  DEFAULT_SORT_TYPE,
  SEARCH_PAGE_SIZE,
  DEFAULT_FILTER_TIME,
  DEFAULT_FILTER_SIZE,
  SEARCH_PAGE_MAX,
} from "@/config/constant";

type SearchParams = {
  keyword: string;
  p?: number;
  ps?: number;
  sortType?: string;
  filterTime?: string;
  filterSize?: string;
};

type SearchRequestType = {
  keyword: string;
  limit?: number;
  offset?: number;
  sortType?: string;
  filterTime?: string;
  filterSize?: string;
};

let cachedSearchOption: SearchParams | null = null;
let totalCount = 0;

// Fetch data from the API based on search parameters
async function fetchData({
  keyword,
  limit = SEARCH_PAGE_SIZE,
  offset = 0,
  sortType,
  filterTime,
  filterSize,
}: SearchRequestType): Promise<any> {
  const params = new URLSearchParams({
    keyword,
    limit: String(limit),
    offset: String(offset),
  });

  if (sortType) params.set("sortType", sortType);
  if (filterTime) params.set("filterTime", filterTime);
  if (filterSize) params.set("filterSize", filterSize);

  // Check if it is a new search
  const isNewSearch =
    !cachedSearchOption ||
    keyword !== cachedSearchOption.keyword ||
    filterTime !== cachedSearchOption.filterTime ||
    filterSize !== cachedSearchOption.filterSize;

  if (isNewSearch) {
    cachedSearchOption = null; // Reset cachedSearchOption for new search
  } else {
    params.set("withTotalCount", "0");
  }

  try {
    const resp = await apiFetch(`/api/search?${params.toString()}`, {
      next: { revalidate: 60 * 60 * 6 }, // cache for 6 hours
    });

    if (isNewSearch) {
      totalCount = resp.data.total_count;
    }
    cachedSearchOption = {
      keyword,
      sortType,
      filterTime,
      filterSize,
      p: cachedSearchOption?.p,
    };

    return resp;
  } catch (error: any) {
    console.error(error);

    throw error;
  }
}

// Generate metadata for the search page
export async function generateMetadata({
  searchParams: { keyword },
}: {
  searchParams: { keyword: string };
}): Promise<Metadata> {
  const t = await getTranslations();

  return {
    title: t("Metadata.search.title", { keyword }),
  };
}

// Get search options from the search parameters
function getSearchOption(searchParams: SearchParams) {
  const isNewSearch =
    !cachedSearchOption || searchParams.keyword !== cachedSearchOption.keyword;

  return {
    keyword: searchParams.keyword,
    p: Math.min(isNewSearch ? 1 : searchParams.p || 1, SEARCH_PAGE_MAX),
    ps: searchParams.ps || SEARCH_PAGE_SIZE,
    sortType: searchParams.sortType || DEFAULT_SORT_TYPE,
    filterTime: searchParams.filterTime || DEFAULT_FILTER_TIME,
    filterSize: searchParams.filterSize || DEFAULT_FILTER_SIZE,
  };
}

// Component to render the search page
export default async function SearchPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const searchOption = getSearchOption(searchParams);

  const start_time = Date.now();
  const { data } = await fetchData({
    keyword: searchOption.keyword,
    limit: searchOption.ps, // Number of items per page
    offset: (searchOption.p - 1) * searchOption.ps, // Offset calculated based on the page number
    sortType: searchOption.sortType,
    filterTime: searchOption.filterTime,
    filterSize: searchOption.filterSize,
  });
  const cost_time = Date.now() - start_time;

  return (
    <div className="w-full md:max-w-3xl lg:max-w-4xl xl:max-w-5xl 2xl:max-w-6xl">
      <div className="flex items-center mb-7">
        <Link
          className="mb-[-2px] mr-2 md:mr-4 leading-none text-[50px] md:text-[60px]"
          href="/"
          title={siteConfig.name}
        >
          <MagnetIcon />
        </Link>
        <SearchInput defaultValue={searchOption.keyword} />
      </div>
      <SearchResultsList
        cost_time={cost_time}
        resultList={data.torrents}
        keywords={data.keywords}
        searchOption={searchOption}
        total_count={totalCount}
      />
    </div>
  );
}
