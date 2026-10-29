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

// Quỹ đạo: bán kính ngang và bán kính sâu (px). Mặt quỹ đạo nằm trong mặt phẳng vòng hành tinh
const ORBIT_RX = 200;
const ORBIT_RZ = 130;
const PLANE_TILT = 0.35; // phải khớp với TILT trong WireGlobe.tsx
const PERSPECTIVE = 2000;
const BACK_OPACITY = 0.3; // thẻ ở phía sau mờ tới mức này
const CARD_CURVE = 0.6; // mặt thẻ xoay theo góc quỹ đạo: 1 = ôm sát hành tinh, 0 = phẳng
const CARD_MAX_TILT = 1.3; // giới hạn góc xoay (rad, ~75°) để thẻ không bị lật ra mặt sau
const FRAME_FPS = 24; // tốc độ cập nhật chuyển động, giảm để tiết kiệm CPU
const FRAME_MS = 1000 / FRAME_FPS;

// Kích thước thiết kế của cụm (px). Khi fit, cụm được co giãn vừa khung cha
const DESIGN_SIZE = 448; // 560 / 1.25: cụm to hơn 25% so với cùng một khung
const PLANET_PX = 720; // khung canvas chứa quả cầu, vòng hành tinh và ảnh nền
// Thứ tự lớp: thẻ phía sau < canvas hành tinh (500) < thẻ phía trước
const BACK_CARD_LAYER = 400;
const FRONT_CARD_LAYER = 510;
const CARD_W = 112; // kích thước một thẻ (px), dùng để căn giữa thẻ quanh tâm quỹ đạo
const CARD_H = 144;
const CARD_SCALE = 1.2; // thẻ to thêm 20%, giữ nguyên tâm

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
    <div className="w-full overflow-hidden rounded-2xl border border-[#1a1a1a]/15 bg-white/80 shadow-[0_12px_30px_-18px_rgba(0,0,0,0.15)]">
      <div className="flex items-end justify-between gap-2 border-b border-[#1a1a1a]/10 px-2 pb-1.5 pt-2">
        <h3 className="text-[8.5px] font-semibold text-[#d62828]">Overall {exam.overall}</h3>

        <div className="flex flex-col items-end gap-0.5 text-right">
          {exam.latest && (
            <span className="rounded-sm bg-[#f7b52c] px-1 py-px font-mono text-[4.5px] text-[#1a1a1a]">Gần nhất</span>
          )}
          <p className="font-mono text-[5px] text-[#6b6b6b]">
            {exam.date} · <span className={`font-bold ${placeColor}`}>{exam.place}</span>
          </p>
        </div>
      </div>

      <div className="flex justify-between border-b border-[#1a1a1a]/10 px-2 py-1 font-mono text-[4px] uppercase tracking-[0.2em] text-[#6b6b6b]">
        <span>Skill</span>
        <span>Score</span>
      </div>

      {exam.skills.map((skill) => (
        <div
          key={skill.name}
          className="flex items-center justify-between border-b border-[#1a1a1a]/10 px-2 py-1.5 last:border-b-0"
        >
          <span className="text-[5.5px]">{skill.name}</span>
          <span className={`text-[7px] font-medium ${skill.highlight ? "text-[#d62828]" : "text-[#1a1a1a]"}`}>
            {skill.score}
          </span>
        </div>
      ))}
    </div>
  );
}

// fit: co giãn cụm vừa khung cha (dùng trong minh họa). reveal: bật hiệu ứng trồi lên khi vào màn hình
export default function ScoreOrbit({
  fit = false,
  reveal = true,
  backdropSrc,
  showPlanet = true,
}: {
  fit?: boolean;
  reveal?: boolean;
  backdropSrc?: string; // ảnh đặt ở giữa, phía sau các vòng
  showPlanet?: boolean; // false: ẩn hành tinh, chỉ giữ vòng
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const spinRef = useRef(0); // góc quay hiện tại, quả cầu đọc giá trị này

  const [scale, setScale] = useState(1);
  const [inView, setInView] = useState(!reveal);

  // Đang hiện trên màn hình hay không; ra ngoài thì ngừng vẽ để tiết kiệm CPU/GPU
  const [onScreen, setOnScreen] = useState(true);
  const onScreenRef = useRef(true);

  // Co giãn theo khung cha khi ở chế độ fit
  useEffect(() => {
    const root = rootRef.current;
    if (!fit || !root) return;

    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setScale(Math.min(width, height) / DESIGN_SIZE);
    });
    ro.observe(root);
    return () => ro.disconnect();
  }, [fit]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !("IntersectionObserver" in window)) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        onScreenRef.current = entry.isIntersecting;
        setOnScreen(entry.isIntersecting);
      },
      { threshold: 0 }
    );
    io.observe(root);
    return () => io.disconnect();
  }, []);

  // Khi đi vào khung nhìn thì bật hiệu ứng xuất hiện một lần duy nhất
  useEffect(() => {
    const root = rootRef.current;
    if (!root || !reveal) return;

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
    io.observe(root);
    return () => io.disconnect();
  }, [reveal]);

  // Quỹ đạo 3D: quả cầu ở giữa, các thẻ chạy quanh theo vòng tròn
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const cards = cardRefs.current;

    let angle = 0; // góc của thẻ đầu tiên (thẻ gần nhất), tăng = quay sang phải
    let vel = AUTO_SPEED; // rad/s
    let dragging = false;
    let startX = 0;
    let startAngle = 0;
    let lastX = 0;
    let lastT = 0;
    let last = performance.now();
    let frame = 0;

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
      frame = requestAnimationFrame(render);

      // Giới hạn tốc độ vẽ ở FRAME_FPS để tiết kiệm CPU
      if (now - last < FRAME_MS) return;

      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      // Ngoài màn hình thì bỏ qua việc cập nhật vị trí
      if (!onScreenRef.current) return;

      // Khi không kéo: vận tốc dần về tốc độ tự quay sang phải
      if (!dragging) {
        vel += (AUTO_SPEED - vel) * (1 - Math.exp(-RESUME_LERP * dt));
        angle += vel * dt;
      }
      angle %= TAU;

      cards.forEach((el, i) => {
        if (!el) return;
        const th = angle + i * STEP;
        // Vị trí trong mặt phẳng quỹ đạo (x, z), rồi nghiêng theo mặt phẳng vòng hành tinh
        const x = ORBIT_RX * Math.sin(th);
        const planeZ = ORBIT_RZ * Math.cos(th);
        const y = planeZ * Math.sin(PLANE_TILT);
        const z = planeZ * Math.cos(PLANE_TILT);
        const depth = (planeZ + ORBIT_RZ) / (2 * ORBIT_RZ); // 0 phía sau, 1 phía trước
        // Đưa góc về khoảng (-π, π] rồi kẹp lại, để thẻ phía sau không bị quay quá 90°
        const wrapped = ((((th + Math.PI) % TAU) + TAU) % TAU) - Math.PI;
        const tilt = Math.max(-CARD_MAX_TILT, Math.min(CARD_MAX_TILT, wrapped * CARD_CURVE));
        el.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, ${z.toFixed(2)}px) rotateY(${tilt.toFixed(4)}rad)`;
        el.style.opacity = (BACK_OPACITY + (1 - BACK_OPACITY) * depth).toFixed(3);
        // Thẻ phía sau nằm dưới ảnh nền, thẻ phía trước nằm trên hành tinh
        el.style.zIndex = String(z < 0 ? BACK_CARD_LAYER + Math.round(z) : FRONT_CARD_LAYER + Math.round(z));
      });

      spinRef.current = angle;
    };

    stage.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    stage.addEventListener("wheel", onWheel, { passive: false });
    frame = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(frame);
      stage.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      stage.removeEventListener("wheel", onWheel);
    };
  }, []);

  const enterStyle: CSSProperties = reveal
    ? {
        opacity: inView ? 1 : 0,
        transform: inView ? "none" : `translate3d(0, ${ENTER_OFFSET_Y}px, 0)`,
        transition: `opacity ${Math.round(ENTER_MS * 0.8)}ms cubic-bezier(.22,1,.36,1), transform ${ENTER_MS}ms cubic-bezier(.22,1,.36,1)`,
      }
    : {};

  // Khung đặt cụm: fit thì căn giữa và co theo tỉ lệ, không thì lấp đầy khung cha
  const frameStyle: CSSProperties = fit
    ? {
        position: "absolute",
        left: "50%",
        top: "50%",
        width: DESIGN_SIZE,
        height: DESIGN_SIZE,
        transform: `translate(-50%, -50%) scale(${scale})`,
      }
    : { position: "absolute", inset: 0 };

  return (
    <div ref={rootRef} className="relative h-full w-full">
      <div style={frameStyle}>
        <div
          ref={stageRef}
          className="relative h-full w-full cursor-grab select-none touch-pan-y"
          style={{ perspective: `${PERSPECTIVE}px`, ...enterStyle }}
        >
          {/* Quả cầu lưới ở giữa */}
          <div
            className="pointer-events-none absolute left-1/2 top-1/2"
            style={{ width: PLANET_PX, height: PLANET_PX, marginLeft: -PLANET_PX / 2, marginTop: -PLANET_PX / 2, zIndex: 500 }}
          >
            <WireGlobe
              spinRef={spinRef}
              size={PLANET_PX}
              active={onScreen}
              backdropSrc={backdropSrc}
              showPlanet={showPlanet}
            />
          </div>

          {/* Bốn thẻ điểm chạy quanh quả cầu */}
          {EXAMS.map((exam, i) => (
            <div
              key={`${exam.date}-${i}`}
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              className="absolute left-1/2 top-1/2"
              style={{
                width: CARD_W,
                marginLeft: -CARD_W / 2,
                marginTop: -CARD_H / 2,
                willChange: "transform, opacity",
                backfaceVisibility: "hidden",
              }}
            >
              <div style={{ transform: `scale(${CARD_SCALE})` }}>
                <ExamCard exam={exam} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
