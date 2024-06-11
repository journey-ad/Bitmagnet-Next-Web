/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */
"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@nextui-org/react";
import clsx from "clsx";

import { $env, Cookie } from "@/utils";
import {
  SunFilledIcon,
  MoonFilledIcon,
  LangFilledIcon,
} from "@/components/icons";
import { locales, defaultLocale } from "@/i18n/config";

function handleBackTop() {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}

const BackTop = () => {
  const [showBackTop, setShowBackTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 800) {
        setShowBackTop(true);
      } else {
        setShowBackTop(false);
      }
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <div
      className={clsx(
        "back-top flex justify-center items-center w-[50px] h-[50px] rounded-medium cursor-pointer transition-all text-stone-600 bg-gray-100 dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700",
        showBackTop
          ? "visible opacity-100"
          : "invisible opacity-0 pointer-events-none",
      )}
      onClick={() => handleBackTop()}
    >
      <svg
        className="feather feather-arrow-up"
        fill="none"
        height="26"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
        width="26"
        xmlns="http://www.w3.org/2000/svg"
      >
        <line x1="12" x2="12" y1="19" y2="5" />
        <polyline points="5 12 12 5 19 12" />
      </svg>
    </div>
  );
};

export const ToggleTheme = ({ noBg = false }: { noBg?: boolean }) => {
  const { theme, setTheme } = useTheme();
  const [colorScheme, setColorScheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

      if (!mediaQuery) return;

      mediaQuery.addEventListener("change", (event) => {
        setColorScheme(event.matches ? "dark" : "light");
      });

      setColorScheme(mediaQuery.matches ? "dark" : "light");
    } else {
      setColorScheme(theme === "dark" ? "dark" : "light");
    }
  }, [theme]);

  return (
    <div
      className={clsx(
        "flex justify-center items-center rounded-medium cursor-pointer transition-all text-stone-600",
        !noBg
          ? "w-[50px] h-[50px] bg-gray-100 dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700"
          : "w-[32px] h-[32px]",
      )}
      onClick={() => setTheme(colorScheme === "dark" ? "light" : "dark")}
    >
      {colorScheme === "dark" ? <SunFilledIcon /> : <MoonFilledIcon />}
    </div>
  );
};

export const SwitchLanguage = ({ noBg = false }: { noBg?: boolean }) => {
  const cookieLocale =
    typeof window !== "undefined" ? Cookie.get("NEXT_LOCALE") : null;
  const browserLocale =
    typeof window !== "undefined" ? navigator.language : null;

  const locale = cookieLocale || browserLocale || defaultLocale;
  const [lang, setlang] = useState(new Set([locale]));

  const handleChangeLocale = (key: Set<string>) => {
    setlang(key);
    Cookie.set("NEXT_LOCALE", Array.from(key)[0], {
      path: "/",
      expires: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
    });

    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  return (
    <>
      <Dropdown className="min-w-0 bg-opacity-80">
        <DropdownTrigger>
          <div
            className={clsx(
              "flex justify-center items-center rounded-medium cursor-pointer transition-all text-stone-600",
              !noBg
                ? "w-[50px] h-[50px] bg-gray-100 dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700"
                : "w-[32px] h-[32px]",
            )}
          >
            <LangFilledIcon />
          </div>
        </DropdownTrigger>
        <DropdownMenu
          disallowEmptySelection
          selectedKeys={lang}
          selectionMode="single"
          variant="flat"
          onSelectionChange={handleChangeLocale as any}
        >
          {Object.entries(locales).map(([key, value]) => (
            <DropdownItem key={key} value={key}>
              <small>{key}</small> {value}
            </DropdownItem>
          ))}
        </DropdownMenu>
      </Dropdown>
    </>
  );
};

export const FloatTool = () => {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if ($env.isMobile) {
      setEnabled(false);

      return;
    }

    setEnabled(true);
  }, []);

  if (!enabled) return null;

  return (
    <div className="fixed right-6 bottom-10 flex flex-col gap-y-2 items-center z-20">
      {/* <ToggleTheme /> */}
      <BackTop />
    </div>
  );
};
