// Define search parameters
export const SEARCH_PARAMS = {
  sortType: ["default", "size", "count", "date"],
  filterSize: [
    "all",
    "lt100mb",
    "gt100mb-lt500mb",
    "gt500mb-lt1gb",
    "gt1gb-lt5gb",
    "gt5gb",
  ],
  filterTime: ["all", "gt-1day", "gt-7day", "gt-31day", "gt-365day"],
} as const;

// Tokenizer for search keywords
export const SEARCH_KEYWORD_SPLIT_REGEX =
  /[.,!?;—()\[\]{}<>@#%^&*~`"'|\-，。！？；“”‘’“”「」『』《》、【】……（）·　\s]/g;

// Using for Search page
export const SEARCH_DISPLAY_FILES_MAX = 10;
export const SEARCH_KEYWORD_LENGTH_MIN = 2;
export const SEARCH_KEYWORD_LENGTH_MAX = 100;
export const SEARCH_PAGE_SIZE = 10;
export const SEARCH_PAGE_MAX = 100;

export const DEFAULT_SORT_TYPE = "default";
export const DEFAULT_FILTER_TIME = "all";
export const DEFAULT_FILTER_SIZE = "all";

// TODO: Support UI_HIDE_PADDING_FILE
export const UI_HIDE_PADDING_FILE = true; // https://www.bittorrent.org/beps/bep_0047.html

export const UI_BACKGROUND_ANIMATION = true;

export const UI_BREAKPOINTS = {
  xs: "(max-width: 649px)",
  sm: "(min-width: 650px)",
  md: "(min-width: 960px)",
  lg: "(min-width: 1280px)",
  xl: "(min-width: 1400px)",
};
