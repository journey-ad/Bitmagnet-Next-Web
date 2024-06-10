"use client";

import {
  FileTypeAudioIcon,
  FileTypeBookIcon,
  FileTypeFileIcon,
  FileTypeFolderIcon,
  FileTypeImageIcon,
  FileTypeVideoIcon,
  FileTypeWebIcon,
  FileTypeArchiveIcon,
  FileTypeDiskIcon,
  FileTypeExecutableIcon,
} from "@/components/icons";

const fileTypeIcons = {
  folder: <FileTypeFolderIcon />, // 📁
  file: <FileTypeFileIcon />, // 📄,
  image: <FileTypeImageIcon />, // 🖼️,
  video: <FileTypeVideoIcon />, // 🎞️,
  audio: <FileTypeAudioIcon />, // 🎵,
  book: <FileTypeBookIcon />, // 📚,
  web: <FileTypeWebIcon />, // 🌐,
  archive: <FileTypeArchiveIcon />, // 📦️,
  disk: <FileTypeDiskIcon />, // 💿,
  executable: <FileTypeExecutableIcon />, // ⚙️,
};

const extensionMap = {
  folder: "folder",
  audio: "mp3,wav,ogg,m4a,flac,wma,aac,mid,midi,cue",
  image: "jpg,jpeg,png,gif,bmp,svg,webp,tiff,ico,heic,raw,psd,ai",
  video: "mp4,mkv,webm,avi,mov,flv,wmv,mpeg,mpg,3gp,3g2,m4v,rm,rmvb,ts,m2ts",
  book: "pdf,epub,fb2,mobi,azw,azw3,cbr,cbz,chm",
  web: "torrent,html,htm,php,url,asp,aspx,jsp",
  archive: "zip,rar,7z,gz,bz2,tar,xpi,rpm,cab,lzh,dmg,z,lz,xz,tgz,tbz2",
  disk: "iso,img,vmdk,vdi",
  executable: "exe,msi,apk,xpi,deb,bat,sh,bin,dll,so,cmd,com,run,vbs,app",
};

const extensionArr = Object.fromEntries(
  Object.entries(extensionMap).map(([key, value]) => [key, value.split(",")]),
);

const getFileTypeIcon = (extension?: string) => {
  if (!extension) return fileTypeIcons.file;

  extension = String(extension).toLowerCase();

  for (const [type, extensions] of Object.entries(extensionArr)) {
    if (extensions.includes(extension)) {
      return fileTypeIcons[type as keyof typeof fileTypeIcons];
    }
  }

  return fileTypeIcons.file; // Default icon for unknown file types
};

export default function FileTypeIcon({
  extension,
  className,
}: {
  extension?: string;
  className?: string;
}) {
  const icon = getFileTypeIcon(extension);

  const defaultClassName = "inline-block align-middle text-[1.3em]";

  if (!className) className = defaultClassName;
  else className = `${defaultClassName} ${className}`;

  return <span className={className}>{icon}</span>;
}
