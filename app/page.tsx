import SearchInput from "@/components/SearchInput";
import { MagnetIcon } from "@/components/icons";
import { ToggleTheme } from "@/components/FloatTool";
import { siteConfig } from "@/config/site";

export default function Home() {
  return (
    <section className="flex flex-col items-center justify-center gap-4 w-4/5 md:w-3/5 h-full mx-auto pb-24 md:pb-20">
      <h1 className="logo" title={siteConfig.name}>
        <MagnetIcon className="w-[140px] h-[140px] transition-colors duration-400" />
      </h1>
      <SearchInput />
      <div className="fixed bottom-2 right-2 md:hidden">
        <ToggleTheme noBg />
      </div>
    </section>
  );
}
