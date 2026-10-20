"use client";

import { useEffect, useRef, useState } from "react";

type Segment = { text: string; className?: string };

const KEYFRAMES = `
@keyframes riseWord {
  from { transform: translate3d(0, 105%, 0); opacity: 0; }
  to   { transform: translate3d(0, 0, 0);    opacity: 1; }
}`;

type Props = {
  segments: Segment[];
  className?: string; // class cho thẻ h1 (cỡ chữ, khoảng cách dòng...)
  stagger?: number; // độ trễ giữa các từ (giây), lớn hơn = trồi chậm hơn
  duration?: number; // thời gian mỗi từ trồi lên (giây)
};

export default function RiseText({
  segments,
  className = "",
  stagger = 0.06,
  duration = 2.0,
}: Props) {
  const ref = useRef<HTMLHeadingElement>(null);
  const [started, setStarted] = useState(false);

  // Bắt đầu animation khi chữ xuất hiện trong khung nhìn
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true);
          io.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  let wordIndex = 0;

  return (
    <>
      <style>{KEYFRAMES}</style>
      <h1 ref={ref} className={className}>
        {segments.map((seg, si) =>
          // tách theo khoảng trắng, giữ nguyên các khoảng trắng
          seg.text.split(/(\s+)/).map((token, ti) => {
            if (token === "") return null;
            if (/^\s+$/.test(token)) {
              return <span key={`${si}-${ti}`}>{token}</span>;
            }

            const idx = wordIndex++;
            return (
              <span
                key={`${si}-${ti}`}
                className={`inline-block overflow-hidden pb-[0.12em] -mb-[0.12em] align-top ${seg.className ?? ""}`}
              >
                <span
                  className="inline-block"
                  style={
                    started
                      ? {
                          animation: `riseWord ${duration}s cubic-bezier(0.22, 1, 0.36, 1) ${idx * stagger}s both`,
                        }
                      : { transform: "translate3d(0, 105%, 0)", opacity: 0 }
                  }
                >
                  {token}
                </span>
              </span>
            );
          })
        )}
      </h1>
    </>
  );
}