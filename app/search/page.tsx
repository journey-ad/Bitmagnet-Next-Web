import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@nextui-org/react";

import Search from "@/components/search";
import SearchResultsList from "@/components/SearchResultsList";
import apiFetch from "@/utils/api";
import { MagnetIcon } from "@/components/icons";

async function fetchData(keyword: string, limit: number, offset: number) {
  const params = new URLSearchParams();

  params.set("keyword", keyword);
  params.set("limit", String(limit || 10));
  params.set("offset", String(offset || 0));

  console.log(keyword, limit, offset);

  const data = await apiFetch(`/api/search?${params.toString()}`);

  return data;
}

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

export default async function SearchPage({
  searchParams: { keyword, p, ps = 10 },
}: {
  searchParams: { keyword: string; p: number; ps?: number };
}) {
  const pageConf = {
    limit: ps,
    offset: (p - 1) * ps,
  };

  const { data } = await fetchData(keyword, pageConf.limit, pageConf.offset);

  const searchOption = {
    keyword,
    p: Number(p) || 1,
    ps: Number(pageConf.limit) || 10,
  };

  return (
    <div className="w-full max-w-3xl">
      <div className="flex items-center max-w-xl mb-4">
        <Link className="mr-4 text-5xl" href="/">
          <MagnetIcon />
        </Link>
        <Search defaultValue={keyword} />
      </div>
      <SearchResultsList data={data} searchOption={searchOption} />
    </div>
  );
}
