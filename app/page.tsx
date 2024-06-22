import { HomeLogo } from "@/components/HomeLogo";
import { SearchInput } from "@/components/SearchInput";
import { ToggleTheme, SwitchLanguage } from "@/components/FloatTool";
import { Stats } from "@/components/Stats";

export default function Home() {
  return (
    <section className="flex flex-col items-center justify-center gap-4 w-4/5 md:w-3/5 h-full mx-auto pb-24 md:pb-20">
      <HomeLogo />
      <SearchInput />
      <div className="fixed bottom-4 right-4 invisible md:visible">
        <Stats />
      </div>
      <div className="fixed top-4 right-4 flex gap-1">
        <SwitchLanguage noBg />
        <ToggleTheme noBg />
      </div>
    </section>
  );
}
