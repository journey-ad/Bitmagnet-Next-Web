"use client";

import { Input } from "@nextui-org/input";
import { Button } from "@nextui-org/button";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { SearchIcon } from "@/components/icons";

export default function Search({
  defaultValue = "",
  isReplace = false,
}: {
  defaultValue?: string;
  isReplace?: boolean;
}) {
  const [keyword, setKeyword] = useState(defaultValue);
  const router = useRouter();

  function handleSearch() {
    const params = new URLSearchParams();

    params.set("keyword", keyword);

    const url = `/search?${params.toString()}`;

    if (isReplace) {
      router.replace(url);
    } else {
      router.push(url);
    }
  }

  function handleKeyup(e: any) {
    if (e.key === "Enter") {
      handleSearch();
    }
  }

  return (
    <Input
      aria-label="Search"
      classNames={{
        inputWrapper: "h-12 px-4 bg-default-100",
        input: "text-lg",
      }}
      defaultValue={defaultValue}
      endContent={
        <Button
          isIconOnly
          className="border-none"
          variant="ghost"
          onClick={handleSearch}
        >
          <SearchIcon className="text-xl text-default-400 pointer-events-none flex-shrink-0" />
        </Button>
      }
      labelPlacement="outside"
      placeholder="Search..."
      value={keyword}
      onKeyUp={handleKeyup}
      onValueChange={setKeyword}
    />
  );
}
