"use client";

const fileTypeIcons = {
  file: "📄",
  image: "🖼️",
  video: "🎞️",
  audio: "🎵",
  archive: "📦️",
  disk: "💿",
  executable: "⚙️",
};

const extensionMap = {
  audio: [
    "mp3",
    "wav",
    "ogg",
    "m4a",
    "flac",
    "wma",
    "aac",
    "aiff",
    "alac",
    "amr",
    "mid",
    "midi",
  ],
  image: [
    "jpg",
    "jpeg",
    "png",
    "gif",
    "bmp",
    "svg",
    "webp",
    "tiff",
    "ico",
    "heic",
    "raw",
  ],
  video: [
    "mp4",
    "mkv",
    "webm",
    "avi",
    "mov",
    "flv",
    "wmv",
    "mpeg",
    "mpg",
    "3gp",
    "3g2",
    "m4v",
    "rm",
    "rmvb",
    "asf",
    "ts",
    "m2ts",
    "vob",
    "mxf",
    "ogv",
  ],
  archive: [
    "zip",
    "rar",
    "7z",
    "gz",
    "bz2",
    "tar",
    "iso",
    "xpi",
    "rpm",
    "cab",
    "lzh",
    "dmg",
    "z",
    "lz",
    "xz",
    "tgz",
    "tbz2",
  ],
  disk: ["iso", "img", "vmdk", "vdi"],
  executable: [
    "exe",
    "msi",
    "apk",
    "xpi",
    "deb",
    "rpm",
    "dmg",
    "bat",
    "sh",
    "bin",
    "cmd",
    "run",
    "app",
  ],
};

const getFileTypeIcon = (extension?: string) => {
  if (!extension) return fileTypeIcons.file;

  extension = String(extension).toLowerCase();

  for (const [type, extensions] of Object.entries(extensionMap)) {
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

  return <span className={className}>{icon}</span>;
}
