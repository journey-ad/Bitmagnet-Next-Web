import "@/styles/globals.css";
import { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import clsx from "clsx";

import { Providers } from "./providers";

import { siteConfig } from "@/config/site";
import { fontSans, fontNoto, fontMono } from "@/config/fonts";
import { BgEffect } from "@/components/BgEffect";

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
  description: siteConfig.description,
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
  width: "device-width",
  height: "device-height",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html suppressHydrationWarning lang={locale}>
      <head />
      <body
        className={clsx(
          "h-full bg-background font-sans antialiased",
          fontSans.variable,
          fontMono.variable,
          locale.startsWith("zh") ? fontNoto.className : "",
        )}
      >
        <NextIntlClientProvider messages={messages}>
          <Providers
            themeProps={{
              attribute: "class",
              defaultTheme: "system",
              enableSystem: true,
            }}
          >
            <div className="relative flex flex-col h-full">
              <BgEffect />
              <main className="container w-full md:w-4/5 mx-auto max-w-6xl flex-grow z-10">
                {children}
              </main>
            </div>
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
