"use client";

import { useEffect, useRef, useState } from "react";

export function useSnapActiveIndex(sectionCount: number) {
  const sectionRefs = useRef<Array<HTMLElement | null>>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!visible) {
          return;
        }

        const index = Number(visible.target.getAttribute("data-index"));
        if (Number.isNaN(index)) {
          return;
        }

        setActiveIndex(index);
      },
      {
        threshold: [0.45, 0.6, 0.75],
      }
    );

    const targets = sectionRefs.current.slice(0, sectionCount).filter((section): section is HTMLElement => Boolean(section));
    targets.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, [sectionCount]);

  return { sectionRefs, activeIndex };
}
