import { Metadata } from "next";
import { notFound } from "next/navigation";

import { base64ToHex } from "@/utils";
import apiFetch from "@/utils/api";
import { DetailContent } from "@/components/DetailContent";

// Function to fetch torrent data based on the hash
async function fetchData(hash64: string) {
  const hash = base64ToHex(hash64); // Convert base64 hash to hex

  if (!hash || hash.length !== 40) {
    console.error("Invalid hash", hash);
    notFound();
  }

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
      <DetailContent data={data} />
    </>
  );
}
