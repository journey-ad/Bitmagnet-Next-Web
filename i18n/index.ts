import { getRequestConfig } from "next-intl/server";
import { headers } from "next/headers";

export default getRequestConfig(async () => {
  // Provide a static locale, fetch a user setting,
  // read from `cookies()`, `headers()`, etc.

  const browserLocale = (() => {
    let locale = headers().get("accept-language") ?? "en";

    locale = locale?.split(",")[0];

    if (!locale.startsWith("zh")) {
      locale = locale.split("-")[0];
    }

    return locale;
  })();

  const locale = browserLocale;

  return {
    locale,
    messages: (await import(`./locales/${locale}.json`)).default,
  };
});
