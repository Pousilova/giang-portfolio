export default function Home() {
  return (
    <main
      className="min-h-screen text-[#063a2a]"
      style={{
        background:
          "radial-gradient(circle at 20% 30%, #b5c95a 0%, transparent 45%), radial-gradient(circle at 80% 70%, #c9d96b 0%, transparent 40%), linear-gradient(180deg, #8fab52 0%, #8aa84f 100%)",
      }}
    >
      {/* Header */}
      <header className="flex items-center justify-between border-b border-[#063a2a]/30 px-6 py-5 md:px-12">
        <p className="font-mono text-sm tracking-[0.2em] uppercase">Giang</p>
        <nav className="hidden gap-8 font-mono text-sm uppercase tracking-[0.15em] md:flex">
          <a href="#about" className="hover:opacity-70">About</a>
          <a href="#work" className="hover:opacity-70">Work</a>
          <a href="#contact" className="hover:opacity-70">Contact</a>
        </nav>
        <a
          href="#contact"
          className="rounded-full border-2 border-[#063a2a] px-4 py-1.5 font-mono text-xs uppercase tracking-[0.15em] hover:bg-[#063a2a] hover:text-[#c9d96b]"
        >
          Say hi
        </a>
      </header>

      {/* Hero */}
      <section id="about" className="px-6 pt-16 md:px-12 md:pt-24">
        <h1 className="font-serif text-6xl italic leading-none tracking-tight md:text-8xl">
          About Giang
        </h1>

        <div className="mt-16 grid gap-12 md:grid-cols-2">
          <h2 className="text-4xl leading-tight tracking-tight md:text-5xl">
            Make a stronger <br />
            <span className="font-serif italic">first impression.</span>
          </h2>

          <div className="space-y-5 text-lg leading-relaxed">
            <p>
              Tôi là Giang, người yêu nhiếp ảnh và chỉnh sửa ảnh. Tôi tin rằng
              một bức ảnh đẹp bắt đầu từ ánh sáng, bố cục và cảm xúc.
            </p>
            <p>
              Tôi đạt 8.5 IELTS, nên có thể làm việc và giao tiếp tốt bằng cả
              tiếng Việt lẫn tiếng Anh.
            </p>
          </div>
        </div>

        <a
          href="#contact"
          className="mt-14 inline-block rounded-lg bg-[#063a2a] px-8 py-4 text-lg text-white hover:opacity-90"
        >
          Let's work together
        </a>
      </section>

      {/* Services */}
      <section id="work" className="mt-28 border-t border-[#063a2a]/30 px-6 py-20 md:px-12">
        <h2 className="max-w-md text-4xl leading-tight tracking-tight md:text-5xl">
          What I do.
        </h2>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            { title: "Photography", text: "Chụp ảnh chân dung, phong cảnh và đời sống hằng ngày." },
            { title: "Photo editing", text: "Chỉnh màu, ánh sáng và hậu kỳ theo phong cách riêng." },
            { title: "English", text: "Điểm IELTS 8.5, sẵn sàng hỗ trợ dịch và giao tiếp." },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-[#063a2a]/30 bg-white/10 p-8 backdrop-blur-sm"
            >
              <h3 className="font-serif text-3xl italic">{item.title}</h3>
              <p className="mt-4 text-base leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="border-t border-[#063a2a]/30 px-6 py-20 md:px-12">
        <h2 className="font-serif text-5xl italic md:text-6xl">Let's talk.</h2>
        <p className="mt-6 max-w-xl text-lg leading-relaxed">
          Bạn muốn hợp tác chụp ảnh hay chỉnh sửa ảnh? Liên hệ với tôi qua email
          hoặc Instagram.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <a
            href="mailto:your@email.com"
            className="rounded-lg bg-[#063a2a] px-8 py-4 text-white hover:opacity-90"
          >
            Email
          </a>
          <a
            href="#"
            className="rounded-lg border-2 border-[#063a2a] px-8 py-4 hover:bg-[#063a2a] hover:text-white"
          >
            Instagram
          </a>
        </div>
      </section>

      <footer className="border-t border-[#063a2a]/30 px-6 py-8 font-mono text-xs uppercase tracking-[0.15em] md:px-12">
        © 2026 Giang
      </footer>
    </main>
  );
}
