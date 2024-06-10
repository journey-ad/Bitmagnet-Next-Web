"use client";

import { useEffect, useState, useMemo } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import { useIsSSR } from "@react-aria/ssr";
import { useTheme } from "next-themes";

import { UI_BACKGROUND_ANIMATION } from "@/config/constant";

export const BgEffect = () => {
  const [init, setInit] = useState(false);

  const { theme } = useTheme();
  const isSSR = useIsSSR();

  const colorPreset = useMemo(
    () => ({
      light: ["#f1f1f1", "#d1d9e1"],
      dark: ["#1d1d1d", "#0d1521"],
    }),
    [],
  );

  useEffect(() => {
    if (!UI_BACKGROUND_ANIMATION) return;

    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      setInit(true);
    });

    return () => setInit(false);
  }, []);

  const particlesOptions = useMemo(
    () =>
      ({
        background: {
          image:
            theme === "light"
              ? `linear-gradient(145deg, ${colorPreset.light[0]}, ${colorPreset.light[1]})`
              : `linear-gradient(145deg, ${colorPreset.dark[0]}, ${colorPreset.dark[1]})`,
        },
        fpsLimit: 120,
        interactivity: {
          events: {
            onHover: {
              enable: true,
              mode: "grab",
            },
          },
          modes: {
            push: {
              quantity: 4,
            },
            repulse: {
              distance: 200,
              duration: 0.4,
            },
          },
        },
        particles: {
          color: {
            value: theme === "light" ? "#c1c7d1" : "#3b4250",
          },
          links: {
            value: theme === "light" ? "#c1c7d1" : "#3b4250",
            distance: 150,
            enable: true,
            opacity: theme === "light" ? 0.8 : 0.1,
            width: 1,
          },
          move: {
            direction: "none",
            enable: true,
            outModes: {
              default: "bounce",
            },
            random: false,
            speed: 1,
            straight: false,
          },
          number: {
            density: {
              enable: true,
            },
            value: 80,
          },
          opacity: {
            value: 0.8,
          },
          shape: {
            type: "circle",
          },
          size: {
            value: { min: 1, max: 5 },
          },
        },
        detectRetina: true,
      }) as any,
    [theme, colorPreset],
  );

  if (isSSR) return null;

  if (!UI_BACKGROUND_ANIMATION) {
    const linearGradient =
      theme === "light" ? colorPreset.light : colorPreset.dark;

    return (
      <div
        className="fixed top-0 left-0 w-full h-full bg-gradient-to-br z-0"
        style={
          {
            "--tw-gradient-stops": `${linearGradient[0]}, ${linearGradient[1]}`,
          } as React.CSSProperties
        }
      />
    );
  }

  if (!init) return null;

  return (
    <Particles
      options={particlesOptions}
      particlesLoaded={async (_container) => {
        // console.log(container);
      }}
    />
  );
};
