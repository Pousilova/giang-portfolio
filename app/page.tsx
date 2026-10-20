import Hero from "./components/Hero";
import IeltsOverview from "./components/IeltsOverview";
import ParallaxSection from "./components/ParallaxSection";
import SmoothScroll from "./components/SmoothScroll";

const SERVICES = [
  { title: "Photography", text: "Chụp ảnh chân dung, phong cảnh và đời sống hằng ngày." },
  { title: "Photo editing", text: "Chỉnh màu, ánh sáng và hậu kỳ theo phong cách riêng." },
  { title: "English", text: "Điểm IELTS 8.5, sẵn sàng hỗ trợ dịch và giao tiếp." },
];

export default function Home() {
  return (
    <SmoothScroll>
      <main className="min-h-screen bg-white text-[#1a1a1a]">
        <Hero />

        <IeltsOverview />

        <ParallaxSection />

        <section id="score-85" className="border-t border-[#1a1a1a]/20 px-6 py-24 md:px-12">
          <h2 className="font-serif text-5xl italic md:text-6xl">Cách mình đạt 8.5</h2>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed">Nội dung đang chờ bạn bổ sung.</p>
        </section>

        <section id="about" className="grid gap-12 px-6 py-24 md:grid-cols-2 md:px-12">
          <h2 className="font-serif text-5xl italic md:text-6xl">About Giang</h2>
          <div className="space-y-5 text-lg leading-relaxed">
            <p>
              Tôi là Giang, người yêu nhiếp ảnh và chỉnh sửa ảnh. Tôi tin rằng một
              bức ảnh đẹp bắt đầu từ ánh sáng, bố cục và cảm xúc.
            </p>
            <p>
              Tôi đạt 8.5 IELTS, nên có thể làm việc và giao tiếp tốt bằng cả tiếng
              Việt lẫn tiếng Anh.
            </p>
          </div>
        </section>

        <section id="work" className="border-t border-[#1a1a1a]/20 px-6 py-20 md:px-12">
          <h2 className="max-w-md text-4xl leading-tight tracking-tight md:text-5xl">What I do.</h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {SERVICES.map((item) => (
              <div key={item.title} className="rounded-2xl border border-[#1a1a1a]/20 p-8">
                <h3 className="font-serif text-3xl italic">{item.title}</h3>
                <p className="mt-4 text-base leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="contact" className="border-t border-[#1a1a1a]/20 px-6 py-20 md:px-12">
          <h2 className="font-serif text-5xl italic md:text-6xl">Let&apos;s talk.</h2>
          <p className="mt-6 max-w-xl text-lg leading-relaxed">
            Bạn muốn hợp tác chụp ảnh hay chỉnh sửa ảnh? Liên hệ với tôi qua email hoặc Instagram.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <a href="mailto:your@email.com" className="rounded-lg bg-[#1a1a1a] px-8 py-4 text-white hover:opacity-90">
              Email
            </a>
            <a href="#" className="rounded-lg border-2 border-[#1a1a1a] px-8 py-4 hover:bg-[#1a1a1a] hover:text-white">
              Instagram
            </a>
          </div>
        </section>

        <footer className="border-t border-[#1a1a1a]/20 px-6 py-8 font-mono text-xs uppercase tracking-[0.15em] md:px-12">
          © 2026 Giang
        </footer>
      </main>
    </SmoothScroll>
  );
}