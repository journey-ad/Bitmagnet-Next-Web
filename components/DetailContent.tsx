"use client";

import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Divider,
  Link,
  Button,
} from "@nextui-org/react";
import { useTranslations } from "next-intl";

import { TorrentItemProps } from "@/types";
import { formatByteSize, formatDate, setClipboard, Toast } from "@/utils";
import useBreakpoint from "@/hooks/useBreakpoints";
import FileList from "@/components/FileList";
import { CopyIcon } from "@/components/icons";

export const DetailContent = ({ data }: { data: TorrentItemProps }) => {
  const t = useTranslations();
  const { isXs } = useBreakpoint();

  return (
    <>
      {/* Torrent name */}
      <h1 className="text-xl md:text-2xl break-all">{data.name}</h1>

      {/* Magnet link and file list */}
      <div className="grid grid-cols-1 gap-5">
        {/* Torrent details card */}
        <Card className="bg-opacity-80">
          <CardHeader className="flex py-2 bg-gray-100 dark:bg-slate-800">
            {t("Detail.details")}
          </CardHeader>
          <Divider className="bg-gray-200 dark:bg-slate-700" />
          <CardBody>
            <div className="flex flex-col gap-y-[2px] break-all text-xs md:text-sm text-gray-600">
              <span>
                {t("Search.file_size")}
                {formatByteSize(data.size)}
              </span>
              <span>
                {t("Search.file_count")}
                {data.files.length}
              </span>
              <span>
                {t("Search.created_at")}
                {formatDate(data.created_at, t("COMMON.DATE_FORMAT"))}
              </span>
              <span>
                {t("Search.hash")}
                <span className="border rounded-sm px-1 font-mono bg-gray-100">
                  {data.hash}
                </span>
              </span>
            </div>
          </CardBody>
        </Card>

        {/* Magnet link card */}
        <Card className="bg-opacity-80">
          <CardHeader className="flex py-2 bg-gray-100 dark:bg-slate-800">
            {t("Detail.magnet")}
          </CardHeader>
          <Divider className="bg-gray-200 dark:bg-slate-700" />
          <CardBody>
            <div className="flex mb-1 break-all">
              <span className="mr-1 pointer-events-none select-none dark:brightness-90">
                🧲
              </span>
              <Link className="text-sm" href={data.magnet_uri}>
                {`magnet:?xt=urn:btih:${data.hash}`}
              </Link>
            </div>
            <div className="mt-1">
              <Button
                className="bg-opacity-80"
                color="primary"
                radius="sm"
                size={isXs ? "sm" : "md"}
                startContent={<CopyIcon />}
                variant="flat"
                onClick={() => {
                  setClipboard(data.magnet_uri);
                  Toast.success(t("Toast.copy_success"));
                }}
              >
                {t("Detail.copy")}
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* File list card */}
        <Card className="bg-opacity-80">
          <CardHeader className="flex py-2 bg-gray-100 dark:bg-slate-800">
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
                {t("Search.file_size")}
                {formatByteSize(data.size)}
              </span>
              <span>
                {t("Search.file_count")}
                {data.files.length}
              </span>
              <span>
                {t("Search.created_at")}
                {formatDate(data.created_at, t("COMMON.DATE_FORMAT"))}
              </span>
            </div>
          </CardFooter>
        </Card>
      </div>
    </>
  );
};
