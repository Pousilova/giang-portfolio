"use client";

import { useEffect, useRef, useState } from "react";
import type { PointerEvent } from "react";

// ===== Cấu hình =====
const TRACK_VW = 160; // tổng chiều rộng vùng card (vw)
const TICK_COUNT = 28;
const EDGE_FADE_START = 0.8; // card ngoài 20% hai bên bắt đầu mờ
const EDGE_MIN_OPACITY = 0.45; // độ rõ tối thiểu của card ở rìa
const EDGE_WIDTH = "8vw"; // dải gradient che hai rìa màn hình
const LEVELS = ["Basic", "Intermediate", "Upper-Intermediate", "Advanced"];
const LEVEL_TINT = [
  { bg: "#d6f5e3", fg: "#1a1a1a" }, // Basic: xanh lá nhạt
  { bg: "#fdf5b5", fg: "#1a1a1a" }, // Intermediate: giữ nguyên
  { bg: "#cdeefc", fg: "#1a1a1a" }, // Upper-Intermediate: xanh dương nhạt (màu cũ của Basic)
  { bg: "#fde0d4", fg: "#1a1a1a" }, // Advanced: đỏ nhạt (màu cũ của Upper-Intermediate)
];

// Nội dung (placeholder, thay bằng nội dung thật)
const HEADLINE = "iterating: learning, doing, learning.";
const LEFT_HEAD = "From symbols to interaction";
const LEFT_BODY =
  "Mình tổng hợp những điểm khiến cách nói của người bản xứ tự nhiên hơn. Kéo các thẻ bên dưới để đi từ Basic đến Advanced.";
const RIGHT_HEAD = "Speaking, từ Basic tới Advanced";
const RIGHT_BODY =
  "Mỗi thẻ là một đặc điểm cụ thể. Càng kéo về bên phải, đặc điểm càng nâng cao, và chỉ báo phía trên sẽ đổi theo.";

type Card = {
  level: number;
  tag: string;
  title: string;
  body: string;
  note: string;
  x: number;
  w: number;
  y: number;
  h: number;
};

const CARDS: Card[] = [
  { level: 0, tag: "BASIC", title: "Nói chậm, rõ từng từ", body: "Câu ngắn, phát âm rõ, không cần nói nhanh.", note: "Pronunciation", x: 6, w: 15, y: 0.18, h: 0.46 },
  { level: 0, tag: "BASIC", title: "Trả lời thẳng câu hỏi", body: "Nêu ý chính trước, rồi mới giải thích thêm.", note: "Direct answers", x: 25, w: 15, y: 0.02, h: 0.52 },
  { level: 1, tag: "INTERMEDIATE", title: "Nối câu tự nhiên", body: "Dùng linker để các từ dính vào nhau khi nói.", note: "Linking", x: 44, w: 15, y: 0.3, h: 0.42 },
  { level: 1, tag: "INTERMEDIATE", title: "Ngắt nghỉ có chủ đích", body: "Dừng ngắn để gom ý, thay vì nói liền một mạch.", note: "Pausing", x: 63, w: 15, y: 0.06, h: 0.5 },
  { level: 2, tag: "UPPER-INTERMEDIATE", title: "Nhấn đúng trọng âm", body: "Nhấn vào từ khóa để người nghe bắt ý nhanh.", note: "Word stress", x: 82, w: 15, y: 0.22, h: 0.46 },
  { level: 2, tag: "UPPER-INTERMEDIATE", title: "Ngữ điệu theo ý", body: "Lên xuống giọng để thể hiện thái độ và trọng tâm.", note: "Intonation", x: 101, w: 15, y: 0.0, h: 0.54 },
  { level: 3, tag: "ADVANCED", title: "Idioms đúng ngữ cảnh", body: "Dùng thành ngữ vừa đủ, không gượng ép.", note: "Idioms", x: 120, w: 15, y: 0.26, h: 0.44 },
  { level: 3, tag: "ADVANCED", title: "Lập luận có cấu trúc", body: "Mở ý, dẫn chứng, kết luận. Nói như đang viết.", note: "Discourse", x: 139, w: 15, y: 0.08, h: 0.5 },
];

type Link = { from: number; to: number; color: string; dash?: string; width?: number };
const LINKS: Link[] = [
  { from: 0, to: 1, color: "#d62828", width: 1.2 },
  { from: 1, to: 2, color: "#7fb3d5", dash: "2 5", width: 1.6 },
  { from: 2, to: 3, color: "#1a1a1a", dash: "10 6", width: 1 },
  { from: 3, to: 4, color: "#f7b52c", dash: "18 6 3 6", width: 1.6 },
  { from: 4, to: 5, color: "#d62828", dash: "5 5", width: 1.2 },
  { from: 5, to: 6, color: "#7fb3d5", width: 1 },
  { from: 6, to: 7, color: "#1a1a1a", dash: "1 6", width: 1.6 },
];

const TICKS = Array.from({ length: TICK_COUNT }, (_, i) => (i % 9 === 0 ? 12 : i % 3 === 0 ? 8 : 4));

const clamp = (v: number, min = 0, max = 1) => Math.min(Math.max(v, min), max);

const pathFor = (a: Card, b: Card, vw: number, h: number) => {
  const x1 = (a.x + a.w) * vw;
  const y1 = (a.y + a.h / 2) * h;
  const x2 = b.x * vw;
  const y2 = (b.y + b.h / 2) * h;
  const dx = Math.max(24, (x2 - x1) * 0.5);
  return {
    d: `M${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`,
    x1,
    y1,
    x2,
    y2,
  };
};

export default function LearningSection() {
  const viewRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const drag = useRef({ on: false, x: 0, left: 0, moved: false });
  const [level, setLevel] = useState(0);
  const [size, setSize] = useState({ vw: 12.8, h: 420 });

  useEffect(() => {
    const el = viewRef.current;
    if (!el) return;

    let frame = 0;

    // Chỉ xử lý lăn NGANG (hoặc giữ Shift) trong vùng card.
    // Lăn dọc không bị chặn: sự kiện đi lên window để Lenis cuộn trang mượt như các section khác.
    const onWheel = (e: WheelEvent) => {
      const horizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY) || e.shiftKey;
      if (horizontal) e.stopPropagation();
    };

    const sync = () => {
      frame = 0;
      const vw = window.innerWidth / 100;
      const cw = el.clientWidth;
      const sl = el.scrollLeft;
      const max = Math.max(1, TRACK_VW * vw - cw);
      const p = clamp(sl / max);

      if (dotRef.current) dotRef.current.style.left = `${p * 100}%`;
      const lv = Math.min(LEVELS.length - 1, Math.floor(p * LEVELS.length));
      setLevel((prev) => (prev === lv ? prev : lv));

      CARDS.forEach((c, i) => {
        const node = cardRefs.current[i];
        if (!node) return;
        const frac = clamp(((c.x + c.w / 2) * vw - sl) / cw);
        const dist = Math.abs(frac - 0.5) * 2;
        const t = clamp((dist - EDGE_FADE_START) / (1 - EDGE_FADE_START));
        node.style.opacity = String(1 - (1 - EDGE_MIN_OPACITY) * t);
      });
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(sync);
    };

    const measure = () => setSize({ vw: window.innerWidth / 100, h: el.clientHeight });

    measure();
    sync();
    const ro = new ResizeObserver(() => {
      measure();
      sync();
    });
    ro.observe(el);
    el.addEventListener("scroll", onScroll, { passive: true });
    el.addEventListener("wheel", onWheel, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      ro.disconnect();
      el.removeEventListener("scroll", onScroll);
      el.removeEventListener("wheel", onWheel);
    };
  }, []);

  // Kéo chuột để đi ngang (cảm ứng và trackpad dùng cuộn tự nhiên)
  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    const el = viewRef.current;
    if (!el || e.pointerType !== "mouse" || e.button !== 0) return;
    drag.current = { on: true, x: e.clientX, left: el.scrollLeft, moved: false };
    el.setPointerCapture(e.pointerId);
  };

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const el = viewRef.current;
    const d = drag.current;
    if (!el || !d.on) return;
    const dx = e.clientX - d.x;
    if (Math.abs(dx) > 4) d.moved = true;
    el.scrollLeft = d.left - dx;
  };

  const onUp = () => {
    drag.current.on = false;
  };

  return (
    <section
      id="learning"
      className="flex h-screen flex-col overflow-hidden bg-white py-[5vh] text-[#1a1a1a]"
    >
      <div className="shrink-0 px-6 md:px-12">
        <h2 className="font-serif text-[2vw] italic leading-[1.3] tracking-tight md:text-[3.2vw]">{HEADLINE}</h2>

        <div className="mt-[3vh] grid grid-cols-1 gap-x-16 md:grid-cols-2">
          <div>
            <p className="text-[0.95vw] font-medium leading-snug">{LEFT_HEAD}</p>
            <p className="mt-2 max-w-xl text-[0.85vw] leading-relaxed text-[#1a1a1a]/65">{LEFT_BODY}</p>
          </div>
          <div>
            <p className="text-[0.95vw] font-medium leading-snug">{RIGHT_HEAD}</p>
            <p className="mt-2 max-w-xl text-[0.85vw] leading-relaxed text-[#1a1a1a]/65">{RIGHT_BODY}</p>
          </div>
        </div>
      </div>

      <div className="mt-[2vh] flex shrink-0 justify-end px-6 md:px-12">
        <div className="flex flex-col items-end gap-1.5 font-mono text-xs">
          <span>
            Speaking · <span className="font-semibold">{LEVELS[level]}</span>
          </span>
          <div className="relative flex h-5 w-[min(16rem,30vw)] items-center justify-between">
            {TICKS.map((h, i) => (
              <span key={i} className="w-px bg-[#1a1a1a]/40" style={{ height: h }} />
            ))}
            <div
              ref={dotRef}
              className="absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#d62828] shadow-[0_0_0_3px_rgba(214,40,40,0.15)]"
              style={{ left: "0%" }}
            />
          </div>
          <div className="flex w-[min(16rem,30vw)] justify-between text-[9px] uppercase tracking-[0.2em] text-[#9a9a9a]">
            <span>Basic</span>
            <span>Advanced</span>
          </div>
        </div>
      </div>

      {/* Vùng card: rộng toàn màn hình để các rìa là rìa thật của website */}
      <div className="relative mt-[1vh] min-h-0 flex-1">
        <div
          ref={viewRef}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          className="h-full w-full cursor-grab select-none overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <div className="relative h-full" style={{ width: `${TRACK_VW}vw` }}>
            <svg
              className="pointer-events-none absolute left-0 top-0"
              width={TRACK_VW * size.vw}
              height={size.h}
              viewBox={`0 0 ${TRACK_VW * size.vw} ${size.h}`}
              aria-hidden="true"
            >
              {LINKS.map((l, i) => {
                const p = pathFor(CARDS[l.from], CARDS[l.to], size.vw, size.h);
                return (
                  <g key={i}>
                    <path
                      d={p.d}
                      fill="none"
                      stroke={l.color}
                      strokeWidth={l.width ?? 1.2}
                      strokeDasharray={l.dash}
                      strokeLinecap="round"
                    />
                    <circle cx={p.x1} cy={p.y1} r="3" fill="#ffffff" stroke={l.color} strokeWidth="1.2" />
                    <circle cx={p.x2} cy={p.y2} r="3" fill="#ffffff" stroke={l.color} strokeWidth="1.2" />
                  </g>
                );
              })}
            </svg>

            {CARDS.map((c, i) => {
  const tint = LEVEL_TINT[c.level];
  return (
    <div
      key={i}
      ref={(node) => {
        cardRefs.current[i] = node;
      }}
      className="absolute"
      style={{
        left: `${c.x}vw`,
        top: `${c.y * 100}%`,
        width: `${c.w}vw`,
      }}
    >
      <div className="flex flex-col rounded-xl border border-[#1a1a1a]/10 bg-white p-[1.1vw] shadow-[0_10px_24px_-16px_rgba(0,0,0,0.25)]">
        {/* Vùng 1: nhãn cấp độ và số thứ tự, luôn ở đầu thẻ */}
        <div className="flex items-start justify-between gap-2">
          <span
            className="rounded px-1.5 py-0.5 font-mono text-[0.6vw] uppercase tracking-[0.2em]"
            style={{ backgroundColor: tint.bg, color: tint.fg }}
          >
            {c.tag}
          </span>
          <span className="font-mono text-[0.7vw] text-[#9a9a9a]">{String(i + 1).padStart(2, "0")}</span>
        </div>

        {/* Vùng 2: tiêu đề và mô tả, có chiều cao tối thiểu cố định để tiêu đề luôn ở cùng vị trí */}
        <div className="mt-[1.6vw] flex min-h-[7vw] flex-col">
          <h3 className="text-[0.95vw] font-bold leading-snug tracking-[0em]">{c.title}</h3>
          <p className="mt-[0.6vw] text-[0.85vw] leading-snug text-[#1a1a1a]/65">{c.body}</p>
        </div>

        {/* Vùng 3: ghi chú, nằm ngay sau nội dung */}
        <p className="mt-[1.2vw] font-mono text-[0.6vw] uppercase tracking-[0.2em] text-[#9a9a9a]">{c.note}</p>
      </div>
    </div>
  );
})}
          </div>
        </div>

        {/* Gradient tĩnh ở hai rìa: thay cho mask, rẻ hơn khi cuộn */}
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-10 bg-gradient-to-r from-white to-transparent"
          style={{ width: EDGE_WIDTH }}
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-10 bg-gradient-to-l from-white to-transparent"
          style={{ width: EDGE_WIDTH }}
        />
      </div>
    </section>
  );
}