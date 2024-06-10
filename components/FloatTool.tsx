/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */
"use client";

import { useIsSSR } from "@react-aria/ssr";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { $env } from "@/utils";
import { SunFilledIcon, MoonFilledIcon } from "@/components/icons";

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
      className={`back-top flex justify-center items-center w-[50px] h-[50px] rounded-medium cursor-pointer transition-all text-stone-600 bg-gray-100 dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 ${showBackTop ? "visible opacity-100" : "invisible opacity-0 pointer-events-none"}`}
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
  const isSSR = useIsSSR();

  if (isSSR) return null;

  return (
    <div
      className={`flex justify-center items-center w-[50px] h-[50px] rounded-medium cursor-pointer transition-all text-stone-600 ${!noBg && "bg-gray-100 dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700"}`}
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      {theme === "dark" ? <SunFilledIcon /> : <MoonFilledIcon />}
    </div>
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
      <ToggleTheme />
      <BackTop />
    </div>
  );
};
