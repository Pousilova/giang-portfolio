"use client";

import { useEffect } from "react";

const IDLE_MS = 150; // đợi người dùng ngừng cuộn bao lâu thì mới tự snap (ms), đủ để quán tính trackpad lắng bớt
const SNAP_MS = 1.0; // thời lượng tự cuộn (giây), đủ dài để chuyển động êm
const SNAP_LOCK_MS = 1100; // khoá không snap thêm trong lúc đang tự cuộn (ms)
const MOMENTUM_IGNORE_MS = 300; // sau khi snap xong, bỏ qua quán tính trackpad còn sót (ms)
const MOMENTUM_GAP_MS = 120; // quán tính còn bắn liên tục thì tiếp tục bỏ qua, cho tới khi ngừng quá khoảng này (ms)
const UP_SNAP_RATIO = 0.5; // cuộn lên mà còn dưới 50% chiều cao màn hình thì tự snap về đầu hero

type LenisLike = {
  scrollTo: (
    target: number,
    options?: {
      duration?: number;
      easing?: (t: number) => number;
      lock?: boolean;
      force?: boolean;
      onComplete?: () => void;
    }
  ) => void;
};

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

// Khi cuộn xuống từ hero, tự cuộn tới đầu section đích; khi cuộn lên gần hết hero, tự cuộn về đầu trang
export default function SnapToSection({ targetId }: { targetId: string }) {
  useEffect(() => {
    let timer = 0;
    let locked = false;
    let lastY = window.scrollY;
    // Mốc thời gian còn bỏ qua cuộn của người dùng (trong lúc snap và ngay sau khi snap xong)
    let ignoreUntil = 0;

    const release = () => {
      if (!locked) return;
      locked = false;
      ignoreUntil = performance.now() + MOMENTUM_IGNORE_MS;
    };

    const glideTo = (dest: number) => {
      locked = true;
      ignoreUntil = Infinity;
      const lenis = (window as unknown as { __lenis?: LenisLike }).__lenis;
      if (lenis) {
        // lock: Lenis bỏ qua cuộn của người dùng cho tới khi tới đích, để quán tính trackpad không đẩy trang vọt qua
        lenis.scrollTo(dest, { duration: SNAP_MS, easing: easeInOutCubic, lock: true, force: true, onComplete: release });
      } else {
        window.scrollTo({ top: dest, behavior: "smooth" });
      }
      // Dự phòng nếu onComplete không được gọi (ví dụ trình duyệt không có Lenis)
      window.setTimeout(release, SNAP_LOCK_MS);
    };

    // Chặn sự kiện lăn khi đang snap hoặc vừa snap xong, trước khi Lenis kịp nhận
    const onWheel = (e: WheelEvent) => {
      const now = performance.now();
      if (now < ignoreUntil) {
        e.preventDefault();
        e.stopImmediatePropagation();
        // Quán tính trackpad bắn sự kiện liên tục: còn nhận được thì kéo dài thêm, ngừng hẳn mới cho cuộn lại
        if (!locked) ignoreUntil = Math.max(ignoreUntil, now + MOMENTUM_GAP_MS);
      }
    };

    const snapDown = () => {
      const target = document.getElementById(targetId);
      if (!target || locked) return;

      const y = window.scrollY;
      const top = target.getBoundingClientRect().top + window.scrollY;
      if (y <= 0 || y >= top) return;

      // Đầu section đích: dừng ở trạng thái ảnh bandstuck đầu tiên, chưa mở mục nào
      glideTo(top);
    };

    const snapUp = () => {
      if (locked) return;

      const y = window.scrollY;
      if (y <= 0 || y >= window.innerHeight * UP_SNAP_RATIO) return;

      // Hero đã gần hết khung nhìn khi cuộn lên: về hẳn đầu hero
      glideTo(0);
    };

    const onScroll = () => {
      const y = window.scrollY;
      const down = y > lastY;
      lastY = y;
      window.clearTimeout(timer);
      timer = window.setTimeout(down ? snapDown : snapUp, IDLE_MS);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("wheel", onWheel, { passive: false, capture: true });
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("wheel", onWheel, { capture: true });
    };
  }, [targetId]);

  return null;
}
