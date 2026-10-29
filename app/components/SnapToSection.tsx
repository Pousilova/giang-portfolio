"use client";

import { useEffect } from "react";

const IDLE_MS = 60; // đợi người dùng ngừng cuộn bao lâu thì mới tự snap (ms)
const SNAP_MS = 1.0; // thời lượng tự cuộn (giây), đủ dài để chuyển động êm
const SNAP_LOCK_MS = 1100; // khoá không snap thêm trong lúc đang tự cuộn (ms)
const UP_SNAP_RATIO = 0.5; // cuộn lên mà còn dưới 50% chiều cao màn hình thì tự snap về đầu hero

type LenisLike = {
  scrollTo: (target: number, options?: { duration?: number; easing?: (t: number) => number }) => void;
};

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

// Khi cuộn xuống từ hero, tự cuộn tới đầu section đích; khi cuộn lên gần hết hero, tự cuộn về đầu trang
export default function SnapToSection({ targetId }: { targetId: string }) {
  useEffect(() => {
    let timer = 0;
    let locked = false;
    let lastY = window.scrollY;

    const glideTo = (dest: number) => {
      locked = true;
      const lenis = (window as unknown as { __lenis?: LenisLike }).__lenis;
      if (lenis) {
        lenis.scrollTo(dest, { duration: SNAP_MS, easing: easeInOutCubic });
      } else {
        window.scrollTo({ top: dest, behavior: "smooth" });
      }
      window.setTimeout(() => {
        locked = false;
      }, SNAP_LOCK_MS);
    };

    const snapDown = () => {
      const target = document.getElementById(targetId);
      if (!target || locked) return;

      const y = window.scrollY;
      const top = target.getBoundingClientRect().top + window.scrollY;
      if (y <= 0 || y >= top) return;

      // Đầu section đích: dừng ở trạng thái ảnh bandstuck đầu tiên, chưa mở mục nào
      glideTo(top);
    };

    const snapUp = () => {
      if (locked) return;

      const y = window.scrollY;
      if (y <= 0 || y >= window.innerHeight * UP_SNAP_RATIO) return;

      // Hero đã gần hết khung nhìn khi cuộn lên: về hẳn đầu hero
      glideTo(0);
    };

    const onScroll = () => {
      const y = window.scrollY;
      const down = y > lastY;
      lastY = y;
      window.clearTimeout(timer);
      timer = window.setTimeout(down ? snapDown : snapUp, IDLE_MS);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
    };
  }, [targetId]);

  return null;
}
