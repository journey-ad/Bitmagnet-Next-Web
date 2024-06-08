import dayjs from "dayjs";

export function hexToBase64(hexString: string) {
  const binary = Buffer.from(hexString, "hex");
  let base64 = binary.toString("base64");

  base64 = base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  return base64;
}

export function base64ToHex(base64String: string) {
  let base64 = base64String.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);

  base64 = base64 + padding;
  const binary = Buffer.from(base64, "base64");

  return binary.toString("hex");
}

export function formatByteSize(bytes: number) {
  if (bytes === 0) return "0 B";

  const units = ["B", "KB", "MB", "GB", "TB"];
  const base = 1024;
  const digitGroups = Math.floor(Math.log(bytes) / Math.log(base));
  const convertedSize = (bytes / Math.pow(base, digitGroups)).toFixed(2);

  return `${convertedSize} ${units[digitGroups]}`;
}

export function formatDate(ts: number, format = "YYYY-MM-DD HH:mm:ss") {
  return dayjs.unix(ts).format(format);
}
