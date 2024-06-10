import dayjs from "dayjs";

import { SEARCH_KEYWORD_SPLIT_REGEX } from "@/config/constant";

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

export function formatByteSize(bytes: number | string) {
  bytes = Number(bytes);

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

export function getSizeColor(size: number | string) {
  size = Number(size);

  if (size < 1024 * 1024 * 2) {
    // < 2MB
    return "text-gray-400 bg-gray-100";
  } else if (size < 1024 * 1024 * 50) {
    // < 50MB
    return "text-gray-600 bg-gray-100";
  } else if (size < 1024 * 1024 * 200) {
    // < 200MB
    return "text-green-600 bg-green-100 opacity-90";
  } else if (size < 1024 * 1024 * 1024) {
    // < 1GB
    return "text-green-600 bg-green-100";
  } else {
    // > 1GB
    return "text-red-600 bg-red-100";
  }
}

export function parseHighlight(text: string, highlight: string) {
  const keywords = highlight
    .split(SEARCH_KEYWORD_SPLIT_REGEX)
    .filter((k: string) => k.trim() !== "");

  if (keywords.length === 0) {
    return text;
  }

  // Function to escape HTML special characters to avoid interference
  function escapeHtml(unsafe: string) {
    return unsafe.replace(/[&<>"'`=\/]/g, (match) => {
      return (
        {
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
          "`": "&#96;",
          "/": "&#x2F;",
          "=": "&#x3D;",
        }[match] || match
      );
    });
  }

  // Function to highlight the keywords
  function highlightKeywords(text: string, keyword: string) {
    const regex = new RegExp(`(${escapeHtml(keyword)})(?![^<>]*>)`, "gi");

    return text.replace(
      regex,
      `<span class="text-red-400 font-bold">$1</span>`,
    );
  }

  let highlightedText = text;

  keywords.forEach((keyword) => {
    highlightedText = highlightKeywords(highlightedText, keyword);
  });

  return highlightedText;
}

export function setClipboard(text: string) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text);
  } else {
    const textarea = document.createElement("textarea");

    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  }

  return true;
}

export const $env = {
  get isServer() {
    return typeof window === "undefined";
  },
  get isMobile() {
    return (
      !this.isServer &&
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent,
      )
    );
  },

  get isDesktop() {
    return !this.isServer && !this.isMobile;
  },
};
