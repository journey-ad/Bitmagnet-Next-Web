/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
"use client";

import { Input, Button, Spinner } from "@nextui-org/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import clsx from "clsx";

import { SearchIcon } from "@/components/icons";
import { $env } from "@/utils";

export const SearchInput = ({
  defaultValue = "",
  isReplace = false,
}: {
  defaultValue?: string;
  isReplace?: boolean;
}) => {
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(false);
  const [errMessage, setErrMessage] = useState("");
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

    // If keyword is empty, do nothing
    if (!keyword) {
      return;
    }

    // If search params equals current search params, do nothing
    if (searchParams.get("keyword") === keyword && !searchParams.get("p")) {
      return;
    }

    if (keyword.length < 2) {
      // If keyword length is less than 2, display warning toast
      // Toast.warn(t("Toast.keyword_too_short"));
      setErrMessage(t("Toast.keyword_too_short"));

      return;
    }

    if (keyword.length > 100) {
      // limit keyword length to 100 characters
      setKeyword(keyword.slice(0, 100));
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
      // If on desktop, trigger search
      if (!$env.isMobile) {
        handleSearch();
      }

      // Blur input, on mobile that will trigger search
      e.target.blur();
    }
  }

  function handleBlur() {
    if ($env.isMobile) {
      // If on mobile, trigger search
      handleSearch();
    }

    setActive(false);
  }

  function handleFocus() {
    setErrMessage("");
    setActive(true);
  }

  const t = useTranslations(); // Translation function

  return (
    <Input
      aria-label="Search"
      classNames={{
        inputWrapper: "h-12 px-4 bg-default-100",
        input: "text-base",
        helperWrapper: "absolute bottom-[-25px]",
      }}
      defaultValue={defaultValue}
      endContent={
        <>
          <span
            className={clsx(
              "p-2 -m-2 z-10 invisible absolute right-[60px] appearance-none select-none opacity-0 hover:!opacity-60 cursor-pointer active:!opacity-40 rounded-full outline-none text-large transition-opacity motion-reduce:transition-none",
              { "!visible opacity-40": active && !!keyword }, // Show clear button if keyword is not empty
            )}
            onPointerDown={() => setKeyword("")}
          >
            <svg
              aria-hidden="true"
              focusable="false"
              height="1em"
              role="presentation"
              viewBox="0 0 24 24"
              width="1em"
            >
              <path
                d="M12 2a10 10 0 1010 10A10.016 10.016 0 0012 2zm3.36 12.3a.754.754 0 010 1.06.748.748 0 01-1.06 0l-2.3-2.3-2.3 2.3a.748.748 0 01-1.06 0 .754.754 0 010-1.06l2.3-2.3-2.3-2.3A.75.75 0 019.7 8.64l2.3 2.3 2.3-2.3a.75.75 0 011.06 1.06l-2.3 2.3z"
                fill="currentColor"
              />
            </svg>
          </span>
          <Button
            isIconOnly
            className={clsx(
              "border-none active:bg-default",
              { "cursor-progress": loading }, // Change cursor to progress when loading
            )}
            variant="ghost"
            onClick={handleSearch}
          >
            {loading ? ( // Show spinner if loading, else show search icon
              <Spinner size="sm" />
            ) : (
              <SearchIcon className="text-xl text-default-400 pointer-events-none flex-shrink-0" />
            )}
          </Button>
        </>
      }
      errorMessage={errMessage}
      isInvalid={!!errMessage}
      labelPlacement="outside"
      placeholder={t("Search.placeholder")}
      value={keyword}
      onBlur={handleBlur}
      onFocus={handleFocus}
      onKeyUp={handleKeyup}
      onValueChange={setKeyword}
    />
  );
};
