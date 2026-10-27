"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import dynamic from "next/dynamic";

// Three.js chỉ chạy trên trình duyệt
const WireGlobe = dynamic(() => import("./WireGlobe"), { ssr: false });

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
  "BC": "text-[#1d4ed8]",
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
    place: "BC",
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
    place: "BC",
    overall: "7.5",
    skills: [
      { name: "Listening", score: "8.5" },
      { name: "Reading", score: "8.5" },
      { name: "Writing", score: "6.5" },
      { name: "Speaking", score: "6.5" },
    ],
  },
];

// Quỹ đạo: bán kính ngang tối đa (px), bán kính sâu (px), độ nghiêng theo chiều sâu
const ORBIT_RX_RATIO = 0.36; // theo chiều rộng màn hình
const ORBIT_RX_MAX = 420;
const ORBIT_RZ = 220;
const ORBIT_TILT = 0.18;
const PERSPECTIVE = 2000;
const BACK_OPACITY = 0.3; // thẻ ở phía sau mờ tới mức này

// Quả cầu ở giữa
const PLANET_PX = 280;

// Chuyển động
const TAU = Math.PI * 2;
const STEP = TAU / EXAMS.length;
const AUTO_SPEED = 0.18; // rad/s, tự quay sang phải khi không tương tác
const RESUME_LERP = 1.2; // tốc độ trở về quay tự động sau khi thả tay (1/s)
const DRAG_RAD_PER_PX = 0.008;
const WHEEL_RAD_PER_PX = 0.0015;

// Hiệu ứng xuất hiện
const ENTER_MS = 1100;
const ENTER_OFFSET_Y = 60; // cả cụm trồi từ dưới lên (px)

function ExamCard({ exam }: { exam: Exam }) {
  const placeColor = PLACE_COLORS[exam.place] ?? "text-[#1a1a1a]";

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-[#1a1a1a]/15 bg-white/70 shadow-[0_12px_30px_-18px_rgba(0,0,0,0.15)] backdrop-blur-sm">
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
  const stageRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const spinRef = useRef(0); // góc quay hiện tại, quả cầu đọc giá trị này

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

  // Quỹ đạo 3D: quả cầu ở giữa, các thẻ chạy quanh theo vòng tròn
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const cards = cardRefs.current;

    let rx = Math.min(window.innerWidth * ORBIT_RX_RATIO, ORBIT_RX_MAX);
    let angle = 0; // góc của thẻ đầu tiên (thẻ gần nhất), tăng = quay sang phải
    let vel = AUTO_SPEED; // rad/s
    let dragging = false;
    let startX = 0;
    let startAngle = 0;
    let lastX = 0;
    let lastT = 0;
    let last = performance.now();
    let frame = 0;

    const onResize = () => {
      rx = Math.min(window.innerWidth * ORBIT_RX_RATIO, ORBIT_RX_MAX);
    };

    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      dragging = true;
      startX = e.clientX;
      startAngle = angle;
      lastX = e.clientX;
      lastT = performance.now();
      stage.style.cursor = "grabbing";
    };

    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const now = performance.now();
      const dt = Math.max((now - lastT) / 1000, 0.001);
      angle = startAngle + (e.clientX - startX) * DRAG_RAD_PER_PX;
      // Ghi nhận vận tốc để khi thả tay vòng quay đi tiếp rồi mới chậm dần
      vel = ((e.clientX - lastX) * DRAG_RAD_PER_PX) / dt;
      lastX = e.clientX;
      lastT = now;
    };

    const onUp = () => {
      if (!dragging) return;
      dragging = false;
      stage.style.cursor = "";
    };

    const onWheel = (e: WheelEvent) => {
      const horizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY) || e.shiftKey;
      if (!horizontal) return;
      e.preventDefault();
      angle += (e.deltaX || e.deltaY) * WHEEL_RAD_PER_PX;
    };

    const render = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      // Khi không kéo: vận tốc dần về tốc độ tự quay sang phải
      if (!dragging) {
        vel += (AUTO_SPEED - vel) * (1 - Math.exp(-RESUME_LERP * dt));
        angle += vel * dt;
      }
      angle %= TAU;

      cards.forEach((el, i) => {
        if (!el) return;
        const th = angle + i * STEP;
        const x = rx * Math.sin(th);
        const z = ORBIT_RZ * Math.cos(th);
        const y = z * ORBIT_TILT;
        const depth = (z + ORBIT_RZ) / (2 * ORBIT_RZ); // 0 phía sau, 1 phía trước
        el.style.transform = `translate3d(-50%, -50%, 0) translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, ${z.toFixed(2)}px)`;
        el.style.opacity = (BACK_OPACITY + (1 - BACK_OPACITY) * depth).toFixed(3);
        el.style.zIndex = String(500 + Math.round(z));
      });

      spinRef.current = angle;

      frame = requestAnimationFrame(render);
    };

    window.addEventListener("resize", onResize);
    stage.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    stage.addEventListener("wheel", onWheel, { passive: false });
    frame = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
      stage.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      stage.removeEventListener("wheel", onWheel);
    };
  }, []);

  const enterStyle: CSSProperties = {
    opacity: inView ? 1 : 0,
    transform: inView ? "none" : `translate3d(0, ${ENTER_OFFSET_Y}px, 0)`,
    transition: `opacity ${Math.round(ENTER_MS * 0.8)}ms cubic-bezier(.22,1,.36,1), transform ${ENTER_MS}ms cubic-bezier(.22,1,.36,1)`,
  };

  return (
    <section ref={sectionRef} id="overview" className="overflow-hidden bg-white py-16 text-[#1a1a1a]">
      <div
        ref={stageRef}
        className="relative mx-auto h-[min(90vh,820px)] w-full cursor-grab select-none touch-pan-y"
        style={{ perspective: `${PERSPECTIVE}px`, ...enterStyle }}
      >
        {/* Quả cầu lưới ở giữa */}
        <div
          className="absolute left-1/2 top-1/2"
          style={{ transform: "translate(-50%, -50%)", zIndex: 500 }}
        >
          <WireGlobe spinRef={spinRef} size={PLANET_PX} />
        </div>

        {/* Bốn thẻ điểm chạy quanh quả cầu */}
        {EXAMS.map((exam, i) => (
          <div
            key={`${exam.date}-${i}`}
            ref={(el) => {
              cardRefs.current[i] = el;
            }}
            className="absolute left-1/2 top-1/2 w-[min(320px,80vw)]"
            style={{ willChange: "transform, opacity" }}
          >
            <ExamCard exam={exam} />
          </div>
        ))}
      </div>
    </section>
  );
}
