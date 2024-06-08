"use client";

import React from "react";
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Divider,
  Link,
  Chip,
} from "@nextui-org/react";
import { useTranslations } from "next-intl";

import { TorrentItemProps } from "@/types";
import { hexToBase64, formatByteSize, formatDate } from "@/utils";
import FileTypeIcon from "@/components/FileTypeIcon";

const MAX_DISPLAY_FILES = 10;

export default function SearchResultsItem({
  item,
  keyword,
}: {
  item: TorrentItemProps;
  keyword: string;
}) {
  const data = {
    ...item,
    name: item.name,
    url: `/detail/${hexToBase64(item.hash)}`,
    files: item.single_file
      ? [
          {
            index: 0,
            path: item.name,
            size: item.size,
            extension: item.name.split(".").pop(),
          },
        ]
      : item.files,
  };

  // 将匹配的关键字替换为带有样式的高亮关键字
  const highlightedText = (text: string) => {
    if (!keyword || !text) return text;

    return text.replace(
      new RegExp(keyword, "gi"),
      `<span class="text-red-400 font-bold">${keyword}</span>`,
    );
  };

  const t = useTranslations();

  return (
    <Card className="w-full">
      <CardHeader className="flex gap-3 bg-gray-100 dark:bg-slate-800">
        <div className="flex flex-col">
          <Link isExternal href={data.url}>
            <h2
              dangerouslySetInnerHTML={{ __html: highlightedText(data.name) }}
              className="text-md leading-normal"
            />
          </Link>
        </div>
      </CardHeader>
      <Divider className="bg-gray-200 dark:bg-slate-700" />
      <CardBody>
        <ul>
          {data.files.slice(0, MAX_DISPLAY_FILES).map((file) => (
            <li key={file.index} className="flex items-center mb-1">
              <FileTypeIcon
                className="mr-1 mb-auto"
                extension={file.extension}
              />
              <span
                dangerouslySetInnerHTML={{
                  __html: highlightedText(file.path),
                }}
                className="text-sm"
              />
              <Chip
                className="h-5 mx-1 mb-auto px-[2px] text-[10px] font-bold"
                classNames="font-bold"
                size="sm"
              >
                {formatByteSize(file.size)}
              </Chip>
            </li>
          ))}
          {data.files.length > MAX_DISPLAY_FILES && (
            <li className="text-sm italic text-gray-500">
              {t("Search.more_files", {
                count: data.files.length - MAX_DISPLAY_FILES,
              })}
            </li>
          )}
        </ul>
      </CardBody>
      <Divider className="bg-gray-200 dark:bg-slate-700" />
      <CardFooter className="bg-gray-100 dark:bg-slate-800">
        <Link className="text-sm" href={data.magnet_uri}>
          <span className="pointer-events-none select-none">🧲</span>
          {t("Search.magnet")}
        </Link>
        <div className="flex gap-x-2 ml-2 text-sm text-gray-500">
          <span>
            {t("Search.file_size", { size: formatByteSize(data.size) })}
          </span>
          <span>{t("Search.file_count", { count: data.files.length })}</span>
          <span>
            {t("Search.created_at", {
              time: formatDate(data.created_at, t("COMMON.DATE_FORMAT")),
            })}
          </span>
        </div>
      </CardFooter>
    </Card>
  );
}
