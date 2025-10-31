import { useEffect, useState } from "react";

export function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth < breakpoint;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [breakpoint]);

  return isMobile;
}

export function useIsTouch() {
  const [isTouch, setIsTouch] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia?.("(pointer: coarse)").matches ?? false;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia?.("(pointer: coarse)");
    const handler = () => setIsTouch(mq?.matches ?? false);
    mq?.addEventListener("change", handler);
    return () => mq?.removeEventListener("change", handler);
  }, []);

  return isTouch;
}
