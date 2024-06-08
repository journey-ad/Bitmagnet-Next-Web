import Search from "@/components/search";
import SearchResultsList from "@/components/SearchResultsList";
import apiFetch from "@/utils/api";

async function fetchData(keyword: string, limit: number, offset: number) {
  const params = new URLSearchParams();

  params.set("keyword", keyword);
  params.set("limit", limit.toString());
  params.set("offset", offset.toString());

  const data = await apiFetch(`/api/search?${params.toString()}`);

  return data;
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

  const results = await fetchData(keyword, pageConf.limit, pageConf.offset);

  return (
    <div className="w-full max-w-3xl">
      <div className="max-w-xl mb-4">
        <Search defaultValue={keyword} />
      </div>
      <SearchResultsList keyword={keyword} results={results} />
    </div>
  );
}
