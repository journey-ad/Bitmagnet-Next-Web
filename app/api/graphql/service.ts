type Torrent = {
  info_hash: Buffer; // The hash info of the torrent
  name: string; // The name of the torrent
  size: string; // The size of the torrent
  files_count: number; // The count of files in the torrent
  files: TorrentFile[]; // The list of files in the torrent
  created_at: number; // The timestamp when the torrent was created
  updated_at: number; // The timestamp when the torrent was last updated
};

type TorrentFile = {
  index: number; // The index of the file in the torrent
  path: string; // The path of the file in the torrent
  size: string; // The size of the file in the torrent
  extension: string; // The extension of the file
};

const REGEX_PADDING_FILE = /^(_____padding_file_|\.pad\/\d+&)/; // Regular expression to identify padding files

export function formatTorrent(row: Torrent) {
  const hash = row.info_hash.toString("hex"); // Convert info_hash from Buffer to hex string

  return {
    hash: hash,
    name: row.name,
    size: row.size,
    magnet_uri: `magnet:?xt=urn:btih:${hash}&dn=${encodeURIComponent(row.name)}&xl=${row.size}`, // Create magnet URI
    single_file: row.files_count <= 1,
    files_count: row.files_count || 1,
    files: (row.files_count > 0
      ? row.files
      : [
          {
            index: 0,
            path: row.name,
            size: row.size,
            extension: row.name.split(".").pop() || "",
          },
        ]
    )
      .map((file) => ({
        index: file.index,
        path: file.path,
        size: file.size,
        extension: file.extension,
      }))
      .sort((a, b) => {
        // Sorting priority: padding_file lowest -> extension empty next -> ascending index
        const aPadding = REGEX_PADDING_FILE.test(a.path) ? 1 : 0;
        const bPadding = REGEX_PADDING_FILE.test(b.path) ? 1 : 0;

        if (aPadding !== bPadding) {
          return aPadding - bPadding; // padding_file has the lowest priority
        }

        const aNoExtension = !a.extension ? 1 : 0;
        const bNoExtension = !b.extension ? 1 : 0;

        if (aNoExtension !== bNoExtension) {
          return aNoExtension - bNoExtension; // Files with no extension have lower priority
        }

        return a.index - b.index; // Within the same priority, sort by index in ascending order
      }),
    created_at: Math.floor(row.created_at / 1000), // Convert timestamps to seconds
    updated_at: Math.floor(row.updated_at / 1000), // Convert timestamps to seconds
  };
}
