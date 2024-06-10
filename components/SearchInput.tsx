"use client";

import { Input, Button, Spinner } from "@nextui-org/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { SearchIcon } from "@/components/icons";
import { Toast } from "@/utils/Toast";

export default function SearchInput({
  defaultValue = "",
  isReplace = false,
}: {
  defaultValue?: string;
  isReplace?: boolean;
}) {
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Reset loading state when search parameters change
    setLoading(false);
  }, [searchParams]);

  useEffect(() => {
    // Set default value for keyword when provided
    if (defaultValue) {
      setKeyword(defaultValue);
    }
  }, [defaultValue]);

  function handleSearch() {
    // Trim the keyword and set it to state
    setKeyword(keyword.trim());

    if (!keyword.trim()) {
      // If keyword is empty, display warning toast
      Toast.warn(t("Toast.keyword_empty"));

      return;
    }

    if (keyword.length < 2) {
      // If keyword length is less than 2, display warning toast
      Toast.warn(t("Toast.keyword_too_short"));

      return;
    }

    const params = new URLSearchParams(); // Create URLSearchParams object

    params.set("keyword", keyword.trim()); // Set keyword in URLSearchParams

    const url = `/search?${params.toString()}`; // Construct URL with search keyword

    setLoading(true); // Set loading state to true
    if (isReplace) {
      router.replace(url);
    } else {
      router.push(url);
    }
  }

  function handleKeyup(e: any) {
    // Handle Enter key press for triggering search
    if (e.key === "Enter" || e.keyCode === 13) {
      handleSearch();
    }
  }

  const t = useTranslations(); // Translation function

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
          className={`border-none active:bg-default ${
            loading ? "cursor-progress" : "" // Change cursor to progress when loading
          }`}
          variant="ghost"
          onClick={handleSearch}
        >
          {loading ? ( // Show spinner if loading, else show search icon
            <Spinner size="sm" />
          ) : (
            <SearchIcon className="text-xl text-default-400 pointer-events-none flex-shrink-0" />
          )}
        </Button>
      }
      labelPlacement="outside"
      placeholder={t("Search.placeholder")}
      value={keyword}
      onKeyUp={handleKeyup}
      onValueChange={setKeyword}
    />
  );
}
