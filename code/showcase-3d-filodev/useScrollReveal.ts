"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export type RevealVariant =
  | "fade-up"
  | "wipe"
  | "scale-blur"
  | "slide-x"
  | "rise-rotate";

type VariantSpec = {
  from: gsap.TweenVars;
  to: gsap.TweenVars;
  stagger: number;
  duration: number;
};

const VARIANTS: Record<RevealVariant, VariantSpec> = {
  "fade-up": {
    from: { opacity: 0, y: 40 },
    to: { opacity: 1, y: 0, ease: "power3.out" },
    stagger: 0.12,
    duration: 0.9,
  },
  // Section reveals itself behind a rising mask, like a curtain lifting.
  wipe: {
    from: { opacity: 1, clipPath: "inset(100% 0% 0% 0%)", y: 20 },
    to: { clipPath: "inset(0% 0% 0% 0%)", y: 0, ease: "power4.out" },
    stagger: 0.14,
    duration: 1.1,
  },
  // Cards resolve from a soft out-of-focus state.
  "scale-blur": {
    from: { opacity: 0, scale: 0.92, filter: "blur(14px)" },
    to: { opacity: 1, scale: 1, filter: "blur(0px)", ease: "power2.out" },
    stagger: 0.1,
    duration: 1,
  },
  // Rows enter laterally, one after another, like a list being dealt out.
  "slide-x": {
    from: { opacity: 0, x: -70 },
    to: { opacity: 1, x: 0, ease: "power3.out" },
    stagger: 0.09,
    duration: 0.8,
  },
  // Items tip up into place from a tilted plane.
  "rise-rotate": {
    from: { opacity: 0, y: 70, rotateX: -35, transformPerspective: 800 },
    to: { opacity: 1, y: 0, rotateX: 0, ease: "power3.out" },
    stagger: 0.11,
    duration: 0.95,
  },
};

export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(
  variant: RevealVariant = "fade-up",
) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const targets = el.hasAttribute("data-reveal-group")
      ? Array.from(el.querySelectorAll<HTMLElement>("[data-reveal]"))
      : [el];

    const spec = VARIANTS[variant];

    const ctx = gsap.context(() => {
      gsap.fromTo(targets, spec.from, {
        ...spec.to,
        duration: spec.duration,
        stagger: spec.stagger,
        scrollTrigger: {
          trigger: el,
          start: "top 82%",
          once: true,
        },
      });
    }, el);

    return () => ctx.revert();
  }, [variant]);

  return ref;
}
