import { Link } from "@nextui-org/react";
import { Metadata } from "next";

import { base64ToHex } from "@/utils";
import apiFetch from "@/utils/api";
import SearchInput from "@/components/SearchInput";
import { MagnetIcon } from "@/components/icons";
import { DetailContent } from "@/components/DetailContent";
import { siteConfig } from "@/config/site";

// Function to fetch torrent data based on the hash
async function fetchData(hash64: string) {
  const hash = base64ToHex(hash64); // Convert base64 hash to hex
  const data = await apiFetch(`/api/detail?hash=${hash}`); // Fetch data from API

  return data;
}

// Function to generate metadata for the page
export async function generateMetadata({
  params: { hash64 },
}: {
  params: { hash64: string };
}): Promise<Metadata> {
  const { data } = await fetchData(hash64);

  return {
    title: data.name,
  };
}

// Component to render the detail page
export default async function Detail({
  params: { hash64 },
}: {
  params: { hash64: string };
}) {
  const { data } = await fetchData(hash64);

  return (
    <>
      <div className="flex items-center max-w-xl mb-4">
        <Link className="mr-4 text-5xl" href="/" title={siteConfig.name}>
          <MagnetIcon />
        </Link>
        <SearchInput />
      </div>
      <DetailContent data={data} />
    </>
  );
}
