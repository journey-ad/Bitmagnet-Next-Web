import { FloatTool } from "@/components/FloatTool";

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <section className="flex flex-col justify-center gap-4 px-3 py-3 pb-6 md:py-8">
        {children}
      </section>
      <FloatTool />
    </>
  );
}
