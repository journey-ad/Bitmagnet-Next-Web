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
import { Metadata } from "next";

import { TorrentItemProps } from "@/types";
import { base64ToHex, formatByteSize, formatDate } from "@/utils";
import apiFetch from "@/utils/api";
import FileTypeIcon from "@/components/FileTypeIcon";
import Search from "@/components/search";
import { MagnetIcon } from '@/components/icons';

async function fetchData(hash64: string) {
  const hash = base64ToHex(hash64);
  const data = await apiFetch(`/api/detail?hash=${hash}`);

  return data;
}

const DetailContent = ({ data }: { data: TorrentItemProps }) => {
  const t = useTranslations();

  return (
    <>
      <h1 className="text-2xl">{data.name}</h1>
      <div className="flex gap-x-2 text-sm text-gray-500">
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
      <Divider className="bg-gray-200 dark:bg-slate-800" />
      <div className="grid grid-cols-1 gap-5">
        <Card>
          <CardHeader className="flex gap-3 bg-gray-100 dark:bg-slate-800">
            {t("Detail.magnet")}
          </CardHeader>
          <Divider className="bg-gray-200 dark:bg-slate-700" />
          <CardBody>
            <div className="flex mb-1 break-all">
              <span className="pointer-events-none select-none">🧲</span>
              <Link
                className="text-sm"
                href={data.magnet_uri}
              >{`magnet:?xt=urn:btih:${data.hash}`}</Link>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="flex gap-3 bg-gray-100 dark:bg-slate-800">
            {t("Detail.file_list")}
          </CardHeader>
          <Divider className="bg-gray-200 dark:bg-slate-700" />
          <CardBody>
            <ul>
              {data.files.map((file) => (
                <li key={file.index} className="flex items-center mb-1">
                  <FileTypeIcon className="mr-1" extension={file.extension} />
                  <span className="text-sm">{file.path}</span>
                  <Chip
                    className="h-5 mx-1 px-[2px] text-[10px] font-bold"
                    classNames="font-bold"
                    size="sm"
                  >
                    {formatByteSize(file.size)}
                  </Chip>
                </li>
              ))}
            </ul>
          </CardBody>
          <Divider className="bg-gray-200 dark:bg-slate-700" />
          <CardFooter className="bg-gray-100 dark:bg-slate-800">
            <div className="flex gap-x-2 ml-2 text-sm text-gray-500">
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

export default async function Detail({
  params: { hash64 },
}: {
  params: { hash64: string };
}) {
  const { data } = await fetchData(hash64);

  return (
    <>
      <div className="flex items-center max-w-xl mb-4">
        <Link className="mr-4 text-5xl" href="/">
          <MagnetIcon />
        </Link>
        <Search />
      </div>
      <DetailContent data={data} />
    </>
  );
}
