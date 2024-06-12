import { Link } from "@nextui-org/react";

import { FloatTool } from "@/components/FloatTool";
import { SearchInput } from "@/components/SearchInput";
import { MagnetIcon } from "@/components/icons";
import { siteConfig } from "@/config/site";

export default function DetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col justify-center gap-4 px-3 py-3 md:py-8">
      <div className="flex items-center max-w-xl mb-4">
        <Link
          className="mb-[-2px] mr-2 md:mr-4 leading-none text-[50px] md:text-[60px]"
          href="/"
          title={siteConfig.name}
        >
          <MagnetIcon />
        </Link>
        <SearchInput />
      </div>
      {children}
      <FloatTool />
    </section>
  );
}
