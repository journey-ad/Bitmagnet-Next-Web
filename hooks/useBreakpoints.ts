import { useIsSSR } from "@react-aria/ssr";
import { useMediaQuery } from "react-responsive";

const useBreakpoints = () => {
  const isSSR = useIsSSR();

  // detect screen size
  const isXs = useMediaQuery({ query: "(max-width: 649px)" });
  const isSmUp = useMediaQuery({ query: "(min-width: 650px)" });
  const isMdUp = useMediaQuery({ query: "(min-width: 960px)" });
  const isLgUp = useMediaQuery({ query: "(min-width: 1280px)" });
  const isXlUp = useMediaQuery({ query: "(min-width: 1400px)" });

  // client-side rendering return the actual media query result
  // server-side rendering return the default value
  return {
    isXs: !isSSR && isXs,
    isSmUp: !isSSR && isSmUp,
    isMdUp: !isSSR && isMdUp,
    isLgUp: !isSSR && isLgUp,
    isXlUp: !isSSR && isXlUp,
  };
};

export default useBreakpoints;
