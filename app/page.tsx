import Search from "@/components/search";

export default function Home() {
  return (
    <section className="flex flex-col items-center justify-center gap-4 w-4/5 md:w-3/5 h-full mx-auto pb-24 md:py-10">
      <Search />
    </section>
  );
}
