import SmoothScroll from "../components/SmoothScroll";
import TransitionStory from "../components/TransitionStory";
import SnapToSection from "../components/SnapToSection";
import StickyHeader from "../components/StickyHeader";

// Lớp hạt phim (grain) dùng chung cho hero và section chuyển cảnh
function Grain() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 opacity-[0.4] mix-blend-multiply"
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='3' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
      }}
    />
  );
}

// Hero của trang phụ: nền xanh ngọc phẳng, chữ lớn màu kem, một bong bóng thoại nhỏ và nhân vật nằm giữa trang
export default function SecondaryPage() {
  return (
    <SmoothScroll>
    <SnapToSection targetId="story-transition" />
    <main
      className="relative min-h-screen text-[#f4f8e4]"
      style={{
        // Nền sáng ở giữa, tối dần về viền như ảnh mẫu
        backgroundImage: "radial-gradient(ellipse at center, #b6dcdb 0%, #a6d5d4 50%, #8cc2c1 100%)",
      }}
    >
      <StickyHeader />

      <section className="relative flex min-h-screen w-full items-center justify-center overflow-hidden">
        {/* Grain nằm dưới chữ và nhân vật để không làm ảnh bị sáng lên */}
        <Grain />

        {/* Tiêu đề chính */}
        <h1 className="absolute left-1/2 top-[52%] w-[92vw] -translate-x-1/2 text-center font-sans text-[12vw] leading-none tracking-tight md:whitespace-nowrap md:text-[11vw]">
          Cam on vi da den.
        </h1>

        {/* Khung nhân vật: bong bóng thoại đặt ngay phía trên đầu, theo chiều cao ảnh */}
        <div className="absolute bottom-[8%] left-1/2 h-[47vh] -translate-x-1/2 md:h-[58.14vh]">
          {/* Bong bóng thoại nhỏ phía trên đầu nhân vật */}
          <div className="absolute bottom-full left-1/2 z-10 mb-4 -translate-x-1/2 whitespace-nowrap border border-[#f4f8e4]/70 px-6 py-3 font-sans text-[12px] font-light tracking-[0.08em] md:text-[0.9vw]">
            Xin chào, I am him
            {/* Đuôi tam giác chỉ xuống: lớp ngoài là viền, lớp trong là nền để che đường viền dưới ngay chỗ đuôi */}
            <span className="absolute left-1/2 top-full -translate-x-1/2 border-x-[6px] border-t-[7px] border-x-transparent border-t-[#f4f8e4]/70" />
            <span className="absolute left-1/2 top-full -mt-px -translate-x-1/2 border-x-[5px] border-t-[6px] border-x-transparent border-t-[#a6d5d4]" />
          </div>

          {/* Bóng đổ mềm dưới chân đế, nằm đúng chân nhân vật */}
          <div className="absolute bottom-0 left-1/2 h-[4vh] w-[16vh] -translate-x-1/2 rounded-full bg-[#1a4a4a]/35 blur-md" />

          {/* Ảnh nhân vật cắt nền, ảnh dọc nên căn theo chiều cao, có bóng đổ theo hình cắt */}
          <img
            src="/images/herosecondary.png"
            alt="Giang"
            className="h-full w-auto object-contain [filter:drop-shadow(0_1.5vh_1.2vh_rgba(20,60,60,0.3))]"
          />
        </div>
      </section>

      {/* Section chuyển cảnh: nền đào ấm và grain giống hero, nội dung TransitionStory giữ nguyên */}
      <div id="story-transition" className="relative bg-white">
        <Grain />
        <div className="relative z-10">
          <TransitionStory />
        </div>
      </div>
    </main>
    </SmoothScroll>
  );
}
