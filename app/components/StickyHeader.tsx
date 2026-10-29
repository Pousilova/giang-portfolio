"use client";

import { useEffect, useState } from "react";

// Thanh điều hướng dính trên cùng: bên trái là tên và điểm IELTS, bên phải là các tab (tên tạm thời)
const TABS = [
  { label: "About", href: "#about" },
  { label: "Experience", href: "#score-85", active: true },
  { label: "UX", href: "#" },
  { label: "Projects", href: "#work" },
  { label: "Contact", href: "#contact" },
];

export default function StickyHeader() {
  // Khung chỉ hiện khi đã cuộn; lúc mới load thì chỉ có chữ
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 0);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const frame = `border transition-colors duration-300 ${scrolled ? "border-[#1a1a1a]/10 bg-white/25 backdrop-blur-md" : "border-transparent bg-transparent"}`;

  return (
    <header className="fixed inset-x-0 top-0 z-50 hidden items-stretch md:flex justify-between gap-4 px-[2.4%] py-3 font-sans text-[12px] uppercase tracking-[0.15em] text-[#1a1a1a]">
      <div className={`flex items-center px-6 py-4 ${frame}`}>
        Hoàng Giang <span className="mx-2">•</span> 8.5 IELTS
      </div>

      <nav className={`flex items-center px-8 py-4 text-[#6b6b6b] ${frame}`}>
        {TABS.map((tab) => (
          <a
            key={tab.label}
            href={tab.href}
            className={`ml-8 transition-colors hover:text-[#1a1a1a] ${tab.active ? "font-semibold text-[#1a1a1a]" : ""}`}
          >
            {tab.active ? `[ ${tab.label} ]` : tab.label}
          </a>
        ))}

        <span className="ml-8 h-5 w-px bg-[#1a1a1a]/15" />

        <span className="ml-6 flex items-center gap-1 text-[#1a1a1a]">
          {/* Ngôi sao bốn cánh */}
          <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 2 C12.8 8.4 15.6 11.2 22 12 C15.6 12.8 12.8 15.6 12 22 C11.2 15.6 8.4 12.8 2 12 C8.4 11.2 11.2 8.4 12 2 Z" fill="currentColor" />
          </svg>
          {/* Mũi tên xuống */}
          <svg width="10" height="10" viewBox="0 0 12 12" aria-hidden="true">
            <path d="M2 4 L6 8 L10 4" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </span>
      </nav>
    </header>
  );
}
