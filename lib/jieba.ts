import { load, cut, extract } from "@node-rs/jieba";

let jiebaLoaded = false;

export function loadJieba() {
  if (!jiebaLoaded) {
    load();
    jiebaLoaded = true;
  }
}

export function jiebaCut(text: string) {
  return cut(text);
}

export function jiebaExtract(text: string) {
  return extract(text, 3).map((_) => _.keyword);
}
