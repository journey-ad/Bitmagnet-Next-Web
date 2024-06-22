import { tag } from "@node-rs/jieba";

const requiredTags = [
  ["n", "nr", "ns", "nt", "nz"], // noun
  "vn", // gerund
  "x", // other
].flat();

export function jiebaCut(text: string) {
  // return cut(text, true);
  return tag(text, true).map((_) => ({
    keyword: _.word,
    required: requiredTags.includes(_.tag),
  }));
}
