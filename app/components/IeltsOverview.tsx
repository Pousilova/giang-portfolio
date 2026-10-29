import ScoreOrbit from "./ScoreOrbit";

// Trang chủ: cụm quỹ đạo điểm IELTS lấp đầy một khung cao vừa phải
export default function IeltsOverview() {
  return (
    <section id="overview" className="overflow-hidden bg-white py-16 text-[#1a1a1a]">
      <div className="mx-auto h-[min(90vh,820px)] w-full">
        <ScoreOrbit />
      </div>
    </section>
  );
}
