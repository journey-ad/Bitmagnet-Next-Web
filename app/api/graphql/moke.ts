import mokeData from "@/moke";

export function search() {
  return mokeData.search;
}

export function torrentByHash() {
  return mokeData.detail;
}

export function statsInfo() {
  return mokeData.stats;
}
