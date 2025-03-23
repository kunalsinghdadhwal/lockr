import { useState, useEffect, useCallback } from "react";

export const useIsMobile = (mobileScreenSize: number = 768): boolean => {
  if (typeof window.matchMedia !== "function") {
    throw new Error("matchMedia not supported by browser!");
  }

  const mediaQuery = `(max-width: ${mobileScreenSize}px)`;
  const [isMobile, setIsMobile] = useState<boolean>(
    window.matchMedia(mediaQuery).matches
  );

  const checkIsMobile = useCallback((event: MediaQueryListEvent) => {
    setIsMobile(event.matches);
  }, []);

  useEffect(() => {
    const mediaListener = window.matchMedia(mediaQuery);
    try {
      mediaListener.addEventListener("change", checkIsMobile);
    } catch {
      mediaListener.addListener(checkIsMobile);
    }

    return () => {
      try {
        mediaListener.removeEventListener("change", checkIsMobile);
      } catch {
        mediaListener.removeListener(checkIsMobile);
      }
    };
  }, [mobileScreenSize, checkIsMobile]);

  return isMobile;
};
