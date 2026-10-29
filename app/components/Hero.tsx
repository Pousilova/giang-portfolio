"use client";

import { useEffect, useRef } from "react";
import RiseText from "./RiseText";

// ===== Cấu hình =====
const MOTION = {
  smoothing: 4, // độ bám theo cuộn (3 - 6)
  cover: 1.5, // độ che phủ theo quãng cuộn
  maxCover: 96, // ảnh bị cắt tối đa bao nhiêu %
  shiftVw: 2.5, // ảnh trượt sang phải tối đa (vw)
  parallax: 4.5, // ảnh trượt nhẹ bên trong khung
  extra: 0.05, // tiến thêm sau khi ngừng cuộn
  extraMs: 1200, // thời gian tiến thêm (ms)
  idleMs: 120, // coi là ngừng cuộn sau bao lâu (ms)
  range: 0.5, // quãng cuộn theo chiều cao màn hình
};
const HEADER_H = 120; // chiều cao header (px)
const IMAGE_TOP = HEADER_H * 0.25; // mép trên ảnh ở 25% header
const IMAGE_RIGHT = 3; // ảnh cách mép phải (%)
const IMAGE_W = 34; // chiều rộng khung ảnh (%)
const GAP = 1; // khoảng trống giữa header/chữ và ảnh (%)

// Nội dung tiêu đề hero (đoạn có className sẽ được tô màu)
const HERO_TEXT = [
  { text: "Tuy có xuất phát điểm là một người chẳng mấy khi nói tiếng anh, hành trình đạt" },
  { text: " 8.5", className: "font-bold text-red-500" },
  { text: " trong kì thi " },
  { text: "IELTS", className: "font-bold text-red-500" },
  { text: " của mình lại không quá vất vả." },
];

// ===== Hàm tiện ích =====
const clamp = (v: number, min = 0, max = 1) => Math.min(Math.max(v, min), max);
const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;
const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);

export default function Hero() {
  const frameRef = useRef<HTMLDivElement>(null);
  const clipRef = useRef<HTMLDivElement>(null);
  const photoRef = useRef<HTMLImageElement>(null);
  const hintRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const rangeOf = () => window.innerHeight * MOTION.range;

    let target = 0;
    let shown = 0;
    let dir = 1;
    let lastY = window.scrollY;
    let idleTimer: number | undefined;
    let frame = 0;
    let lastTime = performance.now();
    let tween: { from: number; to: number; t0: number } | null = null;

    const onScroll = () => {
      const y = window.scrollY;
      if (y !== lastY) dir = y > lastY ? 1 : -1;
      lastY = y;

      tween = null;
      target = clamp(y / rangeOf());

      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => {
        const to = clamp(target + dir * MOTION.extra);
        tween = { from: target, to, t0: performance.now() };
      }, MOTION.idleMs);
    };

    const render = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      if (tween) {
        const t = clamp((now - tween.t0) / MOTION.extraMs);
        target = tween.from + (tween.to - tween.from) * easeOutQuart(t);
        if (t >= 1) tween = null;
      }

      shown += (target - shown) * (1 - Math.exp(-MOTION.smoothing * dt));
      if (Math.abs(target - shown) < 0.00005) shown = target;

      const e = easeInOutSine(clamp(shown * MOTION.cover));

      if (clipRef.current) {
        clipRef.current.style.clipPath = `inset(0 0 0 ${MOTION.maxCover * e}%)`;
      }
      if (photoRef.current) {
        photoRef.current.style.transform = `translate3d(${-e * MOTION.parallax}%, 0, 0)`;
      }
      if (frameRef.current) {
        frameRef.current.style.transform = `translate3d(${e * MOTION.shiftVw}vw, 0, 0)`;
      }

      // mép trái phần ảnh còn nhìn thấy, để chữ bám theo
      const visibleLeft =
        100 - IMAGE_RIGHT - IMAGE_W + IMAGE_W * (MOTION.maxCover / 100) * e + e * MOTION.shiftVw;
      const edgeRight = 100 - visibleLeft + GAP;

      if (hintRef.current) hintRef.current.style.right = `${edgeRight + 0.5}%`;

      frame = requestAnimationFrame(render);
    };

    onScroll();
    shown = target;
    frame = requestAnimationFrame(render);

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(idleTimer);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <>
      {/* ===== Điện thoại (dưới 768px) ===== */}
      <div className="text-[#1a1a1a] md:hidden">
        <header className="flex items-center justify-between px-6 py-6">
          <div className="flex items-center gap-2">
            <span className="text-xl font-light tracking-[0.2em]">Λ Λ T</span>
            <span className="h-5 w-px bg-[#1a1a1a]" />
            <span className="text-sm">Architecten</span>
          </div>
          <span className="text-base text-[#9a9a9a]">Menu</span>
        </header>

        <div className="px-6 pt-16">
          <RiseText segments={HERO_TEXT} className="text-[6.5vw] leading-[1.25] tracking-tight" />
        </div>

        <div className="mt-16 pb-6 pl-[21%] pr-[9%]">
          <div className="relative h-[70vh] w-full overflow-hidden">
            <img
              src="/images/hero.jpg"
              alt="Ảnh của Giang"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* ===== Máy tính (từ 768px) ===== */}
      <section className="relative hidden w-full text-[#1a1a1a] md:block" style={{ height: "100vh" }}>
        <div
          ref={frameRef}
          className="absolute"
          style={{
            right: `${IMAGE_RIGHT}%`,
            top: `${IMAGE_TOP}px`,
            bottom: "4vh",
            width: `${IMAGE_W}%`,
            willChange: "transform",
          }}
        >
          <div
            ref={clipRef}
            className="absolute inset-0 overflow-hidden"
            style={{ clipPath: "inset(0 0 0 0%)", willChange: "clip-path" }}
          >
            <img
              ref={photoRef}
              src="/images/hero.jpg"
              alt="Ảnh của Giang"
              className="absolute left-0 top-0 h-full max-w-none object-cover"
              style={{ width: "110%", willChange: "transform" }}
            />
          </div>
        </div>

        <div className="absolute left-[2.4%] w-[52%]" style={{ bottom: "4vh" }}>
          <RiseText segments={HERO_TEXT} className="text-[2vw] leading-[1.3] tracking-tight" />
        </div>

        <p ref={hintRef} className="absolute text-base" style={{ bottom: "4vh", right: "39%" }}>
          lăn chuột
        </p>
      </section>
    </>
  );
}