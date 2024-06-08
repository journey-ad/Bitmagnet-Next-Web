"use client";

import clsx from "clsx";
import { useState } from "react";

import { MagnetIcon } from "@/components/icons";
import { siteConfig } from "@/config/site";
import { $env } from "@/utils";

export const HomeLogo = () => {
  const [isAnimating, setIsAnimating] = useState(false);

  const doClickAnimation = () => {
    if (!$env.isMobile) {
      return;
    }

    if (isAnimating) {
      return;
    }

    setIsAnimating(true);

    setTimeout(() => {
      setIsAnimating(false);
    }, 400);
  };

  return (
    <h1
      className="logo"
      title={siteConfig.name}
      onPointerDown={() => doClickAnimation()}
    >
      <MagnetIcon
        className={clsx(
          "w-[140px] h-[140px] transition-all duration-400 hover:scale-105",
          isAnimating && "animate-pop",
        )}
      />
    </h1>
  );
};
