export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col justify-center gap-4 p-3 pb-5 md:py-8">
      {children}
    </section>
  );
}
