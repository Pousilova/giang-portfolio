"use client";

import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";

type Skill = { name: string; score: string; highlight?: boolean };
type Exam = {
  date: string;
  place: string;
  overall: string;
  skills: Skill[];
  latest?: boolean;
};

// Màu cho tên địa điểm thi (thêm địa điểm mới vào đây nếu cần)
const PLACE_COLORS: Record<string, string> = {
  IDP: "text-[#d62828]",
  "British Council": "text-[#1d4ed8]",
};

// Dữ liệu 4 lần thi (thẻ đầu tiên là lần gần nhất, sẽ nằm ở giữa)
// highlight: true để tô đỏ điểm của kỹ năng đó
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

const GAP = 24; // khoảng cách giữa các thẻ (px)
const SPACING = 1.0; // khoảng cách carousel đi theo tỉ lệ: 1.0 = 100%, 0.95 = 95%
const DRAG_SENSITIVITY = 2.5; // kéo chuột: số lần lớn hơn = chỉ cần kéo ngắn đã chuyển thẻ (1 = bình thường)
const WHEEL_SENSITIVITY = 2.0; // lăn chuột ngang: tương tự như trên (1 = bình thường)
const DRAG_RESPONSE = 1.5; // độ bám khi đang kéo (càng lớn càng sát tay)
const SNAP_RESPONSE = 3; // độ êm khi thẻ tự trượt về vị trí (càng nhỏ càng chậm và êm)
const WHEEL_SETTLE_MS = 160; // sau khi ngừng lăn ngang, thẻ tự căn vào giữa
const SIDE_FADE = 0.15; // độ mờ của thẻ hai bên (0 = không mờ, 1 = mờ hết)
const SIDE_BLUR = 3; // độ nhòe tối đa của thẻ hai bên (px)
const SIDE_SCALE = 0.86; // thẻ hai bên nhỏ hơn một chút
const YAW_DEG = -10; // góc xoay tối đa của thẻ hai bên (độ)
const PERSPECTIVE = 900; // độ sâu phối cảnh (px)

// Đưa khoảng cách về khoảng ngắn nhất trên vòng tròn, trong (-n/2, n/2]
const wrapDistance = (d: number, n: number) => {
  let x = ((d % n) + n) % n;
  if (x > n / 2) x -= n;
  return x;
};

function ExamCard({ exam }: { exam: Exam }) {
  const placeColor = PLACE_COLORS[exam.place] ?? "text-[#1a1a1a]";

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-[#1a1a1a]/15 bg-white shadow-[0_20px_60px_-25px_rgba(0,0,0,0.15)]">
      {/* Đầu thẻ: điểm tổng bên trái, ngày và nơi thi bên phải */}
      <div className="flex items-end justify-between gap-6 border-b border-[#1a1a1a]/10 px-6 pb-5 pt-6">
        <h3 className="text-2xl font-semibold text-[#d62828]">
          Overall {exam.overall}
        </h3>

        <div className="flex flex-col items-end gap-2 text-right">
          {exam.latest && (
            <span className="rounded-md bg-[#f7b52c] px-2.5 py-1 font-mono text-xs text-[#1a1a1a]">
              Gần nhất
            </span>
          )}
          <p className="font-mono text-sm text-[#6b6b6b]">
            {exam.date} ·{" "}
            <span className={`font-bold ${placeColor}`}>{exam.place}</span>
          </p>
        </div>
      </div>

      {/* Tiêu đề cột */}
      <div className="flex justify-between border-b border-[#1a1a1a]/10 px-6 py-3 font-mono text-[11px] uppercase tracking-[0.2em] text-[#6b6b6b]">
        <span>Skill</span>
        <span>Score</span>
      </div>

      {/* Các kỹ năng */}
      {exam.skills.map((skill) => (
        <div
          key={skill.name}
          className="flex items-center justify-between border-b border-[#1a1a1a]/10 px-6 py-5 last:border-b-0"
        >
          <span className="text-base">{skill.name}</span>
          <span
            className={`text-xl font-medium ${
              skill.highlight ? "text-[#d62828]" : "text-[#1a1a1a]"
            }`}
          >
            {skill.score}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function IeltsOverview() {
  const trackRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const cards = cardRefs.current;
    const n = EXAMS.length;

    let target = 0; // vị trí đích (đơn vị: số thẻ), 0 = thẻ đầu ở giữa
    let shown = 0; // vị trí đang hiển thị, bám theo target mượt mà
    let last = performance.now();
    let frame = 0;

    let dragging = false;
    let moved = false;
    let startX = 0;
    let startPos = 0;
    let wheelTimer = 0;

    // Khoảng cách 1 thẻ (px) trên màn hình, đã tính SPACING
    const getStep = () => ((cards[0]?.offsetWidth ?? 400) + GAP) * SPACING;

    const snapToNearest = () => {
      target = Math.round(target);
    };

    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      dragging = true;
      moved = false;
      startX = e.clientX;
      startPos = target;
      track.style.cursor = "grabbing";
    };

    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 5) moved = true;
      target = startPos - (dx * DRAG_SENSITIVITY) / getStep();
    };

    const onUp = () => {
      if (!dragging) return;
      dragging = false;
      track.style.cursor = "";
      snapToNearest();
    };

    // Chỉ bắt lăn NGANG (hoặc giữ Shift). Lăn dọc vẫn để trang cuộn bình thường.
    const onWheel = (e: WheelEvent) => {
      const horizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY) || e.shiftKey;
      if (!horizontal) return;
      e.preventDefault();
      e.stopPropagation();
      const delta = e.deltaX || e.deltaY;
      target += (delta * WHEEL_SENSITIVITY) / getStep();
      window.clearTimeout(wheelTimer);
      wheelTimer = window.setTimeout(snapToNearest, WHEEL_SETTLE_MS);
    };

    // Chặn click nhầm sau khi kéo; bấm vào thẻ hai bên sẽ đưa thẻ đó vào giữa
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
      }
    };

    const render = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      const k = dragging ? DRAG_RESPONSE : SNAP_RESPONSE;
      shown += (target - shown) * (1 - Math.exp(-k * dt));
      if (Math.abs(target - shown) < 0.0005) shown = target;

      cards.forEach((el, i) => {
        if (!el) return;
        const d = wrapDistance(i - shown, n);
        const a = Math.min(Math.abs(d), 1); // 0 ở giữa, 1 ở hai bên
        const scale = SIDE_SCALE + (1 - SIDE_SCALE) * (1 - a);
        const opacity = 1 - SIDE_FADE * a;
        const blur = a * SIDE_BLUR;
        const yaw = -Math.max(-1, Math.min(1, d)) * YAW_DEG;
        const visible = Math.abs(d) < 1.5;

        el.style.transform = `translate3d(calc(${d.toFixed(4)} * (var(--cw) + ${GAP}px) * ${SPACING}), 0, 0) rotateY(${yaw.toFixed(3)}deg) scale(${scale.toFixed(4)})`;
        el.style.opacity = visible ? opacity.toFixed(4) : "0";
        el.style.filter = blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : "none";
        el.style.pointerEvents = visible ? "auto" : "none";
        el.style.zIndex = String(Math.round(100 - a * 50));
      });

      frame = requestAnimationFrame(render);
    };

    track.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    track.addEventListener("wheel", onWheel, { passive: false });
    track.addEventListener("click", onClick, true);
    frame = requestAnimationFrame(render);

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
    <section id="overview" className="overflow-hidden bg-white py-16 text-[#1a1a1a]">
      {/* Các thẻ nằm chồng trong cùng một ô lưới, nên khung tự cao theo thẻ */}
      <div
        ref={trackRef}
        className="mx-auto grid w-full cursor-grab select-none place-items-center"
        style={
          {
            "--cw": "min(560px, 85vw)",
            perspective: `${PERSPECTIVE}px`,
          } as CSSProperties
        }
      >
        {EXAMS.map((exam, i) => (
          <div
            key={`${exam.date}-${i}`}
            data-idx={i}
            ref={(el) => {
              cardRefs.current[i] = el;
            }}
            className="will-change-transform"
            style={{
              gridArea: "1 / 1",
              width: "var(--cw)",
              transformOrigin: "center center",
            }}
          >
            <ExamCard exam={exam} />
          </div>
        ))}
      </div>
    </section>
  );
}