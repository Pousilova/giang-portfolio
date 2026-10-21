"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";

// ===== Nội dung các mục story (thay bằng nội dung thật) =====
const STEPS = [
  {
    label: "NÓI THEO BẢN NĂNG",
    body:
      "A real business challenge: redesigning the journey of a car comparison platform, from discovery to qualified booking. The project explored how UX research and design could support complex purchase decisions.",
    meta: "UX Design Executive Course · POLI.design × DriveK",
  },
  {
    label: "NÓI THAT'S EVERYTHING KHI CHƯA TỚI NGƯỠNG 2 PHÚT",
    body: "Nội dung placeholder cho mục này. Bạn thay bằng đoạn mô tả thật về cách mình xử lý khi chưa đủ thời gian trả lời.",
    meta: "Placeholder",
  },
  {
    label: "KHÔNG DÙNG SIGNPOSTS VÀ LINKERS",
    body: "Nội dung placeholder cho mục này. Bạn thay bằng đoạn mô tả thật về việc bỏ các từ nối và cách giữ mạch lập luận.",
    meta: "Placeholder",
  },
];

const TITLE = ["Những gì đã khiến mình", "kẹt ở band 6.5 Speaking"];

const CUE_CARD = {
  title: "Describe a small business that you would like to open.",
  points: [
    "what it is",
    "where and when you want to start it",
    "how you would do this",
    "and explain why you have chosen this kind of business to start.",
  ],
};

const DECOR: { text: string; x: number; y: number; rotate: number; delay: number }[] = [
  { text: "returning visitors", x: 4, y: 58, rotate: -6, delay: 900 },
  { text: "quiz?", x: 84, y: 14, rotate: 8, delay: 1100 },
  { text: "→ airbnb's budget search", x: 62, y: 86, rotate: -3, delay: 1250 },
];

const NOTE_STYLES = [
  { bg: "#cdeefc", rotate: "-2deg" },
  { bg: "#fdf5b5", rotate: "1.5deg" },
  { bg: "#eee0fb", rotate: "-1deg" },
  { bg: "#fde0d4", rotate: "2deg" },
];

// ===== Chuyển cảnh =====
const LEFT_LABEL = "UX DESIGN";
const RIGHT_LABEL = "PROJECT";
const CENTER_LABEL = "[03]";
const ARROW_COLOR = "#d62828";
const ARROW_MIN_VW = 4;
const TRAVEL_VW = 37;
const LABEL_GAP = "1.25rem";
const TRANS_RANGE = 60; // quãng cuộn chuyển cảnh (vh)
const FADE_START = 0.25;
const STORY_WIDTH = "60vw";

// ===== Cuộn =====
const STEP_MS = 700; // thời lượng mỗi lần tự cuộn (ms)
const QUIET_MS = 140; // khoảng lặng giữa các cú lăn bước (ms)
const EXIT_P = 0.995; // tiến độ coi như đã thoát khỏi section

// ===== Tính toán cố định =====
const N = STEPS.length;
const TOTAL_VH = TRANS_RANGE + N * 100;
const T_END = TRANS_RANGE / TOTAL_VH;
const COLUMN_H = "h-[min(70vh,560px)]";

const clamp = (v: number, min = 0, max = 1) => Math.min(Math.max(v, min), max);
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

type From = "up" | "down" | "left" | "right" | "scale";
const HIDDEN: Record<From, string> = {
  up: "translate3d(0, 28px, 0)",
  down: "translate3d(0, -28px, 0)",
  left: "translate3d(-40px, 0, 0)",
  right: "translate3d(40px, 0, 0)",
  scale: "scale(0.92)",
};

function Reveal({
  show,
  delay = 0,
  from = "up",
  className = "",
  style,
  children,
}: {
  show: boolean;
  delay?: number;
  from?: From;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const base: CSSProperties = {
    opacity: show ? 1 : 0,
    transform: show ? "none" : HIDDEN[from],
    transition: `opacity 700ms cubic-bezier(.22,1,.36,1) ${show ? delay : 0}ms, transform 900ms cubic-bezier(.22,1,.36,1) ${show ? delay : 0}ms`,
    willChange: "transform, opacity",
    pointerEvents: show ? "auto" : "none",
  };
  return (
    <div className={className} style={{ ...base, ...style }}>
      {children}
    </div>
  );
}

type LenisLike = {
  scrollTo: (target: number, options: { duration: number; easing: (t: number) => number }) => void;
};

// Bật/tắt việc Lenis bỏ qua sự kiện lăn trong section này
const setLenisPrevent = (el: HTMLElement, on: boolean) => {
  if (on) el.setAttribute("data-lenis-prevent", "");
  else el.removeAttribute("data-lenis-prevent");
};

export default function TransitionStory() {
  const sectionRef = useRef<HTMLElement>(null);
  const storyRef = useRef<HTMLDivElement>(null);
  const leftRef = useRef<HTMLSpanElement>(null);
  const rightRef = useRef<HTMLSpanElement>(null);
  const arrowWrapRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLDivElement>(null);
  const centerRef = useRef<HTMLSpanElement>(null);
  const [active, setActive] = useState(0);

  // Một bộ điều khiển duy nhất: mọi chuyển động trong story đi qua Lenis.scrollTo
  const scroller = useRef({
    busy: false,
    lastWheel: 0,
    timer: 0,
    anim: 0,
    targetIdx: 0,
    to(y: number) {
      window.clearTimeout(this.timer);
      this.busy = true;
      const lenis = (window as unknown as { __lenis?: LenisLike }).__lenis;
      if (lenis) {
        lenis.scrollTo(y, { duration: STEP_MS / 1000, easing: easeInOutCubic });
      } else {
        cancelAnimationFrame(this.anim);
        const start = window.scrollY;
        const dist = y - start;
        const t0 = performance.now();
        const step = (now: number) => {
          const t = Math.min((now - t0) / STEP_MS, 1);
          window.scrollTo(0, start + dist * easeInOutCubic(t));
          if (t < 1) this.anim = requestAnimationFrame(step);
        };
        this.anim = requestAnimationFrame(step);
      }
      this.timer = window.setTimeout(() => {
        this.busy = false;
        this.lastWheel = performance.now();
      }, STEP_MS + 60);
    },
  });

  const progressOf = (section: HTMLElement) => {
    const r = section.getBoundingClientRect();
    const total = section.offsetHeight - window.innerHeight;
    return clamp(-r.top / total);
  };

  const indexOf = (p: number) => {
    const sp = clamp((p - T_END) / (1 - T_END));
    return Math.min(Math.floor(sp * N), N - 1);
  };

  const yForStep = (section: HTMLElement, i: number) => {
    const total = section.offsetHeight - window.innerHeight;
    const top = section.getBoundingClientRect().top + window.scrollY;
    return top + (T_END + ((i + 0.01) / N) * (1 - T_END)) * total;
  };

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const sc = scroller.current;
    let frame = 0;

    const update = () => {
      frame = 0;
      const p = progressOf(section);
      const tp = clamp(p / T_END);
      const fade = clamp((tp - FADE_START) / (1 - FADE_START));

      const travel = TRAVEL_VW * tp;
      if (leftRef.current) leftRef.current.style.transform = `translate3d(${-travel}vw, 0, 0)`;
      if (rightRef.current) rightRef.current.style.transform = `translate3d(${travel}vw, 0, 0)`;
      if (arrowWrapRef.current) arrowWrapRef.current.style.width = `${ARROW_MIN_VW + travel * 2}vw`;

      const arrowOpacity = String(1 - fade);
      if (lineRef.current) lineRef.current.style.opacity = arrowOpacity;
      if (headRef.current) headRef.current.style.opacity = arrowOpacity;
      if (centerRef.current) centerRef.current.style.opacity = arrowOpacity;

      if (storyRef.current) storyRef.current.style.opacity = String(fade);

      if (!sc.busy) {
        const idx = indexOf(p);
        setActive((prev) => (prev === idx ? prev : idx));
      } else {
        setActive((prev) => (prev === sc.targetIdx ? prev : sc.targetIdx));
      }
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    const onWheel = (e: WheelEvent) => {
      // Lăn ngang: để trình duyệt xử lý
      if (Math.abs(e.deltaY) < Math.abs(e.deltaX)) return;

      const r = section.getBoundingClientRect();
      const pinned = r.top <= 0 && r.bottom >= window.innerHeight;
      const p = progressOf(section);
      const dir = e.deltaY > 0 ? 1 : -1;

      // Chuyển cảnh, đã thoát xuống, hoặc ngoài vùng ghim: Lenis cuộn bình thường
      if (!pinned || p <= T_END || (p >= EXIT_P && dir > 0)) {
        setLenisPrevent(section, false);
        return;
      }

      // Trong story: chặn cuộn tự nhiên để một bộ điều khiển duy nhất đảm nhận
      setLenisPrevent(section, true);
      e.preventDefault();

      if (sc.busy) return; // đang tự cuộn: nuốt hết quán tính của trackpad

      const now = performance.now();
      const gap = now - sc.lastWheel;
      sc.lastWheel = now;
      if (gap < QUIET_MS) return;

      const current = indexOf(p);

      // Bước cuối, cuộn xuống: tự cuộn tới đúng biên dưới, rồi trả quyền cho Lenis
      if (dir > 0 && current === N - 1) {
        sc.targetIdx = N - 1;
        sc.to(window.scrollY + r.bottom - window.innerHeight);
        return;
      }

      // Bước đầu, cuộn lên: tự cuộn về đầu section để quay lại phần chuyển cảnh
      if (dir < 0 && current === 0) {
        sc.targetIdx = 0;
        sc.to(window.scrollY + r.top);
        return;
      }

      const target = current + dir;
      sc.targetIdx = target;
      setActive(target);
      sc.to(yForStep(section, target));
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    window.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      cancelAnimationFrame(sc.anim);
      window.clearTimeout(sc.timer);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("wheel", onWheel);
    };
  }, []);

  const goTo = (i: number) => {
    const section = sectionRef.current;
    if (!section) return;
    scroller.current.targetIdx = i;
    setActive(i);
    scroller.current.to(yForStep(section, i));
  };

  const s1 = active === 0;
  const s2 = active === 1;
  const s3 = active === 2;

  return (
    <section
      ref={sectionRef}
      style={{ height: `${100 + TOTAL_VH}vh` }}
      className="relative bg-white text-[#1a1a1a]"
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <div
          ref={storyRef}
          className="absolute inset-0 flex items-center justify-center"
          style={{ opacity: 0, willChange: "opacity" }}
        >
          <div className="grid items-center gap-10 md:grid-cols-2" style={{ width: STORY_WIDTH }}>
            <div className={`flex ${COLUMN_H} flex-col justify-start pt-[12%]`}>
              <h2 className="font-serif text-[2vw] italic leading-[1.3] tracking-tight">
                {TITLE.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </h2>

              <ol className="mt-10 space-y-6">
                {STEPS.map((step, i) => {
                  const isActive = i === active;
                  return (
                    <li key={step.label}>
                      <button
                        type="button"
                        onClick={() => goTo(i)}
                        aria-expanded={isActive}
                        className="group flex w-full items-center gap-4 text-left"
                      >
                        <span
                          className={`h-2 w-2 shrink-0 rounded-full transition-colors duration-300 ${
                            isActive ? "bg-[#d62828]" : "bg-[#1a1a1a]/20"
                          }`}
                        />
                        <span
                          className={`font-mono text-xs uppercase tracking-[0.2em] transition-colors duration-300 group-hover:text-[#1a1a1a] ${
                            isActive ? "text-[#1a1a1a]" : "text-[#9a9a9a]"
                          }`}
                        >
                          {step.label}
                        </span>
                      </button>

                      <div
                        className={`grid transition-[grid-template-rows,opacity,transform] duration-500 ease-out ${
                          isActive
                            ? "grid-rows-[1fr] translate-y-0 opacity-100"
                            : "grid-rows-[0fr] translate-y-2 opacity-0"
                        }`}
                      >
                        <div className="overflow-hidden">
                          <p className="mt-4 max-w-md pl-6 text-base leading-relaxed text-[#1a1a1a]/75">
                            {step.body}
                          </p>
                          <p className="mt-3 pl-6 font-mono text-xs text-[#9a9a9a]">{step.meta}</p>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>

            <div className={`relative ${COLUMN_H} w-full`}>
              <Reveal show={s1} from="scale" className="absolute inset-0">
                <svg viewBox="0 0 400 260" className="h-full w-full">
                  <path
                    d="M20 210 C 60 60, 240 40, 330 150"
                    fill="none"
                    stroke="#d62828"
                    strokeWidth="1.5"
                    pathLength={1}
                    strokeDasharray="1"
                    strokeDashoffset={s1 ? 0 : 1}
                    style={{ transition: "stroke-dashoffset 1600ms cubic-bezier(.22,1,.36,1) 150ms" }}
                  />
                  {[20, 130, 200, 330].map((x, i) => (
                    <circle
                      key={x}
                      cx={x}
                      cy={i % 2 ? 90 : 210}
                      r="5"
                      fill="#ffffff"
                      stroke="#1a1a1a"
                      strokeWidth="1.5"
                      style={{
                        opacity: s1 ? 1 : 0,
                        transition: `opacity 500ms ease-out ${s1 ? 400 + i * 180 : 0}ms`,
                      }}
                    />
                  ))}
                </svg>
              </Reveal>

              <Reveal show={s1} from="up" delay={650} className="absolute inset-x-[10%] bottom-6">
                <div className="flex items-center gap-3 rounded-full border border-[#1a1a1a]/15 bg-white px-5 py-3 text-sm">
                  <span className="text-[#9a9a9a]">⌕</span>
                  <span>new 500 trunk space</span>
                </div>
              </Reveal>

              {DECOR.map((d) => (
                <Reveal
                  key={d.text}
                  show={s2}
                  from="scale"
                  delay={d.delay}
                  className="pointer-events-none absolute"
                  style={{ left: `${d.x}%`, top: `${d.y}%` }}
                >
                  <span
                    className="block whitespace-nowrap font-serif italic text-sm text-[#6b6b6b]"
                    style={{ transform: `rotate(${d.rotate}deg)` }}
                  >
                    {d.text}
                  </span>
                </Reveal>
              ))}

              <div className="absolute inset-0 flex flex-col justify-center">
                <Reveal show={s2} from="up">
                  <h3 className="font-serif text-3xl font-semibold leading-tight">{CUE_CARD.title}</h3>
                  <p className="mt-5 font-serif italic text-[#1a1a1a]/70">You should say:</p>
                </Reveal>

                <div className="mt-12 flex flex-wrap gap-x-4 gap-y-5">
                  {CUE_CARD.points.map((point, i) => {
                    const st = NOTE_STYLES[i % NOTE_STYLES.length];
                    return (
                      <Reveal
                        key={point}
                        show={s2}
                        from={i % 2 === 0 ? "left" : "right"}
                        delay={300 + i * 140}
                      >
                        <span
                          className="inline-block rounded-[10px] px-4 py-3 font-sans text-sm leading-snug text-[#1a1a1a]"
                          style={{ backgroundColor: st.bg, transform: `rotate(${st.rotate})` }}
                        >
                          {point}
                        </span>
                      </Reveal>
                    );
                  })}
                </div>
              </div>

              <Reveal show={s3} from="scale" className="absolute inset-0">
                <div className="relative h-full w-full overflow-hidden rounded-2xl border border-[#1a1a1a]/10 bg-[#f4f4f2]">
                  <div className="flex h-full items-center justify-center font-mono text-xs uppercase tracking-[0.2em] text-[#9a9a9a]">
                    Image / video placeholder
                  </div>
                </div>
              </Reveal>

              <Reveal show={s3} from="up" delay={450} className="absolute inset-x-0 bottom-0">
                <div className="flex items-center gap-4 rounded-b-2xl bg-[#1a1a1a] px-5 py-4 text-white">
                  <span>▶</span>
                  <span>🔊</span>
                  <span className="h-[2px] flex-1 bg-white/40" />
                </div>
              </Reveal>
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center px-6 md:px-12">
          <div className="relative flex h-10 items-center" style={{ width: `${ARROW_MIN_VW}vw` }}>
            <span
              ref={leftRef}
              className="absolute right-full whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.2em] will-change-transform md:text-xs"
              style={{ marginRight: LABEL_GAP, transform: "translate3d(0, 0, 0)" }}
            >
              {LEFT_LABEL}
            </span>

            <div
              ref={arrowWrapRef}
              className="absolute left-1/2 top-0 flex h-full -translate-x-1/2 items-center"
              style={{ width: `${ARROW_MIN_VW}vw` }}
            >
              <span
                ref={centerRef}
                className="absolute left-1/2 -top-2 -translate-x-1/2 font-mono text-[10px] tracking-[0.2em] text-[#9a9a9a]"
                style={{ opacity: 1 }}
              >
                {CENTER_LABEL}
              </span>

              <div ref={lineRef} className="h-[2px] w-full" style={{ backgroundColor: ARROW_COLOR, opacity: 1 }} />

              <div
                ref={headRef}
                className="absolute -right-[1px] top-1/2 -translate-y-1/2"
                style={{
                  width: 0,
                  height: 0,
                  borderTop: "5px solid transparent",
                  borderBottom: "5px solid transparent",
                  borderLeft: `8px solid ${ARROW_COLOR}`,
                  opacity: 1,
                }}
              />
            </div>

            <span
              ref={rightRef}
              className="absolute left-full whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.2em] will-change-transform md:text-xs"
              style={{ marginLeft: LABEL_GAP, transform: "translate3d(0, 0, 0)" }}
            >
              {RIGHT_LABEL}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}