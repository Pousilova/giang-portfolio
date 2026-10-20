// Dữ liệu 4 kỹ năng (thay điểm thật của bạn)
const SKILLS = [
  { name: "Listening", score: "8.5" },
  { name: "Reading", score: "9.0" },
  { name: "Writing", score: "8.0" },
  { name: "Speaking", score: "8.0" },
];

export default function IeltsCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#1a1a1a]/15 bg-white shadow-[0_20px_60px_-25px_rgba(0,0,0,0.15)]">
      {/* Đầu thẻ */}
      <div className="relative border-b border-[#1a1a1a]/10 px-6 pb-5 pt-6">
        <span className="absolute right-6 top-6 rounded-md bg-[#f7b52c] px-2.5 py-1 font-mono text-xs text-[#1a1a1a]">
          Gần nhất
        </span>

        <h3 className="mt-3 text-2xl font-semibold text-[#d62828]">Overall 8.5</h3>

        {/* Ngày thi và nút xem chi tiết cùng một hàng */}
        <div className="mt-2 flex items-center justify-between gap-4">
          <p className="font-mono text-sm text-[#6b6b6b]">
            27/05/2026 · TP Hồ Chí Minh IDP
          </p>
          <a href="#" className="shrink-0 font-mono text-sm text-[#1a1a1a] hover:opacity-70">
            Xem chi tiết →
          </a>
        </div>
      </div>

      {/* Tiêu đề cột */}
      <div className="flex justify-between border-b border-[#1a1a1a]/10 px-6 py-3 font-mono text-[11px] uppercase tracking-[0.2em] text-[#6b6b6b]">
        <span>Skill</span>
        <span>Score</span>
      </div>

      {/* 4 kỹ năng */}
      {SKILLS.map((skill) => (
        <div
          key={skill.name}
          className="flex items-center justify-between border-b border-[#1a1a1a]/10 px-6 py-5 last:border-b-0"
        >
          <span className="text-base">{skill.name}</span>
          <span className="text-xl font-medium">{skill.score}</span>
        </div>
      ))}
    </div>
  );
}