"use client";

import { useEffect, useRef } from "react";

const SMOOTHING = 0.05; // độ mượt, càng nhỏ càng trễ và êm
const EXTRA = 0.1; // ảnh thu thêm 10% sau khi ngừng cuộn
const IDLE_MS = 150; // thời gian coi như đã ngừng cuộn
const RANGE = 1.0; // quãng cuộn để ảnh thu hết, tính theo chiều cao màn hình

const clamp = (v: number, min = 0, max = 1) => Math.min(Math.max(v, min), max);
const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;

export default function Hero() {
  const headerRef = useRef<HTMLElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const rangeOf = () => window.innerHeight * RANGE;

    let raw = 0;
    let target = 0;
    let shown = 0;
    let dir = 1;
    let lastY = window.scrollY;
    let idleTimer: number | undefined;
    let frame = 0;

    const onScroll = () => {
      const y = window.scrollY;
      if (y !== lastY) dir = y > lastY ? 1 : -1;
      lastY = y;

      raw = clamp(y / rangeOf());
      target = raw;

      // ẩn header khi đã cuộn qua hết hero
      if (headerRef.current) {
        const passed = y > window.innerHeight - 120;
        headerRef.current.style.opacity = passed ? "0" : "1";
        headerRef.current.style.pointerEvents = passed ? "none" : "auto";
      }

      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => {
        target = clamp(raw + dir * EXTRA);
      }, IDLE_MS);
    };

    const render = () => {
      shown += (target - shown) * SMOOTHING;
      if (Math.abs(target - shown) < 0.0001) shown = target;

      const p = easeInOutSine(shown);
      const imageWidth = 34 - 31 * p; // 34% -> 3%

      if (imageRef.current) imageRef.current.style.width = `${imageWidth}%`;
      if (headerRef.current) headerRef.current.style.right = `${imageWidth + 4}%`;
      if (hintRef.current) hintRef.current.style.right = `${imageWidth + 1}%`;

      frame = requestAnimationFrame(render);
    };

    onScroll();
    shown = target;
    render();

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
      {/* Header cố định trên cùng, co giãn theo ảnh, ẩn sau khi qua hero */}
      <header
        ref={headerRef}
        className="fixed left-[2.4%] top-0 z-10 flex h-[120px] items-center gap-10 text-[#1a1a1a] transition-opacity duration-300"
        style={{ right: "38%" }}
      >
        <div className="flex shrink-0 items-center gap-3">
          <span className="text-2xl font-light tracking-[0.25em]">Λ Λ T</span>
          <span className="h-7 w-px bg-[#1a1a1a]" />
          <span className="text-lg">Architecten</span>
        </div>
        <nav className="flex flex-1 items-center justify-between text-lg text-[#9a9a9a]">
          <a href="#work" className="hover:text-[#1a1a1a]">Projecten</a>
          <a href="#about" className="hover:text-[#1a1a1a]">Over</a>
          <a href="#contact" className="flex items-center gap-2 hover:text-[#1a1a1a]">
            Contact <span>→</span>
          </a>
        </nav>
      </header>

      {/* Hero: cuộn cùng page */}
      <section
        className="relative w-full bg-white text-[#1a1a1a]"
        style={{ height: "100vh" }}
      >
        {/* Ảnh */}
        <div
          ref={imageRef}
          className="absolute right-[3%] top-0 overflow-hidden"
          style={{ bottom: "4vh", width: "34%" }}
        >
          <img
            src="/images/hero.jpg"
            alt="Ảnh của Giang"
            className="h-full w-full object-cover"
          />
        </div>

        {/* Tiêu đề */}
        <div className="absolute left-[2.4%] w-[52%]" style={{ bottom: "4vh" }}>
          <h1 className="text-[3vw] leading-[1.15] tracking-tight">
            Wij ontwerpen gebouwen die werken voor publieke ruimtes, scholen en
            bedrijven, en vertrekken daarbij steeds van de ruimte vanbinnen.
          </h1>
        </div>

        {/* Chữ scroll */}
        <p
          ref={hintRef}
          className="absolute text-base"
          style={{ bottom: "4vh", right: "35%" }}
        >
          scroll
        </p>
      </section>
    </>
  );
}