"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import ScrollBee from "./ScrollBee";
import ScoreOrbit from "./ScoreOrbit";

// ===== Nội dung các mục story (thay bằng nội dung thật) =====
const STEPS = [
  {
    label: "Nói theo bản năng",
    body:
      "Lời khuyên \"cứ nói tự nhiên như là đang nói chuyện với một người bạn\" - IELTS Advantage, là lời khuyên gây lú nhất mình từng biết. Bản thân mình trong tiếng việt cũng nói chuyện với bạn bè một cách tùy hứng là chủ yếu, vì niềm tin vào một thứ bản thân mình không hiểu mà mình không hề chuẩn bị gì trong hai lần thi IELTS Speaking đầu tiên, hệ quả là lụm hai con 6.5 cùi mía. Đây là từ một người có background từ vựng ngữ pháp tương đối ổn ở thời điểm đó. Việc cặp vào nách một vài chiến lược và nắm rõ các tiêu chí chấm điểm đã giúp mình bật band trong chỉ vỏn vẹn 2 tháng.",
    meta: "IELTS Speaking · Kinh nghiệm cá nhân",
  },
  {
    label: "Nói that's everything khi chưa tới ngưỡng 2 phút",
    body: "Part 2 là long turn, chủ yếu đánh giá khả năng kể một câu chuyện dài, liền mạch, có đầu đuôi. Thường giám khảo sẽ chủ động nhắc bạn nói tiếp khi bạn ngừng nhưng vẫn chưa hết thời gian. Việc nói \"that's everything\" hoặc \"that's all\" vô tình khiến giám khảo chẳng buồn nhắc nữa, ít nhiều sẽ ảnh hưởng tới kết quả sau cùng. Với kinh nghiệm của mình, tuyệt đối không nên nói hai cụm này.",
    meta: "IELTS Speaking · Long Turn",
  },
  {
    label: "Không dùng signposts và linkers",
    body: "Không có từ nối, đặc biệt là trong Part 2, sẽ làm bài nói nghe như một danh sách câu rời rạc và khiến giám khảo khó theo dõi. Để đạt band 7 trở lên về Fluency and Coherence, cần dùng đều signposts và linkers để dẫn dắt từng ý trong phần trả lời 2 phút.",
    meta: "IELTS Speaking · Fluency and Coherence",
  },
];

const TITLE = ["Những gì sẽ khiến bạn kẹt band 6.5 Speaking"];

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
const TRANS_RANGE = 0; // quãng cuộn chuyển cảnh trước nội dung đầu (vh), 0 để mọi quãng cuộn bằng nhau


// ===== Cuộn =====
const STEP_VH = 38.4; // quãng cuộn cho mỗi nội dung (vh), lớn hơn = chuyển chậm và ít nhảy hơn
const GOTO_MS = 700; // thời lượng khi bấm vào mục bên trái (ms)
const INTRO_HOLD = 1; // số nội dung phải cuộn trước khi mục đầu tiên mở, bằng đúng quãng giữa các mục

// ===== Tính toán cố định =====
const N = STEPS.length;
// Tổng số "nấc" cuộn: mỗi mục một nấc, cộng thêm nấc chờ trước mục đầu tiên để mục cuối vẫn mở được
const UNITS = N + INTRO_HOLD;
const TOTAL_VH = TRANS_RANGE + UNITS * STEP_VH;
const T_END = TRANS_RANGE / TOTAL_VH;
// Trên Mac, trackpad đẩy qua các nội dung quá nhanh: kéo dài quãng cuộn để nội dung đổi chậm hơn
// (0.8 rồi chậm thêm 50% => còn 0.4 tốc độ gốc)
const MAC_SLOW = 1 / 0.4;
const COLUMN_H = "h-[46svh] md:h-[38vh] lg:h-[min(70vh,560px)]";

const clamp = (v: number, min = 0, max = 1) => Math.min(Math.max(v, min), max);

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
  scrollTo: (
    target: number,
    options?: { duration?: number; easing?: (t: number) => number; immediate?: boolean }
  ) => void;
};

const getLenis = () => (window as unknown as { __lenis?: LenisLike }).__lenis;
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export default function TransitionStory() {
  const sectionRef = useRef<HTMLElement>(null);
  const storyRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  // -1: chưa mục nào được mở, chỉ hiện mũi tên nối từ tiêu đề tới mục đầu tiên
  const [active, setActive] = useState(-1);
  // Hệ số kéo dài quãng cuộn, chỉ đổi sau khi mount để không lệch với HTML render từ server
  const [stretch, setStretch] = useState(1);

  // Tiến độ trong các nội dung story (0 - 1), suy ra trực tiếp từ vị trí cuộn
  const progressOf = (section: HTMLElement) => {
    const r = section.getBoundingClientRect();
    const total = section.offsetHeight - window.innerHeight;
    return clamp(-r.top / total);
  };

  const storyProgress = (p: number) => clamp((p - T_END) / (1 - T_END));

  // Vị trí cuộn ở giữa một nội dung, để bấm mục nào thì nội dung đó hiện rõ nhất
  const yForStep = (section: HTMLElement, i: number) => {
    const total = section.offsetHeight - window.innerHeight;
    const top = section.getBoundingClientRect().top + window.scrollY;
    return top + (T_END + ((i + INTRO_HOLD + 0.5) / UNITS) * (1 - T_END)) * total;
  };

  useEffect(() => {
    const isMac = /Mac/.test(navigator.platform || navigator.userAgent) && navigator.maxTouchPoints <= 1;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- chỉ đọc được nền tảng trên trình duyệt
    if (isMac) setStretch(MAC_SLOW);
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    let frame = 0;

    // Chỉ đọc vị trí cuộn và cập nhật giao diện, không chặn hay tự cuộn trang
    const update = () => {
      frame = 0;
      const p = progressOf(section);
      const sp = storyProgress(p);

      // Con ong hiện ngay khi section lên màn hình, không đợi hết quãng chuyển cảnh
      const inStory = section.getBoundingClientRect().bottom > 0 && p < 0.999;
      if (indicatorRef.current) indicatorRef.current.style.opacity = inStory ? "1" : "0";
      // Con ong đi theo toàn bộ quãng cuộn của section, không đợi hết quãng chuyển cảnh cũ
      if (dotRef.current) dotRef.current.style.offsetDistance = `${p * 100}%`;


      const idx = Math.min(Math.floor(sp * UNITS - INTRO_HOLD), N - 1);
      setActive((prev) => (prev === idx ? prev : idx));
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  // Bấm mục bên trái: cuộn tới đúng nội dung đó bằng Lenis (hoặc dự phòng bằng cuộn native)
  const goTo = (i: number) => {
    const section = sectionRef.current;
    if (!section) return;
    const y = yForStep(section, i);
    const lenis = getLenis();
    if (lenis) {
      lenis.scrollTo(y, { duration: GOTO_MS / 1000, easing: easeInOutCubic });
    } else {
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  // Trước khi mục đầu tiên mở: hiện ảnh bandstuck bên phải; khi mục đầu mở: hiện minh họa đường cong
  const sIntro = active === -1;
  const s1 = active === 0;
  const s2 = active === 1;
  const s3 = active === 2;

  return (
    <section ref={sectionRef} style={{ height: `${100 + TOTAL_VH * stretch}vh` }} className="relative bg-white text-[#1a1a1a]">
      <div className="sticky top-0 h-[100svh] w-full overflow-hidden">
        {/* ===== Chỉ báo tiến độ: con ong bay theo đường chữ S, chỉ hiện trong story ===== */}
        <div
          ref={indicatorRef}
          className="pointer-events-none absolute bottom-10 left-1/2 z-30 hidden -translate-x-1/2 transition-opacity duration-500 md:block"
          style={{ opacity: 0 }}
        >
          <ScrollBee beeRef={dotRef} />
        </div>

        <div
          ref={storyRef}
          className="absolute inset-0 flex items-start justify-center pt-[10svh] md:items-center md:pt-0"
          style={{ opacity: 1 }}
        >
          <div className="grid w-[90vw] items-center gap-6 lg:w-[70vw] lg:grid-cols-2 lg:gap-[6rem]">
            <div className="grid gap-6 md:gap-6">
              <h2 className="font-serif text-[7.5vw] font-bold italic leading-[1.25] md:text-[length:var(--fs-title)] lg:text-[30px] tracking-tight md:leading-[1.3]">
                {TITLE.map((line) => (
                  <span key={line} className="block">
                    {/* Số 6.5 nghiêng nên trông cách xa chữ "band": kéo sát lại một chút */}
                    {line.split("6.5").map((part, i) =>
                      i === 0 ? (
                        part
                      ) : (
                        <span key={i}>
                          <span className="ml-[-0.08em]">6.5</span>
                          {part}
                        </span>
                      )
                    )}{" "}
                  </span>
                ))}
              </h2>

              <div
                className={`grid transition-[grid-template-rows,opacity] duration-500 ease-out ${
                  active === -1 ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <div className="overflow-hidden">
                  <span className="block py-[9px] text-left font-mono text-[length:var(--fs-tag)] uppercase tracking-[0.2em] text-[#d62828]">
                    scroll
                  </span>
                </div>
              </div>

              <ol className="space-y-4 md:space-y-6">
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
                          className={`font-sans text-[length:var(--fs-subtitle)] transition-colors duration-300 group-hover:text-[#1a1a1a] ${
                            isActive ? "font-bold text-[#1a1a1a]" : "text-[#9a9a9a]"
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
                          <p className="mt-4 lg:max-w-md text-[length:var(--fs-text)] leading-relaxed text-justify text-[#1a1a1a]">
                            {step.body}
                          </p>
                        </div>
                      </div>
                      {i === active && i < N - 1 && (
                        <svg className="mt-5 block" width="22" height="40" viewBox="0 0 22 40" aria-hidden="true">
                          <line x1="11" y1="2" x2="11" y2="26" stroke="#d62828" strokeWidth="4" strokeLinecap="round" />
                          <polygon points="2,24 20,24 11,38" fill="#d62828" />
                        </svg>
                      )}
                    </li>
                  );
                })}
              </ol>
            </div>

            <div className={`relative ${COLUMN_H} w-full`}>
              {/* Người đang nằm và số 6.5 chuyển sang mục "Nói theo bản năng" */}
              <Reveal show={s1} from="up" className="absolute inset-0 flex items-center justify-center">
                <div className="relative h-full -translate-x-[6vw]">
                  <img
                    src="/images/bandstuck.png"
                    alt=""
                    className="relative z-10 h-full w-auto object-contain [filter:drop-shadow(0_1.5vh_1.2vh_rgba(20,60,60,0.3))]"
                  />
                  {/* Số 6.5 3D màu đỏ, nghiêng về bên trái, đứng bên phải nhân vật */}
                  <span
                    className="absolute left-[78%] top-0 whitespace-nowrap font-sans text-[35vh] font-black leading-none text-[#d62828]"
                    style={{
                      transform: "translate(-130px, 5px) perspective(400px) rotateY(-25deg)",
                      textShadow:
                        "1px 1px 0 #b01f1f, 2px 2px 0 #9e1b1b, 3px 3px 0 #8c1717, 4px 4px 0 #7a1313, 6px 8px 10px rgba(0,0,0,0.25)",
                      filter: "drop-shadow(0 1.5vh 1.2vh rgba(20,60,60,0.3))",
                    }}
                  >
                    6.5
                  </span>
                </div>
              </Reveal>

              {DECOR.map((d) => (
                <Reveal
                  key={d.text}
                  show={s2}
                  from="scale"
                  delay={d.delay}
                  className="pointer-events-none absolute hidden md:block"
                  style={{ left: `${d.x}%`, top: `${d.y}%` }}
                >
                  <span
                    className="block whitespace-nowrap font-serif italic text-[11px] md:text-[0.875vw] min-[1024px]:text-[0.84vw] text-[#6b6b6b]"
                    style={{ transform: `rotate(${d.rotate}deg)` }}
                  >
                    {d.text}
                  </span>
                </Reveal>
              ))}

              <div className="absolute inset-0 flex flex-col justify-center">
                <Reveal show={s2} from="up">
                  <h3 className="font-serif text-[length:var(--fs-card)] font-semibold leading-tight">{CUE_CARD.title}</h3>
                  <p className="mt-5 font-serif italic text-[#1a1a1a]/70">You should say:</p>
                </Reveal>

                <div className="mt-6 flex flex-wrap gap-x-3 gap-y-4 md:mt-12 md:gap-x-4 md:gap-y-5">
                  {CUE_CARD.points.map((point, i) => {
                    const st = NOTE_STYLES[i % NOTE_STYLES.length];
                    return (
                      <Reveal key={point} show={s2} from={i % 2 === 0 ? "left" : "right"} delay={300 + i * 140}>
                        <span
                          className="inline-block rounded-[10px] px-3 py-2 font-sans text-[length:var(--fs-text)] leading-snug text-[#1a1a1a] md:px-4 md:py-3"
                          style={{ backgroundColor: st.bg, transform: `rotate(${st.rotate})` }}
                        >
                          {point}
                        </span>
                      </Reveal>
                    );
                  })}
                </div>
              </div>

              <Reveal show={s1} from="up" delay={650} className="absolute inset-x-[10%] bottom-6">
                <div className="flex items-center gap-3 rounded-full border border-[#1a1a1a]/15 bg-white px-5 py-3 text-[11px] md:text-[0.875vw] min-[1024px]:text-[0.84vw]">
                  <span className="text-[#9a9a9a]">⌕</span>
                  <span>cách đạt IELTS 8.0 trong 2 tháng</span>
                </div>
              </Reveal>

              {/* Quỹ đạo vòng hành tinh với ảnh bandstuck#2 ở giữa, hiện ở phần đầu */}
              <Reveal show={sIntro} from="scale" className="absolute inset-0">
                <div className="relative h-full w-full">
                  <ScoreOrbit fit reveal={false} backdropSrc="/images/bandstuck%232.png" showPlanet={false} />
                </div>
              </Reveal>

            </div>
          </div>
        </div>

      </div>
    </section>
  );
}