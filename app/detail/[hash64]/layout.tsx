export default function DetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col justify-center gap-4 px-3 py-3 md:py-8">
      {children}
    </section>
  );
}
