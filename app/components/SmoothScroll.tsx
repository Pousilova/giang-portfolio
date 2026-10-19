"use client";

import { useEffect } from "react";
import Lenis from "lenis";

const WHEEL_MULTIPLIER = 0.75; // tốc độ lăn chuột: nhỏ hơn = chậm hơn (0.4 - 1.0)
const DURATION = 1.4; // thời gian trượt sau mỗi lần lăn (giây), lớn hơn = êm và chậm hơn

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const lenis = new Lenis({
      duration: DURATION,
      wheelMultiplier: WHEEL_MULTIPLIER,
      smoothWheel: true,
    });

    let frame = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    };
    frame = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}