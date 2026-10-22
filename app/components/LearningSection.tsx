"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, PointerEvent } from "react";
import ScrollBee from "./ScrollBee";

// ===== Cấu hình =====
type Crit = "FC" | "LR" | "GRA" | "PRON";
type Ease = "easy" | "hard";

// Kích thước thẻ trên desktop (vw) và trên mobile (px)
const CARD_VW = 9.8;
const STEP_VW = 11.9;
// Trên mobile hiển thị khoảng 3 thẻ trên một hàng
const CARD_PX = 112;
const STEP_PX = 124;
const MOBILE_BP = 768;
const EDGE_WIDTH = "8vw";
// Chiều cao ước lượng của thẻ trên mobile (theo nội dung) và chiều cao khung chứa hai hàng
const MOBILE_CARD_H = 140;
const MOBILE_HEIGHT = 320;

// Hai hàng ngang chồng lên nhau: hàng trên đi về một phía, hàng dưới đi ngược lại.
// ROW_GAP là khoảng cách từ tâm màn hình đến tâm mỗi hàng, tính theo tỉ lệ chiều cao khung.
const ROW_GAP = 0.2;
const DEG = Math.PI / 180;

// Độ mượt: vị trí hiển thị đuổi theo vị trí đích, khi đang kéo thì bám nhanh, khi thả tay thì trôi chậm lại
const DRAG_FOLLOW = 14;
const GLIDE = 4;
const SETTLE_PX = 0.05;

// Section được ghim trong một khoảng cuộn dài để người dùng thấy trọn phần chữ và hai hàng thẻ
const PIN_HEIGHT_VH = 200;

// Hiệu ứng xuất hiện, giống section IELTS: thẻ trồi lên lần lượt
const ENTER_MS = 1100;
const ENTER_OFFSET_Y = 40;
const ENTER_STAGGER_MS = 60;

// Khoảng cách giữa các thẻ lệch nhau một chút (tỉ lệ so với bước chuẩn)
const GAP_JITTER = Array.from({ length: 14 }, () => 0);

// Kiểu dây nối giữa các thẻ, lặp lại theo thứ tự
const LINK_STYLES = [
  { color: "#d62828", width: 1.2 },
  { color: "#7fb3d5", dash: "2 5", width: 1.6 },
  { color: "#1a1a1a", dash: "10 6", width: 1 },
  { color: "#f7b52c", dash: "18 6 3 6", width: 1.6 },
  { color: "#d62828", dash: "5 5", width: 1.2 },
  { color: "#7fb3d5", width: 1 },
  { color: "#1a1a1a", dash: "1 6", width: 1.6 },
];

const EASE_LABEL: Record<Ease, string> = {
  easy: "Dễ dùng",
  hard: "Khó dùng",
};

const LEVELS = ["Basic", "Intermediate", "Upper-Intermediate", "Advanced"];
const LEVEL_TINT = [
  { bg: "#d6f5e3", fg: "#1a1a1a" },
  { bg: "#fdf5b5", fg: "#1a1a1a" },
  { bg: "#cdeefc", fg: "#1a1a1a" },
  { bg: "#fde0d4", fg: "#1a1a1a" },
];

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

type Card = {
  level: number;
  crit: Crit;
  title: string;
  body: string;
  ease: Ease;
};

const CRIT_ORDER: Crit[] = ["FC", "LR", "GRA", "PRON"];

// Dữ liệu gốc, được sắp xếp lại bên dưới theo tiêu chí rồi theo cấp độ
const RAW_CARDS: Card[] = [
  { level: 0, crit: "FC", title: "Tốc độ nói", body: "Nói đủ nhanh để tự nhiên, nhưng người nghe vẫn theo kịp.", ease: "easy" },
  { level: 0, crit: "PRON", title: "Phát âm rõ", body: "Phát âm từng âm rõ ràng, người nghe không phải đoán ý.", ease: "easy" },
  { level: 0, crit: "LR", title: "Từ vựng theo chủ đề", body: "Dùng từ vựng bám sát chủ đề đang được hỏi.", ease: "easy" },
  { level: 0, crit: "GRA", title: "Từ loại", body: "Dùng đúng danh từ, động từ, tính từ và trạng từ.", ease: "easy" },
  { level: 1, crit: "FC", title: "Ngắt nghỉ", body: "Giảm tiếng ờ, ừm và các khoảng lặng quá dài.", ease: "easy" },
  { level: 1, crit: "GRA", title: "Câu đơn và câu phức", body: "Kết hợp câu đơn và câu phức để ý nối tiếp mạch lạc.", ease: "easy" },
  { level: 1, crit: "LR", title: "Đúng nghĩa", body: "Dùng đúng nghĩa và đúng ngữ cảnh của từng từ.", ease: "hard" },
  { level: 1, crit: "PRON", title: "Ngữ điệu", body: "Lên xuống giọng để nhấn đúng ý quan trọng.", ease: "hard" },
  { level: 0, crit: "GRA", title: "Mạo từ", body: "Dùng đúng a, an, the trước danh từ.", ease: "easy" },
  { level: 0, crit: "GRA", title: "Số ít và số nhiều", body: "Phân biệt đúng danh từ số ít và số nhiều.", ease: "easy" },
  { level: 1, crit: "LR", title: "Collocations", body: "Ghép từ theo cách người bản xứ thường nói.", ease: "hard" },
  { level: 1, crit: "FC", title: "Tránh lặp lại", body: "Tránh lặp lại cùng một ý hoặc cùng một từ.", ease: "easy" },
  { level: 1, crit: "FC", title: "Độ dài câu trả lời", body: "Trả lời đủ dài để triển khai ý, không cụt lủn.", ease: "easy" },
  { level: 1, crit: "LR", title: "Cụm động từ", body: "Dùng cụm động từ như look up, give up, carry on.", ease: "hard" },
  { level: 1, crit: "GRA", title: "Đa dạng thì", body: "Đổi linh hoạt giữa các thì khi kể chuyện và so sánh.", ease: "hard" },
  { level: 1, crit: "PRON", title: "Âm cuối", body: "Phát âm rõ -s, -es, -ed và các phụ âm cuối.", ease: "easy" },
  { level: 2, crit: "FC", title: "Đúng trọng tâm", body: "Trả lời đúng trọng tâm câu hỏi, không lạc đề.", ease: "easy" },
  { level: 2, crit: "FC", title: "Triển khai ý", body: "Nêu lý do, ví dụ, rồi kết luận ngắn gọn.", ease: "easy" },
  { level: 2, crit: "FC", title: "Từ nối", body: "Dùng từ nối như however, moreover, as a result.", ease: "easy" },
  { level: 2, crit: "LR", title: "Paraphrase", body: "Diễn đạt lại ý bằng từ khác, không lặp từ khóa.", ease: "hard" },
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

// Sắp theo tiêu chí (FC, LR, GRA, Pronunciation), trong mỗi tiêu chí sắp từ Basic đến Advanced
const CARDS: Card[] = [...RAW_CARDS].sort(
  (a, b) => CRIT_ORDER.indexOf(a.crit) - CRIT_ORDER.indexOf(b.crit) || a.level - b.level
);

const N = CARDS.length;

// Đưa giá trị về khoảng [0, period), kể cả khi âm
const wrap = (value: number, period: number) => ((value % period) + period) % period;

type Placed = { cx: number; cy: number; deg: number };

// Tính vị trí các thẻ trên một sợi dây khép kín.
// Hàng trên chạy từ trái sang phải (thẻ 1 -> 15), quặt xuống rồi hàng dưới chạy ngược lại (16 -> 29),
// và thẻ 29 nối lại với thẻ 1 ở mép trái ngoài khung nhìn.
function layoutBelt(offset: number, W: number, H: number, mobile: boolean) {
  const cw = mobile ? CARD_PX : (CARD_VW * W) / 100;
  const step = mobile ? STEP_PX : (STEP_VW * W) / 100;
  const base: number[] = [];
  let total = 0;
  for (let k = 0; k < N; k++) {
    base.push(total);
    total += step * (1 + GAP_JITTER[k % GAP_JITTER.length]);
  }
  const half = total / 2;
  const x0 = (W - half) / 2;
  const py = H / 2;
  // Trên mobile, hai hàng cách nhau đúng bằng nửa chiều cao thẻ để chúng chồng nhẹ lên nhau
  const rowDy = mobile ? MOBILE_CARD_H / 2 + 10 : ROW_GAP * H;

  const placed: Placed[] = CARDS.map((_, k) => {
    const u = wrap(base[k] - offset, total);
    const top = u < half;
    const xc = top ? x0 + u + cw / 2 : x0 + total - u - cw / 2;
    return {
      cx: xc,
      cy: top ? py - rowDy : py + rowDy,
      deg: 0,
    };
  });
  return { placed, cw, total, x0 };
}

export default function LearningSection() {
  const viewRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const linkRefs = useRef<(SVGPathElement | null)[]>([]);
  const dotRefs = useRef<(SVGCircleElement | null)[]>([]);
  // Quãng đã kéo, đơn vị px, không giới hạn
  const offset = useRef(0);
  // Vị trí đích do người dùng kéo hoặc lăn tới; offset sẽ đuổi theo giá trị này bằng rAF
  const target = useRef(0);
  const frame = useRef(0);
  const beeRef = useRef<HTMLDivElement>(null);
  const last = useRef(0);
  const drag = useRef({ on: false, x: 0 });
  const [mobile, setMobile] = useState(false);
  const [inView, setInView] = useState(false);

  const apply = () => {
    const view = viewRef.current;
    if (!view) return;
    const W = view.clientWidth;
    const H = view.clientHeight;
    const isMobile = window.innerWidth < MOBILE_BP;
    const { placed, cw } = layoutBelt(offset.current, W, H, isMobile);
    placed.forEach((p, k) => {
      const node = cardRefs.current[k];
      if (!node) return;
      node.style.width = `${cw}px`;
      node.style.left = `${p.cx - cw / 2}px`;
      node.style.top = `${p.cy}px`;
      node.style.transform = `translateY(-50%) rotate(${p.deg}deg)`;
    });

    // Dây nối từng cặp thẻ liền kề trên sợi dây, kể cả chỗ nối hai hàng và mối khép vòng
    const half = cw / 2;
    for (let k = 0; k < N; k++) {
      const a = placed[k];
      const b = placed[(k + 1) % N];
      const path = linkRefs.current[k];
      const ra = a.deg * DEG;
      const rb = b.deg * DEG;
      const ax = half * Math.cos(ra);
      const ay = half * Math.sin(ra);
      const bx = half * Math.cos(rb);
      const by = half * Math.sin(rb);
      const forward = b.cx >= a.cx;
      const x1 = forward ? a.cx + ax : a.cx - ax;
      const y1 = forward ? a.cy + ay : a.cy - ay;
      const x2 = forward ? b.cx - bx : b.cx + bx;
      const y2 = forward ? b.cy - by : b.cy + by;
      const dx = Math.max(24, (x2 - x1) * 0.5);
      path?.setAttribute("d", `M${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`);
      dotRefs.current[k * 2]?.setAttribute("cx", String(x1));
      dotRefs.current[k * 2]?.setAttribute("cy", String(y1));
      dotRefs.current[k * 2 + 1]?.setAttribute("cx", String(x2));
      dotRefs.current[k * 2 + 1]?.setAttribute("cy", String(y2));
    }

  };

  useEffect(() => {
    const media = window.matchMedia(`(max-width: ${MOBILE_BP - 1}px)`);
    // Khi mở trang, đặt thẻ Basic đầu tiên ngay mép trái của hàng trên
    const view = viewRef.current;
    if (view) {
      const { x0 } = layoutBelt(0, view.clientWidth, view.clientHeight, window.innerWidth < MOBILE_BP);
      offset.current = x0;
      target.current = x0;
    }
    const onChange = () => {
      setMobile(media.matches);
      apply();
    };
    const onResize = () => apply();
    onChange();
    media.addEventListener("change", onChange);
    window.addEventListener("resize", onResize);
    return () => {
      media.removeEventListener("change", onChange);
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(frame.current);
      frame.current = 0;
    };
  }, []);

  // Con ong chỉ tiến độ đi qua section: theo vị trí cuộn trong khoảng ghim
  useEffect(() => {
    const update = () => {
      const sec = document.getElementById("learning");
      const bee = beeRef.current;
      if (!sec || !bee) return;
      const range = sec.offsetHeight - window.innerHeight;
      const p = Math.min(1, Math.max(0, -sec.getBoundingClientRect().top / range));
      bee.style.offsetDistance = `${p * 100}%`;
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  // Khi lướt xuống và đỉnh section đang trồi lên từ phía dưới, kéo section vào đúng vị trí ghim.
  // Đợi quán tính cuộn gần dừng rồi mới kéo, để chuyển động không bị giật.
  useEffect(() => {
    let lastY = window.scrollY;
    let timer = 0;
    const lenisRef = () =>
      (window as unknown as { __lenis?: { stop: () => void; start: () => void } }).__lenis;
    const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);
    // Tự tween vị trí cuộn bằng rAF, tạm dừng Lenis trong lúc kéo để hai bên không tranh nhau
    const snap = () => {
      const sec = document.getElementById("learning");
      if (!sec) return;
      const top = sec.getBoundingClientRect().top;
      if (top <= 0 || top > window.innerHeight * 0.8) return;
      const from = window.scrollY;
      const dist = top;
      const start = performance.now();
      const lenis = lenisRef();
      lenis?.stop();
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / 900);
        window.scrollTo(0, from + dist * easeOutQuart(t));
        if (t < 1) requestAnimationFrame(step);
        else lenis?.start();
      };
      requestAnimationFrame(step);
    };
    const onScroll = () => {
      const y = window.scrollY;
      const down = y > lastY;
      lastY = y;
      window.clearTimeout(timer);
      if (!down) return;
      timer = window.setTimeout(snap, 90);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  // Khi chế độ mobile đổi, chiều cao khung đã cập nhật xong sau khi render, nên tính lại vị trí thẻ
  useEffect(() => {
    apply();
  }, [mobile]);

  // Chỉ bật hiệu ứng xuất hiện một lần, khi section đi vào khung nhìn
  useEffect(() => {
    const section = document.getElementById("learning");
    if (!section) return;
    if (!("IntersectionObserver" in window)) {
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

  // Vòng lặp rAF: đưa offset về target một cách mượt, chỉ chạy khi còn đang trôi hoặc đang kéo
  const tick = (now: number) => {
    const dt = Math.min((now - last.current) / 1000, 0.05);
    last.current = now;
    // Vị trí đích chỉ do người dùng kéo quyết định, cuộn trang không làm thẻ chạy
    const goal = target.current;
    const k = drag.current.on ? DRAG_FOLLOW : GLIDE;
    offset.current += (goal - offset.current) * (1 - Math.exp(-k * dt));
    if (Math.abs(goal - offset.current) < SETTLE_PX) offset.current = goal;
    apply();
    const settled = !drag.current.on && offset.current === goal;
    frame.current = settled ? 0 : requestAnimationFrame(tick);
  };

  const kick = () => {
    if (!frame.current) {
      last.current = performance.now();
      frame.current = requestAnimationFrame(tick);
    }
  };

  // Một mối nối giữa thẻ k và thẻ k+1: đường cong cùng hai chấm đầu cuối
  // Dây hiện ra ngay sau thẻ đầu của nó, nên lần lượt theo các thẻ
  const linkStyle = (k: number): CSSProperties => ({
    opacity: inView ? 1 : 0,
    transition: `opacity 700ms ease ${(k + 1) * ENTER_STAGGER_MS + 300}ms`,
  });

  // Chữ bên trái trượt từ trái vào, chữ bên phải trượt từ phải vào
  const HIDDEN_SHIFT = { left: "translate3d(-32px, 0, 0)", right: "translate3d(32px, 0, 0)" };
  const revealStyle = (delay: number, from: "left" | "right" = "left"): CSSProperties => ({
    opacity: inView ? 1 : 0,
    transform: inView ? "none" : HIDDEN_SHIFT[from],
    transition: `opacity 800ms cubic-bezier(.22,1,.36,1) ${delay}ms, transform 900ms cubic-bezier(.22,1,.36,1) ${delay}ms`,
  });

  const renderLink = (k: number) => {
    const st = LINK_STYLES[k % LINK_STYLES.length];
    return (
      <g key={k} style={linkStyle(k)}>
        <path
          ref={(node) => {
            linkRefs.current[k] = node;
          }}
          fill="none"
          stroke={st.color}
          strokeWidth={st.width}
          strokeDasharray={st.dash}
          strokeLinecap="round"
        />
        <circle
          ref={(node) => {
            dotRefs.current[k * 2] = node;
          }}
          r="3"
          fill="#ffffff"
          stroke={st.color}
          strokeWidth="1.2"
        />
        <circle
          ref={(node) => {
            dotRefs.current[k * 2 + 1] = node;
          }}
          r="3"
          fill="#ffffff"
          stroke={st.color}
          strokeWidth="1.2"
        />
      </g>
    );
  };

  // Kéo ngang d px: sợi dây đi theo hướng kéo
  const moveBy = (dxPx: number) => {
    target.current -= dxPx;
    kick();
  };

  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    drag.current = { on: true, x: e.clientX };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d.on) return;
    const dx = e.clientX - d.x;
    d.x = e.clientX;
    moveBy(dx);
  };

  const onUp = () => {
    drag.current.on = false;
    kick();
  };


  return (
    <section id="learning" className="relative text-[#1a1a1a]" style={{ height: `${PIN_HEIGHT_VH}vh` }}>
      <div className="sticky top-0 flex h-screen flex-col overflow-hidden bg-white py-8 md:py-[4vh]">
      <div className="shrink-0 px-5 md:px-12">
        <h2
          className="font-serif text-[2rem] italic leading-[1.2] tracking-tight md:text-[2vw] md:leading-[1.3]"
          style={revealStyle(0)}
        >
          {HEADLINE}
        </h2>

        <div className="mt-6 grid grid-cols-1 gap-x-16 gap-y-6 md:mt-[3vh] md:grid-cols-2">
          <div>
            <p className="text-base font-medium leading-snug md:text-[0.95vw]" style={revealStyle(120)}>{LEFT_HEAD}</p>
            <p className="mt-2 text-sm leading-relaxed text-[#1a1a1a]/65 md:max-w-xl md:text-[0.85vw]" style={revealStyle(200)}>{LEFT_BODY}</p>
          </div>
          <div className="flex items-end md:justify-start" style={revealStyle(280, "right")}>
            <ScrollBee beeRef={beeRef} />
          </div>
        </div>
      </div>

      <div className="relative mt-4 min-h-0 md:mt-[1vh] md:flex-1" style={{ height: mobile ? MOBILE_HEIGHT : undefined }}>
        <div
          ref={viewRef}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          className="relative h-full w-full cursor-grab select-none overflow-hidden"
          style={{ touchAction: "pan-y" }}
        >
          {CARDS.map((cd, k) => {
            const tint = LEVEL_TINT[cd.level];
            const color = CRIT_COLOR[cd.crit];
            return (
              <div
                key={k}
                ref={(node) => {
                  cardRefs.current[k] = node;
                }}
                className="absolute left-0 top-0 z-10"
              >
                <div
                  className="flex flex-col rounded-xl border border-[#1a1a1a]/10 bg-white p-3 shadow-[0_12px_26px_-14px_rgba(0,0,0,0.3)] md:p-[1.1vw]"
                  style={{
                    opacity: inView ? 1 : 0,
                    transform: inView ? "none" : `translate3d(0, ${ENTER_OFFSET_Y}px, 0)`,
                    transition: `opacity ${Math.round(ENTER_MS * 0.8)}ms cubic-bezier(.22,1,.36,1) ${k * ENTER_STAGGER_MS}ms, transform ${ENTER_MS}ms cubic-bezier(.22,1,.36,1) ${k * ENTER_STAGGER_MS}ms`,
                    willChange: "transform, opacity",
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className="min-w-0 break-words rounded px-1 py-0.5 font-mono text-[7px] uppercase leading-tight tracking-[0.1em] md:px-1.5 md:text-[0.5vw] md:tracking-[0.2em]"
                      style={{ backgroundColor: tint.bg, color: tint.fg }}
                    >
                      {LEVELS[cd.level].toUpperCase()}
                    </span>
                    <span className="font-mono text-[8px] text-[#9a9a9a] md:text-[0.55vw]">
                      {String(k + 1).padStart(2, "0")}
                    </span>
                  </div>

                  <div className="mt-2 flex flex-col md:mt-[1.6vw]">
                    <h3 className="text-xs font-bold leading-snug md:text-[0.78vw]">{cd.title}</h3>
                    <p className="mt-1 text-[10px] leading-snug text-[#1a1a1a]/65 md:mt-[0.5vw] md:text-[0.7vw]">{cd.body}</p>
                  </div>

                  <p className="mt-2 font-mono text-[7px] uppercase tracking-[0.1em] text-[#9a9a9a] md:mt-[1vw] md:text-[0.5vw] md:tracking-[0.2em]">
                    <span className="font-bold" style={{ color }}>
                      {cd.crit}
                    </span>{" "}
                    · {EASE_LABEL[cd.ease]}
                  </p>
                </div>
              </div>
            );
          })}

          {/* Dây mắt xích nằm dưới các thẻ: chỗ giao nhau chỉ lộ ra ở khe hở giữa các thẻ, không chồng lên chữ */}
          {/* Dây mắt xích nằm dưới các thẻ, để chỗ giao nhau không chồng lên chữ */}
          <svg className="pointer-events-none absolute inset-0 z-[5] h-full w-full overflow-visible" aria-hidden="true">
            {Array.from({ length: N }, (_, k) => renderLink(k))}
          </svg>
        </div>

        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-40 bg-gradient-to-r from-white to-transparent"
          style={{ width: EDGE_WIDTH }}
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-40 bg-gradient-to-l from-white to-transparent"
          style={{ width: EDGE_WIDTH }}
        />
      </div>
      </div>
    </section>
  );
}
