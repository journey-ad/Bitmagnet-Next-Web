"use client";

import React from "react";
import { Link, Chip } from "@nextui-org/react";
import { useTranslations } from "next-intl";

import { TorrentItemProps } from "@/types";
import {
  hexToBase64,
  formatByteSize,
  getSizeColor,
  parseHighlight,
} from "@/utils";
import FileTypeIcon from "@/components/FileTypeIcon";

type FileItem = TorrentItemProps["files"][0] & {
  index: number | string;
  path: string;
  extension?: string;
  size?: number | string;
  type: "file";
  name: string;
};

type Directory = {
  index: string;
  type: "folder";
  name: string;
  path: string;
  children: (Directory | FileItem)[];
};

/**
 * Constructs a file tree from a flat list of file items.
 *
 * @param {FileItem[]} data - The flat list of file items.
 * @param {number} [maxDepth=3] - The maximum depth of the tree.
 * @returns {Directory[]} The constructed file tree.
 */
function fileTree(data: FileItem[], maxDepth: number = 3): Directory[] {
  const root: Directory = {
    index: "root",
    type: "folder",
    name: "",
    path: "",
    children: [],
  };

  for (const file of data) {
    const parts = file.path.split("/");
    const rootName = parts[0];

    if (parts.length === 1) {
      // This is a root-level file
      file.type = "file";
      file.name = rootName;
      root.children.push(file);
      continue;
    }

    let currentLevel = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];

      if (i === parts.length - 1) {
        // It's the last part, so it's a file
        file.type = "file";
        file.name = part;
        currentLevel.children.push(file);
      } else if (i === maxDepth) {
        // If max depth is reached, treat remaining parts as part of the file name
        const remainingPath = parts.slice(i).join("/");
        const sub = {
          ...file,
          path: remainingPath,
          name: remainingPath,
          type: "file",
        };

        currentLevel.children.push(sub as FileItem);
        break;
      } else {
        let nextLevel = currentLevel.children.find(
          (child): child is Directory => {
            return child.type === "folder" && child.name === part;
          },
        );

        if (!nextLevel) {
          nextLevel = {
            index: "_" + part,
            type: "folder",
            name: part,
            path: part, // Path is now just the part name
            children: [],
          };
          currentLevel.children.push(nextLevel);
        }

        currentLevel = nextLevel;
      }
    }
  }

  return root.children as Directory[];
}

/**
 * Renders a file or directory item.
 *
 * @param {Object} props - The component props.
 * @param {FileItem | Directory} props.file - The file or directory item.
 * @param {string} [props.highlight] - The text to highlight.
 * @returns {JSX.Element} The rendered file item.
 */
function FileItem({
  file,
  highlight,
}: {
  file: FileItem | Directory;
  highlight?: string;
}) {
  return (
    <li
      key={file.index}
      className="flex flex-col justify-center mb-1"
      data-extension={file.type === "file" ? file.extension : null}
      data-index={file.index}
      data-name={file.name}
      data-path={file.path}
      data-size={file.type === "file" ? file.size : null}
      data-type={file.type}
    >
      <div className="file-item flex text-xs md:text-sm">
        <FileTypeIcon
          className="mr-1 mb-auto dark:brightness-80"
          extension={file.type === "folder" ? "folder" : file.extension}
        />
        <span
          dangerouslySetInnerHTML={{
            __html: highlight
              ? parseHighlight(file.name, highlight)
              : file.name,
          }}
          className={
            "min-w-0 break-all " +
            (file.type === "folder" ? "text-default-500" : "")
          }
          title={file.path}
        />
        {file.type === "file" && file.size && (
          <Chip
            className={`h-5 mx-1 mb-auto px-[2px] text-[10px] font-bold dark:invert dark:brightness-105 ${getSizeColor(
              file.size,
            )}`}
            size="sm"
          >
            {formatByteSize(file.size)}
          </Chip>
        )}
      </div>
      {file.type === "folder" && (
        <ul className="sub-list pl-6">
          {file.children.map((child) => (
            <FileItem key={child.index} file={child} highlight={highlight} />
          ))}
        </ul>
      )}
    </li>
  );
}

/**
 * Renders a file list for a torrent.
 *
 * @param {Object} props - The component props.
 * @param {TorrentItemProps} props.torrent - The torrent data.
 * @param {string} [props.highlight] - The text to highlight.
 * @param {number} [props.max=-1] - The maximum number of files to show.
 * @returns {JSX.Element} The rendered file list.
 */
export default function FileList({
  torrent,
  highlight,
  max = -1,
}: {
  torrent: TorrentItemProps;
  highlight?: string;
  max?: number;
}) {
  const t = useTranslations();
  const list = max > 0 ? torrent.files.slice(0, max) : torrent.files;

  const tree = fileTree(list as FileItem[], 3);

  return (
    <ul>
      {tree.map((file) => (
        <FileItem key={file.index} file={file} highlight={highlight} />
      ))}
      {max > 0 && torrent.files.length > max && (
        <Link
          isExternal
          className="text-sm italic text-gray-500"
          href={`/detail/${hexToBase64(torrent.hash)}`}
        >
          {t("Search.more_files", {
            count: torrent.files.length - max,
          })}
        </Link>
      )}
    </ul>
  );
}
