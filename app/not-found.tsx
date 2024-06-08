import { getTranslations } from "next-intl/server";

export default async function NotFound() {
  const t = await getTranslations("ERROR_MESSAGE");

  return (
    <div className="flex flex-col justify-center mx-auto w-4/5 pb-[10vh] max-w-lg h-full">
      <h1 className="mb-4 text-[60px] md:text-[100px] leading-tight font-medium text-gray-700">
        404
      </h1>

      <div className="flex flex-col gap-y-1 w-full mb-6 break-words text-sm md:text-lg text-gray-600">
        {t("NOT_FOUND")}
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
