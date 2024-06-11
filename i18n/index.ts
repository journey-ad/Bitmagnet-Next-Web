import { getRequestConfig } from "next-intl/server";
import { headers, cookies } from "next/headers";
import { mergeDeep } from "@apollo/client/utilities";

import { defaultLocale } from "./config";

export default getRequestConfig(async () => {
  // Provide a static locale, fetch a user setting,
  // read from `cookies()`, `headers()`, etc.

  const browserLocale = (() => {
    let locale = headers().get("accept-language") ?? "";

    locale = locale?.split(",")[0];

    if (!locale.startsWith("zh")) {
      locale = locale.split("-")[0];
    }

    return locale;
  })();

  const cookieLocale = (() => {
    const locale = cookies().get("NEXT_LOCALE")?.value;

    return locale;
  })();

  const locale = cookieLocale || browserLocale || defaultLocale;

  const defaultLocaleFile = (await import(`./locales/${defaultLocale}.json`))
    .default;

  if (!defaultLocaleFile) {
    throw new Error("Default locale file not found");
  }

  try {
    const localeFile = (await import(`./locales/${locale}.json`)).default;

    const localeMessages = mergeDeep(defaultLocaleFile, localeFile);

    return {
      locale,
      messages: localeMessages,
    };
  } catch (error) {
    return {
      locale: defaultLocale,
      messages: defaultLocaleFile,
    };
  }
});
