"use client";

import { RefObject, useEffect } from "react";

export function useAutoScroll(
  ref: RefObject<HTMLElement | null>,
  dependency: unknown
) {
  useEffect(() => {
    ref.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [dependency, ref]);
}
