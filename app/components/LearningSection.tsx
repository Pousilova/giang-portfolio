"use client";

import { useEffect, useRef, useState } from "react";
import type { PointerEvent } from "react";

// ===== Cấu hình =====
type Crit = "FC" | "LR" | "GRA" | "PRON";
type Ease = "easy" | "hard";

const CARD_W = 12; // chiều rộng mỗi tab (vw)
const STEP = 14.9; // khoảng cách giữa hai tab liền kề (vw)
const START = 50 - CARD_W / 2; // tab đầu tiên nằm giữa màn hình khi mở trang
const TICK_COUNT = 28;
const EDGE_FADE_START = 0.8; // tab cách tâm xa hơn 80% nửa khung nhìn bắt đầu mờ
const EDGE_MIN_OPACITY = 0.45; // độ rõ tối thiểu của tab ở rìa
const EDGE_WIDTH = "8vw"; // dải gradient che hai rìa màn hình
const Y_PATTERN = [0.18, 0.02, 0.3, 0.06, 0.22, 0.0, 0.26, 0.08]; // độ lệch dọc để các tab so le

const EASE_LABEL: Record<Ease, string> = {
  easy: "Dễ dùng",
  hard: "Khó dùng",
};

const LEVELS = ["Basic", "Intermediate", "Upper-Intermediate", "Advanced"];
const LEVEL_TINT = [
  { bg: "#d6f5e3", fg: "#1a1a1a" }, // Basic: xanh lá nhạt
  { bg: "#fdf5b5", fg: "#1a1a1a" }, // Intermediate: vàng nhạt
  { bg: "#cdeefc", fg: "#1a1a1a" }, // Upper-Intermediate: xanh dương nhạt
  { bg: "#fde0d4", fg: "#1a1a1a" }, // Advanced: đỏ nhạt
];

// Màu của từng tiêu chí: FC xanh dương, LR đỏ, GRA xanh lá, PRON tím
const CRIT_COLOR: Record<Crit, string> = {
  FC: "#2563eb",
  LR: "#d62828",
  GRA: "#16a34a",
  PRON: "#7c3aed",
};

// Nội dung
const HEADLINE = "iterating: learning, doing, learning.";
const LEFT_HEAD = "Bốn tiêu chí chấm Speaking";
const LEFT_BODY =
  "FC, LR, GRA và Pronunciation. Kéo các tab bên dưới để đi từ Basic đến Advanced, mỗi tab là một đặc điểm cụ thể.";
const RIGHT_HEAD = "Speaking, từ Basic tới Advanced";
const RIGHT_BODY =
  "Càng kéo về bên phải, đặc điểm càng nâng cao. Chỉ báo phía trên sẽ đổi theo vị trí bạn đang xem.";

type Card = {
  level: number; // index trong LEVELS
  crit: Crit;
  title: string;
  body: string; // mô tả ngắn, khoảng 10 từ
  ease: Ease; // mức độ dễ áp dụng, hiển thị ở chú thích dưới thẻ
};

// Tab theo đúng thứ tự tăng dần độ khó
const CARDS: Card[] = [
  // Basic
  { level: 0, crit: "FC", title: "Tốc độ nói", body: "Nói đủ nhanh để tự nhiên, nhưng người nghe vẫn theo kịp.", ease: "easy" },
  { level: 0, crit: "PRON", title: "Phát âm rõ", body: "Phát âm từng âm rõ ràng, người nghe không phải đoán ý.", ease: "easy" },
  { level: 0, crit: "LR", title: "Từ vựng theo chủ đề", body: "Dùng từ vựng bám sát chủ đề đang được hỏi.", ease: "easy" },
  { level: 0, crit: "GRA", title: "Từ loại", body: "Dùng đúng danh từ, động từ, tính từ và trạng từ.", ease: "easy" },

  // Intermediate
  { level: 1, crit: "FC", title: "Ngắt nghỉ", body: "Giảm tiếng ờ, ừm và các khoảng lặng quá dài.", ease: "easy" },
  { level: 1, crit: "GRA", title: "Câu đơn và câu phức", body: "Kết hợp câu đơn và câu phức để ý nối tiếp mạch lạc.", ease: "easy" },
  { level: 1, crit: "LR", title: "Đúng nghĩa", body: "Dùng đúng nghĩa và đúng ngữ cảnh của từng từ.", ease: "hard" },
  { level: 1, crit: "PRON", title: "Ngữ điệu", body: "Lên xuống giọng để nhấn đúng ý quan trọng.", ease: "hard" },
  { level: 1, crit: "GRA", title: "Mạo từ", body: "Dùng đúng a, an, the trước danh từ.", ease: "easy" },
  { level: 1, crit: "GRA", title: "Số ít và số nhiều", body: "Phân biệt đúng danh từ số ít và số nhiều.", ease: "easy" },
  { level: 1, crit: "LR", title: "Collocations", body: "Ghép từ theo cách người bản xứ thường nói.", ease: "hard" },
  { level: 1, crit: "FC", title: "Tránh lặp lại", body: "Tránh lặp lại cùng một ý hoặc cùng một từ.", ease: "easy" },
  { level: 1, crit: "FC", title: "Độ dài câu trả lời", body: "Trả lời đủ dài để triển khai ý, không cụt lủn.", ease: "easy" },
  { level: 1, crit: "LR", title: "Cụm động từ", body: "Dùng cụm động từ như look up, give up, carry on.", ease: "hard" },
  { level: 1, crit: "GRA", title: "Đa dạng thì", body: "Đổi linh hoạt giữa các thì khi kể chuyện và so sánh.", ease: "hard" },
  { level: 1, crit: "PRON", title: "Âm cuối", body: "Phát âm rõ -s, -es, -ed và các phụ âm cuối.", ease: "easy" },

  // Upper-Intermediate
  { level: 2, crit: "FC", title: "Đúng trọng tâm", body: "Trả lời đúng trọng tâm câu hỏi, không lạc đề.", ease: "easy" },
  { level: 2, crit: "FC", title: "Triển khai ý", body: "Nêu lý do, ví dụ, rồi kết luận ngắn gọn.", ease: "easy" },
  { level: 2, crit: "FC", title: "Từ nối", body: "Dùng từ nối như however, moreover, as a result.", ease: "easy" },
  { level: 2, crit: "LR", title: "Diễn đạt lại", body: "Diễn đạt lại ý bằng từ khác, không lặp từ khóa.", ease: "hard" },

  // Advanced
  { level: 3, crit: "LR", title: "Thành ngữ", body: "Dùng thành ngữ vừa đủ, đúng ngữ cảnh.", ease: "hard" },
  { level: 3, crit: "GRA", title: "So sánh", body: "So sánh hơn, so sánh nhất và so sánh ngang bằng.", ease: "easy" },
  { level: 3, crit: "GRA", title: "Câu bị động", body: "Dùng câu bị động để nhấn vào hành động.", ease: "easy" },
  { level: 3, crit: "GRA", title: "Câu điều kiện", body: "Dùng câu điều kiện để nói giả định và kết quả.", ease: "easy" },
  { level: 3, crit: "GRA", title: "Mệnh đề quan hệ", body: "Dùng mệnh đề quan hệ để bổ sung thông tin.", ease: "hard" },
  { level: 3, crit: "GRA", title: "Đảo ngữ", body: "Đảo ngữ để nhấn mạnh, tạo ấn tượng tự nhiên.", ease: "hard" },
  { level: 3, crit: "PRON", title: "Nối âm", body: "Nối âm cuối với âm đầu để câu nói liền mạch hơn.", ease: "hard" },
  { level: 3, crit: "PRON", title: "Nhóm từ", body: "Chia câu thành các cụm ý ngắn, mỗi cụm một nhịp.", ease: "hard" },
  { level: 3, crit: "PRON", title: "Trọng âm từ", body: "Nhấn đúng âm tiết của từ để người nghe dễ hiểu.", ease: "hard" },
];

const N = CARDS.length;
// Khoảng đệm 50vw ở cuối để tab cuối cũng kéo được về giữa màn hình
const TRACK_VW = START + (N - 1) * STEP + CARD_W + 50;
const xOf = (i: number) => START + i * STEP;
const yOf = (i: number) => Y_PATTERN[i % Y_PATTERN.length];

// Kiểu nét cho đường nối giữa các tab liền kề, lặp lại theo vòng
const LINK_STYLES = [
  { color: "#d62828", width: 1.2 },
  { color: "#7fb3d5", dash: "2 5", width: 1.6 },
  { color: "#1a1a1a", dash: "10 6", width: 1 },
  { color: "#f7b52c", dash: "18 6 3 6", width: 1.6 },
  { color: "#d62828", dash: "5 5", width: 1.2 },
  { color: "#7fb3d5", width: 1 },
  { color: "#1a1a1a", dash: "1 6", width: 1.6 },
];

const TICKS = Array.from({ length: TICK_COUNT }, (_, i) => (i % 9 === 0 ? 12 : i % 3 === 0 ? 8 : 4));

const clamp = (v: number, min = 0, max = 1) => Math.min(Math.max(v, min), max);

const pathFor = (i: number, j: number, vw: number, H: number, hA: number, hB: number) => {
  const x1 = (xOf(i) + CARD_W) * vw;
  const y1 = yOf(i) * H + hA / 2;
  const x2 = xOf(j) * vw;
  const y2 = yOf(j) * H + hB / 2;
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
  const [geo, setGeo] = useState({ vw: 12.8, h: 420, heights: [] as number[] });

  useEffect(() => {
    const el = viewRef.current;
    if (!el) return;

    let frame = 0;

    // Lăn NGANG (hoặc giữ Shift) xử lý tại đây; lăn DỌC đi lên để Lenis cuộn trang
    const onWheel = (e: WheelEvent) => {
      const horizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY) || e.shiftKey;
      if (horizontal) e.stopPropagation();
    };

    // Đồng bộ chỉ báo cấp độ và độ rõ của từng tab theo vị trí cuộn
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

      // Tâm khung nhìn tính bằng px, khoảng cách của mỗi tab so với tâm này
      const viewCenter = sl + cw / 2;
      const half = cw / 2;

      CARDS.forEach((_, i) => {
        const node = cardRefs.current[i];
        if (!node) return;
        const centerPx = (xOf(i) + CARD_W / 2) * vw;
        const dist = clamp(Math.abs(centerPx - viewCenter) / half);
        const t = clamp((dist - EDGE_FADE_START) / (1 - EDGE_FADE_START));
        node.style.opacity = String(1 - (1 - EDGE_MIN_OPACITY) * t);
      });
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(sync);
    };

    const measure = () => {
      setGeo({
        vw: window.innerWidth / 100,
        h: el.clientHeight,
        heights: cardRefs.current.map((n) => n?.offsetHeight ?? 0),
      });
    };

    const onResize = () => {
      measure();
      sync();
    };

    measure();
    sync();
    const ro = new ResizeObserver(onResize);
    ro.observe(el);
    window.addEventListener("resize", onResize);
    el.addEventListener("scroll", onScroll, { passive: true });
    el.addEventListener("wheel", onWheel, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      ro.disconnect();
      window.removeEventListener("resize", onResize);
      el.removeEventListener("scroll", onScroll);
      el.removeEventListener("wheel", onWheel);
    };
  }, []);

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
    <section id="learning" className="flex h-screen flex-col overflow-hidden bg-white py-[5vh] text-[#1a1a1a]">
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
              width={TRACK_VW * geo.vw}
              height={geo.h}
              viewBox={`0 0 ${TRACK_VW * geo.vw} ${geo.h}`}
              aria-hidden="true"
            >
              {CARDS.slice(1).map((_, i) => {
                const st = LINK_STYLES[i % LINK_STYLES.length];
                const p = pathFor(i, i + 1, geo.vw, geo.h, geo.heights[i] ?? 0, geo.heights[i + 1] ?? 0);
                return (
                  <g key={i}>
                    <path
                      d={p.d}
                      fill="none"
                      stroke={st.color}
                      strokeWidth={st.width}
                      strokeDasharray={st.dash}
                      strokeLinecap="round"
                    />
                    <circle cx={p.x1} cy={p.y1} r="3" fill="#ffffff" stroke={st.color} strokeWidth="1.2" />
                    <circle cx={p.x2} cy={p.y2} r="3" fill="#ffffff" stroke={st.color} strokeWidth="1.2" />
                  </g>
                );
              })}
            </svg>

            {CARDS.map((c, i) => {
              const tint = LEVEL_TINT[c.level];
              const color = CRIT_COLOR[c.crit];
              return (
                <div
                  key={i}
                  ref={(node) => {
                    cardRefs.current[i] = node;
                  }}
                  className="absolute"
                  style={{
                    left: `${xOf(i)}vw`,
                    top: `${yOf(i) * 100}%`,
                    width: `${CARD_W}vw`,
                  }}
                >
                  <div className="flex flex-col rounded-xl border border-[#1a1a1a]/10 bg-white p-[1.1vw] shadow-[0_10px_24px_-16px_rgba(0,0,0,0.25)]">
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className="rounded px-1.5 py-0.5 font-mono text-[0.6vw] uppercase tracking-[0.2em]"
                        style={{ backgroundColor: tint.bg, color: tint.fg }}
                      >
                        {LEVELS[c.level].toUpperCase()}
                      </span>
                      <span className="font-mono text-[0.7vw] text-[#9a9a9a]">{String(i + 1).padStart(2, "0")}</span>
                    </div>

                    <div className="mt-[1.6vw] flex min-h-[7vw] flex-col">
                      <h3 className="text-[0.95vw] font-bold leading-snug tracking-[0em]">{c.title}</h3>
                      <p className="mt-[0.6vw] text-[0.85vw] leading-snug text-[#1a1a1a]/65">{c.body}</p>
                    </div>

                    <p className="mt-[1.2vw] font-mono text-[0.6vw] uppercase tracking-[0.2em] text-[#9a9a9a]">
                      <span className="font-bold" style={{ color }}>
                        {c.crit}
                      </span>{" "}
                      · {EASE_LABEL[c.ease]}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

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