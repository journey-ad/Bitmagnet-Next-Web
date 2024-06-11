"use client";

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
import { $env, formatByteSize, formatDate, setClipboard, Toast } from "@/utils";
import FileList from "@/components/FileList";

export const DetailContent = ({ data }: { data: TorrentItemProps }) => {
  const t = useTranslations();

  return (
    <>
      {/* Torrent name */}
      <h1 className="text-2xl">{data.name}</h1>

      {/* Torrent details */}
      <div className="flex gap-x-2 text-xs md:text-sm text-gray-500">
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

      <Divider className="bg-gray-300 dark:bg-slate-800" />

      {/* Magnet link and file list */}
      <div className="grid grid-cols-1 gap-5">
        {/* Magnet link card */}
        <Card className="bg-opacity-80">
          <CardHeader className="flex gap-3 bg-gray-100 dark:bg-slate-800">
            {t("Detail.magnet")}
          </CardHeader>
          <Divider className="bg-gray-200 dark:bg-slate-700" />
          <CardBody>
            <div className="flex mb-1 break-all">
              <span className="mr-1 pointer-events-none select-none dark:brightness-90">
                🧲
              </span>
              <Link
                className="text-sm"
                href={data.magnet_uri}
                onClick={(e) => {
                  if ($env.isMobile) {
                    e.preventDefault();
                    setClipboard(data.magnet_uri);
                    Toast.success(t("Toast.copy_success"));
                  }
                }}
              >
                {`magnet:?xt=urn:btih:${data.hash}`}
              </Link>
            </div>
          </CardBody>
        </Card>

        {/* File list card */}
        <Card className="bg-opacity-80">
          <CardHeader className="flex gap-3 bg-gray-100 dark:bg-slate-800">
            {t("Detail.file_list")}
          </CardHeader>
          <Divider className="bg-gray-200 dark:bg-slate-700" />
          <CardBody className="md:px-4">
            <FileList torrent={data as TorrentItemProps} />
          </CardBody>
          <Divider className="bg-gray-200 dark:bg-slate-700" />
          <CardFooter className="bg-gray-100 dark:bg-slate-800 p-2 px-3">
            <div className="flex flex-col mr-auto gap-x-2 text-xs text-gray-500 md:flex-row md:mr-0 md:ml-2 md:text-sm">
              <span>
                {t("Search.file_size", { size: formatByteSize(data.size) })}
              </span>
              <span>
                {t("Search.file_count", { count: data.files.length })}
              </span>
              <span>
                {t("Search.created_at", {
                  time: formatDate(data.created_at, t("COMMON.DATE_FORMAT")),
                })}
              </span>
            </div>
          </CardFooter>
        </Card>
      </div>
    </>
  );
};
