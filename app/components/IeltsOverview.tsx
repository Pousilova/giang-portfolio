"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";

type Skill = { name: string; score: string; highlight?: boolean };
type Exam = {
  date: string;
  place: string;
  overall: string;
  skills: Skill[];
  latest?: boolean;
};

// ===== Cấu hình =====
const RESPECT_REDUCED_MOTION = false; // true: nếu macOS bật "Giảm chuyển động" thì bỏ hiệu ứng xuất hiện. false: luôn hiện hiệu ứng.

const PLACE_COLORS: Record<string, string> = {
  IDP: "text-[#d62828]",
  "British Council": "text-[#1d4ed8]",
};

const EXAMS: Exam[] = [
  {
    date: "27/05/2026",
    place: "IDP",
    overall: "8.5",
    latest: true,
    skills: [
      { name: "Listening", score: "8.5" },
      { name: "Reading", score: "9.0" },
      { name: "Writing", score: "8.0" },
      { name: "Speaking (retake)", score: "8.0", highlight: true },
    ],
  },
  {
    date: "29/03/2026",
    place: "IDP",
    overall: "8.0",
    skills: [
      { name: "Listening", score: "8.5" },
      { name: "Reading", score: "9.0" },
      { name: "Writing", score: "8.0" },
      { name: "Speaking", score: "6.5" },
    ],
  },
  {
    date: "10/11/2025",
    place: "British Council",
    overall: "7.5",
    skills: [
      { name: "Listening", score: "8.0" },
      { name: "Reading", score: "8.5" },
      { name: "Writing", score: "7.0" },
      { name: "Speaking", score: "7.0" },
    ],
  },
  {
    date: "xx/xx/2023",
    place: "British Council",
    overall: "7.5",
    skills: [
      { name: "Listening", score: "8.5" },
      { name: "Reading", score: "8.5" },
      { name: "Writing", score: "6.5" },
      { name: "Speaking", score: "6.5" },
    ],
  },
];

const GAP = 24;
const SPACING = 1.0;
const DRAG_SENSITIVITY = 2.5;
const WHEEL_SENSITIVITY = 2.0;
const DRAG_RESPONSE = 1.5;
const SNAP_RESPONSE = 3;
const WHEEL_SETTLE_MS = 160;
const SIDE_SCALE = 0.86;
const SIDE_VEIL = 0.6;
const YAW_DEG = -10;
const PERSPECTIVE = 900;
const EPS = 0.0005;

// Hiệu ứng xuất hiện
const ENTER_MS = 1100;
const ENTER_OFFSET_Y = 80; // thẻ giữa trồi từ dưới lên (px)
const ENTER_OFFSET_X = 140; // thẻ hai bên trượt từ ngoài vào (px)

const wrapDistance = (d: number, n: number) => {
  let x = ((d % n) + n) % n;
  if (x > n / 2) x -= n;
  return x;
};

// Vị trí ẩn ban đầu của từng thẻ theo hướng xuất hiện
const hiddenTransform = (dir: "rise" | "left" | "right") => {
  if (dir === "rise") return `translate3d(0, ${ENTER_OFFSET_Y}px, 0)`;
  if (dir === "left") return `translate3d(-${ENTER_OFFSET_X}px, 0, 0)`;
  return `translate3d(${ENTER_OFFSET_X}px, 0, 0)`;
};

function ExamCard({ exam }: { exam: Exam }) {
  const placeColor = PLACE_COLORS[exam.place] ?? "text-[#1a1a1a]";

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-[#1a1a1a]/15 bg-white shadow-[0_12px_30px_-18px_rgba(0,0,0,0.15)]">
      <div className="flex items-end justify-between gap-6 border-b border-[#1a1a1a]/10 px-6 pb-5 pt-6">
        <h3 className="text-2xl font-semibold text-[#d62828]">Overall {exam.overall}</h3>

        <div className="flex flex-col items-end gap-2 text-right">
          {exam.latest && (
            <span className="rounded-md bg-[#f7b52c] px-2.5 py-1 font-mono text-xs text-[#1a1a1a]">Gần nhất</span>
          )}
          <p className="font-mono text-sm text-[#6b6b6b]">
            {exam.date} · <span className={`font-bold ${placeColor}`}>{exam.place}</span>
          </p>
        </div>
      </div>

      <div className="flex justify-between border-b border-[#1a1a1a]/10 px-6 py-3 font-mono text-[11px] uppercase tracking-[0.2em] text-[#6b6b6b]">
        <span>Skill</span>
        <span>Score</span>
      </div>

      {exam.skills.map((skill) => (
        <div
          key={skill.name}
          className="flex items-center justify-between border-b border-[#1a1a1a]/10 px-6 py-5 last:border-b-0"
        >
          <span className="text-base">{skill.name}</span>
          <span className={`text-xl font-medium ${skill.highlight ? "text-[#d62828]" : "text-[#1a1a1a]"}`}>
            {skill.score}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function IeltsOverview() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const veilRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Trạng thái xuất hiện: đổi bằng React state, không thao tác classList
  const [inView, setInView] = useState(false);

  // Quan sát section; khi đi vào khung nhìn thì bật hiệu ứng một lần duy nhất
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const reduce =
      RESPECT_REDUCED_MOTION && !!window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduce || !("IntersectionObserver" in window)) {
      setInView(true);
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold: 0, rootMargin: "0px 0px -10% 0px" }
    );
    io.observe(section);
    return () => io.disconnect();
  }, []);

  // Carousel: kéo, lăn ngang, độ mờ và góc xoay
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const cards = cardRefs.current;
    const veils = veilRefs.current;
    const n = EXAMS.length;

    let target = 0;
    let shown = 0;
    let last = performance.now();
    let frame = 0;
    let running = false;
    const lastStyle: string[] = new Array(n).fill("");

    let dragging = false;
    let moved = false;
    let startX = 0;
    let startPos = 0;
    let wheelTimer = 0;

    const getStep = () => ((cards[0]?.offsetWidth ?? 400) + GAP) * SPACING;

    const kick = () => {
      if (!running) {
        running = true;
        last = performance.now();
        frame = requestAnimationFrame(render);
      }
    };

    const snap = () => {
      target = Math.round(target);
      kick();
    };

    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      dragging = true;
      moved = false;
      startX = e.clientX;
      startPos = target;
      track.style.cursor = "grabbing";
      kick();
    };

    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 5) moved = true;
      target = startPos - (dx * DRAG_SENSITIVITY) / getStep();
      kick();
    };

    const onUp = () => {
      if (!dragging) return;
      dragging = false;
      track.style.cursor = "";
      snap();
    };

    const onWheel = (e: WheelEvent) => {
      const horizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY) || e.shiftKey;
      if (!horizontal) return;
      e.preventDefault();
      e.stopPropagation();
      const delta = e.deltaX || e.deltaY;
      target += (delta * WHEEL_SENSITIVITY) / getStep();
      window.clearTimeout(wheelTimer);
      wheelTimer = window.setTimeout(snap, WHEEL_SETTLE_MS);
      kick();
    };

    const onClick = (e: MouseEvent) => {
      if (moved) {
        e.preventDefault();
        e.stopPropagation();
        moved = false;
        return;
      }
      const card = (e.target as HTMLElement).closest<HTMLElement>("[data-idx]");
      if (!card) return;
      const idx = Number(card.dataset.idx);
      const d = wrapDistance(idx - shown, n);
      if (Math.abs(d) > 0.5) {
        e.preventDefault();
        e.stopPropagation();
        target = Math.round(shown + d);
        kick();
      }
    };

    const render = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      const k = dragging ? DRAG_RESPONSE : SNAP_RESPONSE;
      shown += (target - shown) * (1 - Math.exp(-k * dt));
      if (Math.abs(target - shown) < EPS) shown = target;

      cards.forEach((el, i) => {
        if (!el) return;
        const d = wrapDistance(i - shown, n);
        const a = Math.min(Math.abs(d), 1);
        const scale = SIDE_SCALE + (1 - SIDE_SCALE) * (1 - a);
        const veil = a * SIDE_VEIL;
        const yaw = -Math.max(-1, Math.min(1, d)) * YAW_DEG;
        const visible = Math.abs(d) < 1.5;
        const z = Math.round(100 - a * 50);

        const transform = `translate3d(calc(${d.toFixed(4)} * (var(--cw) + ${GAP}px) * ${SPACING}), 0, 0) rotateY(${yaw.toFixed(2)}deg) scale(${scale.toFixed(4)})`;
        const key = `${transform}|${veil.toFixed(3)}|${visible}|${z}`;

        if (key !== lastStyle[i]) {
          lastStyle[i] = key;
          el.style.transform = transform;
          el.style.opacity = visible ? "1" : "0";
          el.style.pointerEvents = visible ? "auto" : "none";
          el.style.zIndex = String(z);
          if (veils[i]) veils[i]!.style.opacity = veil.toFixed(3);
        }
      });

      const settled = !dragging && Math.abs(target - shown) < EPS;
      if (settled) {
        running = false;
        return;
      }
      frame = requestAnimationFrame(render);
    };

    track.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    track.addEventListener("wheel", onWheel, { passive: false });
    track.addEventListener("click", onClick, true);
    kick();

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(wheelTimer);
      track.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      track.removeEventListener("wheel", onWheel);
      track.removeEventListener("click", onClick, true);
    };
  }, []);

  return (
    <section ref={sectionRef} id="overview" className="overflow-hidden bg-white py-16 text-[#1a1a1a]">
      <div
        ref={trackRef}
        className="mx-auto grid w-full cursor-grab select-none place-items-center"
        style={{ "--cw": "min(560px, 85vw)", perspective: `${PERSPECTIVE}px` } as CSSProperties}
      >
        {EXAMS.map((exam, i) => {
          const dir: "rise" | "left" | "right" = i === 0 ? "rise" : wrapDistance(i, EXAMS.length) > 0 ? "right" : "left";
          const delay = i === 0 ? 150 : 0;

          // Hiệu ứng xuất hiện nằm ở lớp bên trong, tách khỏi lớp mà JS điều khiển vị trí khi cuộn
          const enterStyle: CSSProperties = {
            opacity: inView ? 1 : 0,
            transform: inView ? "none" : hiddenTransform(dir),
            transition: `opacity ${Math.round(ENTER_MS * 0.8)}ms cubic-bezier(.22,1,.36,1) ${delay}ms, transform ${ENTER_MS}ms cubic-bezier(.22,1,.36,1) ${delay}ms`,
            willChange: "transform, opacity",
          };

          return (
            <div
              key={`${exam.date}-${i}`}
              data-idx={i}
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              style={{ gridArea: "1 / 1", width: "var(--cw)", transformOrigin: "center center" }}
            >
              <div className="relative" style={enterStyle}>
                <ExamCard exam={exam} />
                <div
                  ref={(el) => {
                    veilRefs.current[i] = el;
                  }}
                  className="pointer-events-none absolute inset-0 rounded-2xl bg-white"
                  style={{ opacity: 0 }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}