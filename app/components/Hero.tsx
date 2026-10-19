"use client";

import { useEffect, useRef } from "react";

const SMOOTHING = 4; // độ bám theo cuộn, càng nhỏ càng có quán tính và êm (3 - 6)
const COVER = 1.5; // độ che phủ theo quãng cuộn (lớn hơn = che nhanh hơn)
const MAX_COVER = 96; // lớp trắng che tối đa bao nhiêu % ảnh, phần còn lại được chừa lại
const SHIFT_VW = 2.5; // ảnh trượt sang phải tối đa bao nhiêu vw khi cuộn
const PARALLAX = 4.5; // ảnh trượt nhẹ bên trong khung khi bị che (tinh tế)
const EXTRA = 0.05; // tiến thêm 5% sau khi ngừng cuộn
const EXTRA_MS = 1200; // thời gian chuyển động thêm sau khi ngừng cuộn (ms)
const IDLE_MS = 120; // thời gian coi như đã ngừng cuộn
const RANGE = 0.5; // quãng cuộn theo chiều cao màn hình
const HIDE_HEADER_AT = 0.6; // header ẩn khi cuộn qua 60% chiều cao hero
const HEADER_H = 120; // chiều cao header (px)
const IMAGE_TOP = HEADER_H * 0.25; // mép trên ảnh ở 25% từ đỉnh header
const IMAGE_RIGHT = 3; // khoảng cách ảnh tới mép phải (%)
const IMAGE_W = 34; // chiều rộng khung ảnh (%)
const GAP = 1; // khoảng trống giữa header/chữ lăn chuột và ảnh (%)

// vị trí menu tính theo % chiều rộng header (khớp với trang gốc)
const NAV_PROJECTEN = 42;
const NAV_OVER = 67;
const NAV_CONTACT = 87;

const clamp = (v: number, min = 0, max = 1) => Math.min(Math.max(v, min), max);
const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;
const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);

export default function Hero() {
  const headerRef = useRef<HTMLElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const maskRef = useRef<HTMLDivElement>(null);
  const photoRef = useRef<HTMLImageElement>(null);
  const hintRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const rangeOf = () => window.innerHeight * RANGE;

    let target = 0;
    let shown = 0;
    let dir = 1;
    let lastY = window.scrollY;
    let idleTimer: number | undefined;
    let frame = 0;
    let lastTime = performance.now();

    // chuyển động thêm sau khi ngừng cuộn
    let tween: { from: number; to: number; t0: number } | null = null;

    const onScroll = () => {
      const y = window.scrollY;
      if (y !== lastY) dir = y > lastY ? 1 : -1;
      lastY = y;

      tween = null; // đang cuộn thì hủy chuyển động thêm
      target = clamp(y / rangeOf());

      if (headerRef.current) {
        const passed = y > window.innerHeight * HIDE_HEADER_AT;
        headerRef.current.style.opacity = passed ? "0" : "1";
        headerRef.current.style.pointerEvents = passed ? "none" : "auto";
      }

      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => {
        const to = clamp(target + dir * EXTRA);
        tween = { from: target, to, t0: performance.now() };
      }, IDLE_MS);
    };

    const render = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      if (tween) {
        const t = clamp((now - tween.t0) / EXTRA_MS);
        target = tween.from + (tween.to - tween.from) * easeOutQuart(t);
        if (t >= 1) tween = null;
      }

      // quán tính: shown bám theo target bằng bộ lọc theo thời gian
      shown += (target - shown) * (1 - Math.exp(-SMOOTHING * dt));
      if (Math.abs(target - shown) < 0.00005) shown = target;

      const e = easeInOutSine(clamp(shown * COVER));

      // lớp trắng: bắt đầu nằm ngoài bên trái, cuối cùng che tối đa MAX_COVER%
      if (maskRef.current) {
        maskRef.current.style.transform = `translate3d(${-100 + MAX_COVER * e}%, 0, 0)`;
      }

      // ảnh trượt nhẹ bên trong khung (parallax)
      if (photoRef.current) {
        photoRef.current.style.transform = `translate3d(${-e * PARALLAX}%, 0, 0)`;
      }

      // cả khung ảnh trượt dần sang phải
      if (frameRef.current) {
        frameRef.current.style.transform = `translate3d(${e * SHIFT_VW}vw, 0, 0)`;
      }

      // mép trái phần ảnh còn nhìn thấy (tính theo % màn hình)
      const visibleLeft =
        100 - IMAGE_RIGHT - IMAGE_W + IMAGE_W * (MAX_COVER / 100) * e + e * SHIFT_VW;
      const edgeRight = 100 - visibleLeft + GAP;

      // header giãn ra theo vùng trống mà ảnh để lại
      if (headerRef.current) {
        headerRef.current.style.right = `${edgeRight}%`;
      }
      // chữ lăn chuột bám theo mép ảnh
      if (hintRef.current) {
        hintRef.current.style.right = `${edgeRight + 0.5}%`;
      }

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
      {/* Header cố định trên cùng, giãn theo ảnh, ẩn sau 60% hero */}
      <header
        ref={headerRef}
        className="fixed left-[2.4%] top-0 z-10 text-[#1a1a1a] transition-opacity duration-300"
        style={{ right: "38%", height: `${HEADER_H}px` }}
      >
        {/* Logo */}
        <div className="absolute left-0 top-0 flex h-full items-center gap-3">
          <span className="text-2xl font-light tracking-[0.25em]">Λ Λ T</span>
          <span className="h-7 w-px bg-[#1a1a1a]" />
          <span className="text-lg">Architecten</span>
        </div>

        {/* Menu: vị trí tính theo % chiều rộng header */}
        <nav className="absolute inset-0 text-lg text-[#9a9a9a]">
          <a
            href="#work"
            className="absolute top-1/2 -translate-y-1/2 whitespace-nowrap hover:text-[#1a1a1a]"
            style={{ left: `${NAV_PROJECTEN}%` }}
          >
            Projecten
          </a>
          <a
            href="#about"
            className="absolute top-1/2 -translate-y-1/2 whitespace-nowrap hover:text-[#1a1a1a]"
            style={{ left: `${NAV_OVER}%` }}
          >
            Over
          </a>
          <a
            href="#contact"
            className="absolute top-1/2 flex -translate-y-1/2 items-center gap-2 whitespace-nowrap hover:text-[#1a1a1a]"
            style={{ left: `${NAV_CONTACT}%` }}
          >
            Contact <span>→</span>
          </a>
        </nav>
      </header>

      {/* Hero: cuộn cùng page */}
      <section
        className="relative w-full bg-white text-[#1a1a1a]"
        style={{ height: "100vh" }}
      >
        {/* Khung ảnh (trượt sang phải khi cuộn) */}
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
          <div className="absolute inset-0 overflow-hidden">
            <img
              ref={photoRef}
              src="/images/hero.jpg"
              alt="Ảnh của Giang"
              className="absolute left-0 top-0 h-full max-w-none object-cover"
              style={{ width: "110%", willChange: "transform" }}
            />

            {/* Lớp trắng che dần từ bên trái, chừa lại một dải ảnh */}
            <div
              ref={maskRef}
              className="absolute left-0 top-0 h-full w-full bg-white"
              style={{ transform: "translate3d(-100%, 0, 0)", willChange: "transform" }}
            />
          </div>
        </div>

        {/* Tiêu đề và hai nút dẫn xuống section phía dưới */}
        <div className="absolute left-[2.4%] w-[52%]" style={{ bottom: "4vh" }}>
          <h1 className="text-[2vw] leading-[1.8] tracking-tight">
            Tuy có xuất phát điểm là một đứa trẻ ít nói, hành trình đạt
            <span className="font-bold text-red-500"> 8.5</span> trong kì thi{" "}
            <span className="font-bold text-red-500">IELTS</span> của mình lại
            không quá gian nan.
          </h1>

          <div className="mt-8 flex flex-wrap gap-4">
            <a
              href="#score-75"
              className="inline-flex min-w-[180px] items-center justify-center rounded-full border-2 border-[#1a1a1a] bg-white px-12 py-4 text-lg font-bold text-[#1a1a1a] transition-colors hover:bg-[#1a1a1a]/5"
            >
              7.5
            </a>
            <a
              href="#score-85"
              className="inline-flex min-w-[180px] items-center justify-center rounded-full border-2 border-[#1a1a1a] bg-[#1a1a1a] px-12 py-4 text-lg font-bold text-white transition-opacity hover:opacity-90"
            >
              8.5
            </a>
          </div>
        </div>

        {/* Chữ lăn chuột: nằm bên trái ảnh */}
        <p
          ref={hintRef}
          className="absolute text-base"
          style={{ bottom: "4vh", right: "39%" }}
        >
          lăn chuột
        </p>
      </section>
    </>
  );
}