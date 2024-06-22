"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";

export default function Error({
  error,
  reset: _reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    /* eslint-disable no-console */
    console.error(error);
  }, [error]);

  console.error("error", error.message, error.digest);

  const t = useTranslations("ERROR_MESSAGE");

  return (
    <div className="flex flex-col justify-center mx-auto w-4/5 pb-[10vh] max-w-lg h-full">
      <h1 className="mb-4 text-[30px] md:text-[50px] leading-tight font-medium text-gray-700">
        {t("INTERNAL_SERVER_ERROR")}
      </h1>

      <div className="flex flex-col gap-y-1 w-full mb-6 break-words leading-tight text-sm md:text-lg text-gray-600">
        <p className="mb-2">
          <span className="font-medium">{t("Message")}</span>: {error.message}
        </p>
        <p>
          <span className="font-medium">{t("Digest")}</span>: {error.digest}
        </p>
      </div>

      <a
        className="px-4 py-2 mr-auto font-medium text-white bg-indigo-500 rounded-md hover:bg-indigo-600 transition-all duration-200 ease-in-out"
        href="/"
      >
        {t("GoHome")}
      </a>
    </div>
  );
}
