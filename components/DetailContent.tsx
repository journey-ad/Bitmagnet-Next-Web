"use client";

import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Divider,
  Link,
  Button,
  Image,
  Modal,
  ModalContent,
  ModalBody,
  useDisclosure,
} from "@nextui-org/react";
import { useTranslations } from "next-intl";
import { useEffect, useState, Suspense } from "react";

import { TorrentItemProps } from "@/types";
import {
  formatByteSize,
  formatDate,
  GetLinkInfoFromWhatsLinkResponse,
  setClipboard,
  Toast,
} from "@/utils";
import useBreakpoint from "@/hooks/useBreakpoints";
import FileList from "@/components/FileList";
import { CopyIcon } from "@/components/icons";
import EmblaCarousel from "@/components//EmblaCarousel";
import { useHydration } from "@/hooks/useHydration";

const Preview = ({
  linkInfo,
}: {
  linkInfo: Promise<GetLinkInfoFromWhatsLinkResponse>;
}) => {
  const t = useTranslations();

  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [curIdx, setCurIdx] = useState(0);
  const [linkData, setLinkData] = useState<GetLinkInfoFromWhatsLinkResponse>();

  useEffect(() => {
    linkInfo.then((data) => {
      // console.log("linkData", data);
      setLinkData(data);
    });
  }, [linkInfo]);

  if (!linkData || !linkData.screenshots) return null;

  const screenshots = linkData.screenshots ?? [];

  return (
    <>
      <Card className="bg-opacity-80">
        <CardHeader className="flex py-2 bg-gray-100 dark:bg-slate-800">
          {t("Detail.preview")}
        </CardHeader>
        <Divider className="bg-gray-200 dark:bg-slate-700" />
        <CardBody>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-3">
            {screenshots.map((item, index) => (
              <Image
                key={item.screenshot}
                isZoomed
                className="min-h-20 max-h-48 sm:min-h-28 cursor-pointer"
                classNames={{
                  wrapper: "w-full !max-w-full",
                  img: "w-full hover:scale-105 dark:brightness-50",
                }}
                radius="sm"
                src={item.screenshot}
                onClick={() => {
                  setCurIdx(index);
                  onOpen();
                }}
              />
            ))}
          </div>
          <Modal
            className="px-4 py-4 rounded-md !m-0"
            classNames={{
              body: "p-0",
              wrapper: "items-center justify-center",
              closeButton:
                "z-20 top-[10px] right-[10px] bg-default-500 text-[24px] text-white bg-opacity-40 hover:bg-default-600 dark:hover:text-default-200",
            }}
            isOpen={isOpen}
            size="2xl"
            onOpenChange={onOpenChange}
          >
            <ModalContent className="w-auto">
              {() => (
                <ModalBody>
                  <EmblaCarousel
                    images={screenshots.map((item) => item.screenshot)}
                    options={{
                      startIndex: curIdx,
                      duration: 22,
                      loop: true,
                    }}
                  />
                </ModalBody>
              )}
            </ModalContent>
          </Modal>
        </CardBody>
      </Card>
    </>
  );
};

export const DetailContent = ({
  data,
  linkInfo,
}: {
  data: TorrentItemProps;
  linkInfo: Promise<GetLinkInfoFromWhatsLinkResponse>;
}) => {
  const t = useTranslations();
  const { isXs } = useBreakpoint();

  const hydrated = useHydration();

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
            <div className="flex flex-col gap-y-[2px] break-all text-xs md:text-sm text-gray-600 dark:text-slate-400">
              <span>
                {t("Search.file_size")}
                {formatByteSize(data.size)}
              </span>
              <span>
                {t("Search.file_count")}
                {data.files.length}
              </span>
              <Suspense key={hydrated ? "load" : "loading"}>
                <span>
                  {t("Search.created_at")}
                  {formatDate(
                    data.created_at,
                    t("COMMON.DATE_FORMAT"),
                    !hydrated,
                  )}
                </span>
              </Suspense>
              <span>
                {t("Search.hash")}
                <span className="border rounded-sm px-1 font-mono bg-gray-100 dark:bg-inherit dark:border-slate-800">
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

        {/* Magnet content preview */}
        <Preview linkInfo={linkInfo} />

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
              <Suspense key={hydrated ? "load" : "loading"}>
                <span>
                  {t("Search.created_at")}
                  {formatDate(
                    data.created_at,
                    t("COMMON.DATE_FORMAT"),
                    !hydrated,
                  )}
                </span>
              </Suspense>
            </div>
          </CardFooter>
        </Card>
      </div>
    </>
  );
};
