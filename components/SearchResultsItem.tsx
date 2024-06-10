"use client";

import React from "react";
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Divider,
  Link,
} from "@nextui-org/react";
import { useTranslations } from "next-intl";

import { TorrentItemProps } from "@/types";
import {
  $env,
  hexToBase64,
  formatByteSize,
  formatDate,
  parseHighlight,
  setClipboard,
} from "@/utils";
import FileList from "@/components/FileList";
import { SEARCH_DISPLAY_FILES_MAX } from "@/config/constant";
import { Toast } from "@/utils/Toast";

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

  const t = useTranslations();

  return (
    <Card className="w-full bg-opacity-80 dark:brightness-95">
      <CardHeader className="flex gap-3 bg-gray-100 dark:bg-slate-800">
        <div className="flex flex-col break-all">
          <Link isExternal href={data.url}>
            <h2
              dangerouslySetInnerHTML={{
                __html: parseHighlight(data.name, keyword),
              }}
              className="text-md leading-normal"
            />
          </Link>
        </div>
      </CardHeader>
      <Divider className="bg-gray-200 dark:bg-slate-700" />
      <CardBody className="md:px-4">
        <FileList
          highlight={keyword}
          max={SEARCH_DISPLAY_FILES_MAX}
          torrent={data as TorrentItemProps}
        />
      </CardBody>
      <Divider className="bg-gray-200 dark:bg-slate-700" />
      <CardFooter className="bg-gray-100 dark:bg-slate-800 flex-row-reverse p-2 md:flex-row md:p-3">
        <Link
          className="text-sm"
          href={data.magnet_uri}
          onPress={() =>
            $env.isMobile &&
            setClipboard(data.magnet_uri) &&
            Toast.success(t("Toast.copy_success"))
          }
        >
          <span className="pointer-events-none select-none dark:brightness-90">
            🧲
          </span>
          {t("Search.magnet")}
        </Link>
        <div className="flex flex-col mr-auto gap-x-2 text-xs text-gray-500 md:flex-row md:mr-0 md:ml-2 md:text-sm">
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
