"use client";

import type { CSSProperties, RefObject } from "react";

// Đường cong chữ S nằm ngang, kích thước khớp với khung bên dưới (px)
export const BEE_WIDTH = 260;
export const BEE_HEIGHT = 44;
export const BEE_PATH = "M0 22 C 30 2, 50 42, 80 22 S 130 2, 160 22 S 210 42, 260 22";

// Con ong bay dọc theo đường chữ S theo tiến độ cuộn.
// Component cha đặt offsetDistance của beeRef (0% -> 100%) khi cuộn.
export default function ScrollBee({ beeRef }: { beeRef: RefObject<HTMLDivElement | null> }) {
  const beeStyle = {
    offsetPath: `path("${BEE_PATH}")`,
    offsetAnchor: "center",
    offsetDistance: "0%",
  } as CSSProperties;

  return (
    <div className="relative" style={{ width: BEE_WIDTH, height: BEE_HEIGHT }}>
      <svg
        className="absolute inset-0 h-full w-full overflow-visible"
        viewBox={`0 0 ${BEE_WIDTH} ${BEE_HEIGHT}`}
        aria-hidden="true"
      >
        <path d={BEE_PATH} fill="none" stroke="#1a1a1a" strokeOpacity="0.25" strokeWidth="1" strokeDasharray="2 4" />
      </svg>
      <div ref={beeRef} className="absolute left-0 top-0 text-[14px] leading-none" style={beeStyle}>
        {/* Chữ đi kèm con ong, di chuyển cùng con ong */}
        <span className="pointer-events-none absolute bottom-full left-1/2 mb-1 -translate-x-1/2 whitespace-nowrap font-mono text-[7px] uppercase tracking-[0.15em] text-[#1a1a1a]/70">
          lăn chuột đi
        </span>
        🐝
        <span className="pointer-events-none absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap font-mono text-[7px] uppercase tracking-[0.15em] text-[#1a1a1a]/70">
          haha
        </span>
      </div>
    </div>
  );
}
