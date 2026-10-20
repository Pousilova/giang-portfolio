"use client";

import { useEffect, useRef } from "react";

// ===== Cấu hình hiệu ứng =====
const BG_MOVE = 0.001; // nền trôi theo cuộn (tỉ lệ theo chiều cao màn hình)
const FG_MOVE = 0.001; // tiền cảnh trôi theo cuộn, ngược chiều nền
const MOUSE_BG = 5; // nền lệch theo chuột (px, tối đa)
const MOUSE_FG = 3; // tiền cảnh lệch theo chuột (px, tối đa)
const SMOOTH = 0.1; // độ mượt cuộn (0.05 = rất êm, 0.2 = bám sát hơn)
const MOUSE_SMOOTH = 0.06; // độ mượt khi chuột di chuyển (nhỏ = trễ và êm)

// Cho phép ảnh tiền cảnh nhô ra ngang, chỉ cắt theo chiều dọc
const FG_CLIP = "polygon(-100vw 0, 200vw 0, 200vw 100%, -100vw 100%)";

// Nội dung cột text (sửa lại bằng nội dung của bạn)
const BLOCKS = [
  "Chất lượng tốt nhất",
  "Thiết kế theo yêu cầu",
  "Thân thiện với môi trường",
  "Công nghệ tiên tiến",
];

export default function ParallaxSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const bgRef = useRef<HTMLImageElement>(null);
  const fgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    let target = 0;
    let shown = 0;
    let mouseTarget = { x: 0, y: 0 };
    let mouseShown = { x: 0, y: 0 };
    let frame = 0;

    const measure = () => {
      const r = section.getBoundingClientRect();
      const raw = (r.top + r.height / 2 - window.innerHeight / 2) / window.innerHeight;
      target = Math.max(-1, Math.min(1, raw));
    };

    const onPointerMove = (e: PointerEvent) => {
      const r = section.getBoundingClientRect();
      mouseTarget = {
        x: ((e.clientX - r.left) / r.width) * 2 - 1,
        y: ((e.clientY - r.top) / r.height) * 2 - 1,
      };
    };

    const onPointerLeave = () => {
      mouseTarget = { x: 0, y: 0 };
    };

    const render = () => {
      shown += (target - shown) * SMOOTH;
      mouseShown.x += (mouseTarget.x - mouseShown.x) * MOUSE_SMOOTH;
      mouseShown.y += (mouseTarget.y - mouseShown.y) * MOUSE_SMOOTH;

      const h = window.innerHeight;

      // nền: trôi theo cuộn + lệch nhẹ theo chuột (ngược chiều chuột)
      const bgX = -mouseShown.x * MOUSE_BG;
      const bgY = shown * h * BG_MOVE - mouseShown.y * MOUSE_BG;
      if (bgRef.current) {
        bgRef.current.style.transform = `translate3d(${bgX}px, ${bgY}px, 0)`;
      }

      // tiền cảnh: trôi ngược chiều nền khi cuộn + lệch mạnh hơn theo chuột
      const fgX = mouseShown.x * MOUSE_FG;
      const fgY = -shown * h * FG_MOVE + mouseShown.y * MOUSE_FG;
      if (fgRef.current) {
        fgRef.current.style.transform = `translate3d(${fgX}px, ${fgY}px, 0)`;
      }

      frame = requestAnimationFrame(render);
    };

    measure();
    shown = target;
    frame = requestAnimationFrame(render);

    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    section.addEventListener("pointermove", onPointerMove);
    section.addEventListener("pointerleave", onPointerLeave);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
      section.removeEventListener("pointermove", onPointerMove);
      section.removeEventListener("pointerleave", onPointerLeave);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden px-6 py-24 md:h-[80vh] md:min-h-[640px] md:px-0 md:py-0"
    >
      {/* Cột text: bên trái */}
      <div className="relative z-10 md:absolute md:left-[5%] md:top-1/2 md:w-[32%] md:-translate-y-1/2">
        <p className="text-base text-[#8a8a8a]">About our wallpapers</p>

        <p className="mt-6 text-lg leading-relaxed">
          Mỗi tác phẩm là sự kết hợp giữa tay nghề, chi tiết tinh tế và niềm đam mê sáng tạo.
          Chúng mình muốn mang nghệ thuật vào không gian sống của bạn.
        </p>

        <div className="mt-12 grid grid-cols-1 gap-x-10 sm:grid-cols-2">
          {BLOCKS.map((title) => (
            <div key={title} className="border-b border-[#1a1a1a]/20 py-8 text-lg">
              {title}
            </div>
          ))}
        </div>

        <a
          href="#contact"
          className="mt-12 inline-flex items-center gap-4 border border-[#1a1a1a]/25 px-8 py-5 text-base hover:bg-[#1a1a1a] hover:text-white"
        >
          Tìm hiểu thêm <span>→</span>
        </a>
      </div>

      {/* Khung nền: 48% chiều rộng, nằm bên phải */}
      <div
        className="relative mt-12 h-[60vh] w-full md:absolute md:inset-y-[10%] md:right-0 md:mt-0 md:h-auto md:w-[48%]"
        style={{ clipPath: FG_CLIP }}
      >
        {/* Lớp ảnh nền: cắt tràn trong khung */}
        <div className="absolute inset-0 overflow-hidden">
          <img
            ref={bgRef}
            src="/images/parallax-bg.jpg"
            alt=""
            aria-hidden="true"
            className="absolute left-[-3%] top-[-8%] h-[116%] w-[106%] max-w-none object-cover will-change-transform"
          />
        </div>

        {/* Ảnh tiền cảnh: nhô ra từ mép trái của khung nền */}
        <img
          ref={fgRef}
          src="/images/parallax-fg.png"
          alt="Tác phẩm"
          className="pointer-events-none absolute z-20 hidden will-change-transform md:block md:left-[14%] md:top-[40%] md:w-[70%] md:max-w-none"
        />
      </div>
    </section>
  );
}