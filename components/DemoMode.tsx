import { getTranslations } from "next-intl/server";

const isDemoMode = process.env.DEMO_MODE === "true";

export const DemoMode = async () => {
  if (!isDemoMode) {
    return null;
  }

  const t = await getTranslations();

  return (
    <div className="fixed top-0 left-0 z-[10001]">
      <a
        className="bg-default-100 rounded-sm px-2 py-1 text-sm text-red-500 hover:underline"
        href="https://github.com/journey-ad/Bitmagnet-Next-Web"
        rel="noreferrer"
        target="_blank"
      >
        {t("COMMON.DEMO_MODE_TIPS")}
      </a>
    </div>
  );
};
