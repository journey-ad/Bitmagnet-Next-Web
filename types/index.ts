import { SVGProps } from "react";

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

export type SearchResultsListProps = {
  torrents: TorrentItemProps[];
  total_count: number;
  has_more: boolean;
};

export type TorrentItemProps = {
  hash: string;
  name: string;
  size: number;
  magnet_uri: string;
  single_file: boolean;
  files_count: number;
  files: {
    index: number;
    path: string;
    size: number;
    extension: string;
  }[];
  created_at: number;
  updated_at: number;
};
