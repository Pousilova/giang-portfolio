"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, PointerEvent } from "react";
import ScrollBee from "./ScrollBee";

// ===== Cấu hình =====
type Crit = "FC" | "LR" | "GRA" | "PRON";
type Ease = "easy" | "hard";

// Kích thước thẻ trên desktop (vw) và trên mobile (px)
const CARD_VW = 9.8;
const STEP_VW = 15;
// Trên mobile hiển thị khoảng 3 thẻ trên một hàng
const CARD_PX = 118;
const STEP_PX = 162;
const MOBILE_BP = 768;
const EDGE_WIDTH = "8vw";
// Chiều cao ước lượng của thẻ trên mobile và chiều cao khung chứa hai hàng
const MOBILE_CARD_H = 140;
const MOBILE_HEIGHT = 260;

// Hàng trên to hơn và đậm, hàng dưới nhỏ và mờ hơn. Tỉ lệ thẻ được giữ nguyên nhờ scale.
const TOP_SCALE = 1.12;
const BOTTOM_SCALE = 0.78;
const BOTTOM_OPACITY = 0.4;

// Dấu tam giác đỏ chỉ vị trí ghi chú: nằm ở 45% chiều ngang
const MARKER_X = 0.45;
const MARKER_COLOR = "#d62828";

// Hai hàng ngang chồng lên nhau: hàng trên đi về một phía, hàng dưới đi ngược lại.
// ROW_GAP là khoảng cách từ tâm khung đến tâm mỗi hàng, tính theo tỉ lệ chiều cao khung.
const ROW_GAP = 0.18;
// Tâm của cụm hai hàng trên desktop: hàng trên được kéo lên gần đường cong con ong, hàng dưới xuống thấp hơn
const DESKTOP_ROW_CENTER = 0.42;
// Độ nhích lên của hàng trên so với chiều cao khung (desktop)
const TOP_ROW_LIFT = 0.02;
// Độ hạ xuống của hàng dưới so với chiều cao khung (desktop)
const BOTTOM_ROW_DROP = 0.07;

// Độ mượt: vị trí hiển thị đuổi theo vị trí đích, khi đang kéo thì bám nhanh, khi thả tay thì trôi chậm lại
const DRAG_FOLLOW = 14;
const GLIDE = 4;
const SETTLE_PX = 0.05;

// Section được ghim trong một khoảng cuộn dài để người dùng thấy trọn phần chữ và hai hàng thẻ
const PIN_HEIGHT_VH = 200;

// Hiệu ứng xuất hiện: thẻ trồi lên lần lượt
const ENTER_MS = 1100;
const ENTER_OFFSET_Y = 40;
const ENTER_STAGGER_MS = 60;

// Kiểu dây nối giữa các thẻ, lặp lại theo thứ tự
const LINK_STYLES = [
  { color: "#d62828", width: 1.2 },
  { color: "#7fb3d5", dash: "2 5", width: 1.6 },
  { color: "#1a1a1a", dash: "10 6", width: 1 },
  { color: "#f7b52c", dash: "18 6 3 6", width: 1.6 },
  { color: "#d62828", dash: "5 5", width: 1.2 },
  { color: "#7fb3d5", width: 1 },
  { color: "#1a1a1a", dash: "1 6", width: 1.6 },
];

const EASE_LABEL: Record<Ease, string> = {
  easy: "Dễ dùng",
  hard: "Khó dùng",
};

const LEVELS = ["Basic", "Intermediate", "Upper-Intermediate", "Advanced"];
const LEVEL_TINT = [
  { bg: "#d6f5e3", fg: "#1a1a1a" },
  { bg: "#fdf5b5", fg: "#1a1a1a" },
  { bg: "#cdeefc", fg: "#1a1a1a" },
  { bg: "#fde0d4", fg: "#1a1a1a" },
];

// Màu tiêu chí chọn sao cho không trùng với bốn màu độ khó (xanh bạc hà, vàng, xanh dương, cam đào)
const CRIT_COLOR: Record<Crit, string> = {
  FC: "#6d4fc2",
  LR: "#c2185b",
  GRA: "#6b7f1f",
  PRON: "#3d5a73",
};

// Nội dung
const HEADLINE = "Nắm chắc luật chơi, để dễ dàng lụm điểm cao";
const LEFT_HEAD = "Bốn tiêu chí chấm Speaking";
const LEFT_BODY =
  "FC, LR, GRA và Pronunciation. Kéo hàng tab phía trên để đi từ Basic đến Advanced. Tab nào chạm vào mũi tên đỏ sẽ hiện ghi chú chi tiết.";

type Card = {
  level: number;
  crit: Crit;
  title: string;
  body: string;
  ease: Ease;
};

const CRIT_ORDER: Crit[] = ["FC", "LR", "GRA", "PRON"];

// Ghi chú chi tiết cho từng tiêu chí, hiện khi tab nằm dưới mũi tên đỏ
const NOTES: Record<string, string> = {
  "Tốc độ nói":
    "Nói với tốc độ tự nhiên, bình thường, không nhanh cũng không chậm, giống khi bạn nói tiếng Việt. Đừng cố nói thật nhanh để gây ấn tượng, người nghe cần kịp theo bạn.",
  "Ngắt nghỉ":
    "Khi cần suy nghĩ, hãy dừng lại một nhịp ngắn thay vì nói ừm, à, hmm. Im lặng một đến hai giây nghe tự nhiên hơn nhiều so với tiếng đệm liên tục.",
  "Tránh lặp lại":
    "Khi nhắc lại một ý, hãy đổi từ hoặc cách diễn đạt khác, thay vì lặp đi lặp lại cùng một từ như good, good, good.",
  "Độ dài câu trả lời":
    "Đừng chỉ trả lời một câu ngắn. Hãy nói ý chính, rồi thêm một lý do hoặc một ví dụ để câu trả lời đủ dài, khoảng ba đến bốn câu.",
  "Đúng trọng tâm":
    "Trả lời thẳng vào câu hỏi trước, rồi mới nói thêm. Đừng kể lan man những chuyện không liên quan đến câu hỏi.",
  "Triển khai ý":
    "Mỗi ý nên có ba phần: ý chính, lý do hoặc ví dụ cụ thể, và một câu kết ngắn.",
  "Từ nối":
    "Dùng từ nối như however, moreover, as a result để các ý liền mạch. Đừng dùng từ nối ở câu nào cũng có, nghe sẽ máy móc.",
  "Từ vựng theo chủ đề":
    "Chuẩn bị sẵn từ vựng cho các chủ đề hay gặp như môi trường, công nghệ, học tập, rồi dùng đúng từ phù hợp với câu hỏi.",
  "Đúng nghĩa":
    "Kiểm tra từ bạn dùng có đúng nghĩa trong ngữ cảnh không. Đừng chọn từ nghe hay nhưng không đúng ý muốn nói.",
  Collocations:
    "Học các cụm từ thường đi cùng nhau, như make a decision hay take a break, thay vì ghép từng từ một theo nghĩa đen.",
  "Cụm động từ":
    "Dùng cụm động từ như look up, give up, carry on một cách tự nhiên và đúng ngữ cảnh. Đừng ép chúng vào mọi câu.",
  Paraphrase:
    "Diễn đạt lại ý của câu hỏi bằng từ khác, không lặp lại nguyên văn từ khóa. Ví dụ: đổi động từ thành một cụm tương đương.",
  Idiom:
    "Chỉ dùng thành ngữ khi bạn chắc nghĩa và dùng tự nhiên. Một thành ngữ đặt đúng chỗ tốt hơn nhiều thành ngữ gượng ép.",
  "Từ loại":
    "Chú ý dạng của từ. Ví dụ: success (danh từ), succeed (động từ), successful (tính từ), successfully (trạng từ).",
  "Câu đơn và câu phức":
    "Xen kẽ câu ngắn với câu dài có mệnh đề phụ như because, although, which để câu nói có chiều sâu hơn.",
  "Mạo từ":
    "Dùng a hoặc an khi nhắc đến một thứ lần đầu. Dùng the khi người nghe đã biết thứ đó, hoặc khi chỉ có một thứ như vậy.",
  "Số ít và số nhiều":
    "Danh từ đếm được dùng số nhiều khi nói chung chung, như people, cars. Chú ý động từ đi theo chủ ngữ số ít hay số nhiều.",
  "Đa dạng thì":
    "Kể chuyện quá khứ thì dùng past simple, nói về trải nghiệm thì dùng present perfect. Đổi thì linh hoạt làm câu nói tự nhiên hơn.",
  "So sánh":
    "Dùng so sánh hơn (-er, more), so sánh nhất (the -est, the most) và so sánh ngang bằng (as ... as) để mô tả rõ hơn.",
  "Câu bị động":
    "Dùng khi hành động quan trọng hơn người thực hiện, ví dụ: The park was built in 1990.",
  "Câu điều kiện":
    "Dùng câu điều kiện loại 2 để nói về giả định trái với hiện tại, ví dụ: If I had more time, I would learn piano.",
  "Mệnh đề quan hệ":
    "Dùng who, which, that, where để bổ sung thông tin cho danh từ, giúp câu trả lời cụ thể hơn.",
  "Đảo ngữ":
    "Đảo trợ động từ lên trước chủ ngữ sau các từ phủ định để nhấn mạnh, ví dụ: Never have I seen such a view.",
  "Ngữ điệu":
    "Lên giọng ở câu hỏi và ở chỗ muốn nhấn mạnh. Xuống giọng khi kết thúc một câu khẳng định.",
  "Phát âm rõ":
    "Phát âm rõ từng âm, nhất là các cặp dễ nhầm như /θ/ và /s/, /l/ và /r/.",
  "Âm cuối":
    "Phát âm rõ đuôi -s, -es, -ed và các phụ âm cuối như /t/, /d/, /k/ để người nghe không phải đoán.",
  "Nối âm":
    "Nối phụ âm cuối với nguyên âm đầu của từ phía sau, ví dụ: turn it off nghe như tur-ni-toff.",
  "Nhóm từ":
    "Chia câu thành các cụm ý ngắn, mỗi cụm một nhịp. Nói từng cụm để câu nghe mạch lạc và dễ theo dõi.",
  "Trọng âm từ":
    "Nhấn đúng âm tiết trọng âm của từ, ví dụ ^photograph, pho^tography, photo^graphic, để người nghe dễ hiểu.",
};

const RAW_CARDS: Card[] = [
  { level: 0, crit: "FC", title: "Tốc độ nói", body: "Nói đủ nhanh để tự nhiên, nhưng người nghe vẫn theo kịp.", ease: "easy" },
  { level: 0, crit: "PRON", title: "Phát âm rõ", body: "Phát âm từng âm rõ ràng, người nghe không phải đoán ý.", ease: "easy" },
  { level: 0, crit: "LR", title: "Từ vựng theo chủ đề", body: "Dùng từ vựng bám sát chủ đề đang được hỏi.", ease: "easy" },
  { level: 0, crit: "GRA", title: "Từ loại", body: "Dùng đúng danh từ, động từ, tính từ và trạng từ.", ease: "easy" },
  { level: 1, crit: "FC", title: "Ngắt nghỉ", body: "Giảm tiếng ờ, ừm và các khoảng lặng quá dài.", ease: "easy" },
  { level: 1, crit: "GRA", title: "Câu đơn và câu phức", body: "Kết hợp câu đơn và câu phức để ý nối tiếp mạch lạc.", ease: "easy" },
  { level: 1, crit: "LR", title: "Đúng nghĩa", body: "Dùng đúng nghĩa và đúng ngữ cảnh của từng từ.", ease: "hard" },
  { level: 1, crit: "PRON", title: "Ngữ điệu", body: "Lên xuống giọng để nhấn đúng ý quan trọng.", ease: "hard" },
  { level: 0, crit: "GRA", title: "Mạo từ", body: "Dùng đúng a, an, the trước danh từ.", ease: "easy" },
  { level: 0, crit: "GRA", title: "Số ít và số nhiều", body: "Phân biệt đúng danh từ số ít và số nhiều.", ease: "easy" },
  { level: 1, crit: "LR", title: "Collocations", body: "Ghép từ theo cách người bản xứ thường nói.", ease: "hard" },
  { level: 1, crit: "FC", title: "Tránh lặp lại", body: "Tránh lặp lại cùng một ý hoặc cùng một từ.", ease: "easy" },
  { level: 1, crit: "FC", title: "Độ dài câu trả lời", body: "Trả lời đủ dài để triển khai ý, không cụt lủn.", ease: "easy" },
  { level: 1, crit: "LR", title: "Cụm động từ", body: "Dùng cụm động từ như look up, give up, carry on.", ease: "hard" },
  { level: 1, crit: "GRA", title: "Đa dạng thì", body: "Đổi linh hoạt giữa các thì khi kể chuyện và so sánh.", ease: "hard" },
  { level: 1, crit: "PRON", title: "Âm cuối", body: "Phát âm rõ -s, -es, -ed và các phụ âm cuối.", ease: "easy" },
  { level: 2, crit: "FC", title: "Đúng trọng tâm", body: "Trả lời đúng trọng tâm câu hỏi, không lạc đề.", ease: "easy" },
  { level: 2, crit: "FC", title: "Triển khai ý", body: "Nêu lý do, ví dụ, rồi kết luận ngắn gọn.", ease: "easy" },
  { level: 2, crit: "FC", title: "Từ nối", body: "Dùng từ nối như however, moreover, as a result.", ease: "easy" },
  { level: 2, crit: "LR", title: "Paraphrase", body: "Diễn đạt lại ý bằng từ khác, không lặp từ khóa.", ease: "hard" },
  { level: 3, crit: "LR", title: "Idiom", body: "Dùng thành ngữ vừa đủ, đúng ngữ cảnh.", ease: "hard" },
  { level: 3, crit: "GRA", title: "So sánh", body: "So sánh hơn, so sánh nhất và so sánh ngang bằng.", ease: "easy" },
  { level: 3, crit: "GRA", title: "Câu bị động", body: "Dùng câu bị động để nhấn vào hành động.", ease: "easy" },
  { level: 3, crit: "GRA", title: "Câu điều kiện", body: "Dùng câu điều kiện để nói giả định và kết quả.", ease: "easy" },
  { level: 3, crit: "GRA", title: "Mệnh đề quan hệ", body: "Dùng mệnh đề quan hệ để bổ sung thông tin.", ease: "hard" },
  { level: 3, crit: "GRA", title: "Đảo ngữ", body: "Đảo ngữ để nhấn mạnh, tạo ấn tượng tự nhiên.", ease: "hard" },
  { level: 3, crit: "PRON", title: "Nối âm", body: "Nối âm cuối với âm đầu để câu nói liền mạch hơn.", ease: "hard" },
  { level: 3, crit: "PRON", title: "Nhóm từ", body: "Chia câu thành các cụm ý ngắn, mỗi cụm một nhịp.", ease: "hard" },
  { level: 3, crit: "PRON", title: "Trọng âm từ", body: "Nhấn đúng âm tiết của từ để người nghe dễ hiểu.", ease: "hard" },
];

// Sắp theo tiêu chí (FC, LR, GRA, Pronunciation), trong mỗi tiêu chí sắp từ Basic đến Advanced
const CARDS = [...RAW_CARDS]
  .map((c) => ({ ...c, note: NOTES[c.title] ?? "" }))
  .sort((a, b) => CRIT_ORDER.indexOf(a.crit) - CRIT_ORDER.indexOf(b.crit) || a.level - b.level);

const N = CARDS.length;
const GAP_JITTER = Array.from({ length: 14 }, () => 0);

// Đưa giá trị về khoảng [0, period), kể cả khi âm
const wrap = (value: number, period: number) => ((value % period) + period) % period;

type Placed = { cx: number; cy: number; top: boolean };

// Tính vị trí các thẻ trên một sợi dây khép kín.
// Hàng trên chạy từ trái sang phải (thẻ 1 -> 15), quặt xuống rồi hàng dưới chạy ngược lại (16 -> 29),
// và thẻ 29 nối lại với thẻ 1 ở mép trái ngoài khung nhìn.
function layoutBelt(offset: number, W: number, H: number, mobile: boolean) {
  const cw = mobile ? CARD_PX : (CARD_VW * W) / 100;
  const step = mobile ? STEP_PX : (STEP_VW * W) / 100;
  const base: number[] = [];
  let total = 0;
  for (let k = 0; k < N; k++) {
    base.push(total);
    total += step * (1 + GAP_JITTER[k % GAP_JITTER.length]);
  }
  const half = total / 2;
  const x0 = (W - half) / 2;
  // Trên mobile, hai hàng cách nhau đủ để không chồng chữ lên nhau
  const py = mobile ? H * 0.4 - 10 : H * DESKTOP_ROW_CENTER;
  // Trên mobile chỉ còn hàng trên, nên đặt ngay giữa khung
  const rowDy = mobile ? 0 : ROW_GAP * H;
  // Trên desktop, hàng trên được nhích lên thêm một chút; hàng dưới giữ nguyên
  const topY = py - rowDy - (mobile ? 0 : TOP_ROW_LIFT * H);
  const bottomY = py + rowDy + (mobile ? 0 : BOTTOM_ROW_DROP * H);

  const placed: Placed[] = CARDS.map((_, k) => {
    const u = wrap(base[k] - offset, total);
    const top = u < half;
    const xc = top ? x0 + u + cw / 2 : x0 + total - u - cw / 2;
    return { cx: xc, cy: top ? topY : bottomY, top };
  });
  return { placed, cw, total, x0, topY };
}

// Dấu nhấn kiểu từ điển: ký tự ^ đánh dấu âm tiết trọng âm, hiển thị thành dấu ' đỏ đậm
function stressNodes(text: string) {
  return text.split("^").map((seg, j) => (
    <span key={j}>
      {j > 0 && <strong className="font-bold text-[#d62828]">&apos;</strong>}
      {seg}
    </span>
  ));
}

// Chữ trượt lên lần lượt, từng từ một
function RiseText({ text, delay = 0 }: { text: string; delay?: number }) {
  return (
    <>
      {text.split(" ").map((word, i) => (
        <span key={i} className="note-rise inline-block" style={{ animationDelay: `${delay + i * 35}ms` }}>
          {stressNodes(word)}&nbsp;
        </span>
      ))}
    </>
  );
}

// Hai câu mẫu cho mỗi tiêu chí, phần **in đậm** là chữ liên quan trực tiếp tới tiêu chí
const EXAMPLES: Record<string, string[]> = {
  "Tốc độ nói": [
    "I **usually** go running in the park, and it **really** helps me clear my head.",
    "After work, I **often** cook dinner and listen to music, which **keeps** me relaxed.",
  ],
  "Ngắt nghỉ": [
    "That's a good question... **let me think** about it **for a moment**.",
    "Hmm... **give me a second**, I want to **get my thoughts** together.",
  ],
  "Tránh lặp lại": [
    "It's a **great idea**, really **useful** and **inspiring**.",
    "The course was **enjoyable**, **well-organized**, and **worth every minute**.",
  ],
  "Độ dài câu trả lời": [
    "Yes, I **really enjoy it**, mainly because **it helps me unwind** after a busy week.",
    "I **usually** go to the gym, **since** it **gives me** energy and **keeps me** healthy.",
  ],
  "Đúng trọng tâm": [
    "Do you like cooking? **Yes, I do.** I cook at home most evenings because it's relaxing.",
    "Which season do you prefer? **I prefer autumn**, because the weather is cool and pleasant.",
  ],
  "Triển khai ý": [
    "**I prefer cycling.** It keeps me fit, and I can explore new places on weekends.",
    "**I think social media is useful**, because it **connects people**, **although** it can be distracting.",
  ],
  "Từ nối": [
    "**However**, the main drawback is the cost. **Moreover**, it takes a lot of time.",
    "It is cheap. **In addition**, it is convenient. **As a result**, many people use it.",
  ],
  "Từ vựng theo chủ đề": [
    "**Air pollution** is a major concern, especially in crowded cities with **heavy traffic**.",
    "Students need **strong study habits** and **effective time management** to succeed.",
  ],
  "Đúng nghĩa": [
    "It **affects** my mood (động từ), and the **effect** was clear (danh từ).",
    "I **borrowed** a book from the library, but I **lent** my pen to a friend.",
  ],
  Collocations: [
    "**Make a decision**, **take a break**, **do homework**, **have a good time**.",
    "I need to **make an effort**, **pay attention**, and **take responsibility** for my work.",
  ],
  "Cụm động từ": [
    "I always **look up** new words, and I never **give up** on learning.",
    "We need to **cut down on** sugar and **carry on** with our exercise routine.",
  ],
  Paraphrase: [
    "I love music. → **Music is something I'm deeply passionate about.**",
    "The city is noisy. → **The streets are filled with a constant buzz of activity.**",
  ],
  Idiom: [
    "Learning a new language was **a real eye-opener** for me.",
    "He **let the cat out of the bag** when he revealed the surprise party.",
  ],
  "Từ loại": [
    "Her **success** came from hard work, and she **succeeded** by working **consistently**.",
    "The **decision** was **difficult**, and he **decided** to wait **carefully**.",
  ],
  "Câu đơn và câu phức": [
    "I like reading. **Although I'm busy**, I make time to read every night.",
    "I **went to the market**, **and** I **bought fresh vegetables**, **because** I was cooking dinner.",
  ],
  "Mạo từ": [
    "I bought **a** new phone yesterday. **The** phone is great.",
    "**An** apple a day keeps the doctor away. **The** apple was sweet.",
  ],
  "Số ít và số nhiều": [
    "**Many people** enjoy the benefits of exercise, and **each person** has different needs.",
    "The **students** in my class **have** different goals, but **each student** works hard.",
  ],
  "Đa dạng thì": [
    "I **used to** live in a small town, but I've **been living** in the city for five years.",
    "I **have visited** three countries, and I **am planning** a trip to Japan next year.",
  ],
  "So sánh": [
    "This city is **bigger than** my hometown, and the public transport is **much more convenient**.",
    "This is **the most beautiful** place I've ever visited, and it's **as peaceful as** a village.",
  ],
  "Câu bị động": [
    "The bridge **was built** in 1990 and **is now visited** by thousands of tourists each year.",
    "The report **was written** last week and **will be published** next month.",
  ],
  "Câu điều kiện": [
    "**If I had more free time**, I **would take up** painting.",
    "**If it rains tomorrow**, we **will stay** at home.",
  ],
  "Mệnh đề quan hệ": [
    "My best friend, **who lives in Hanoi**, is a talented photographer.",
    "The book **that I borrowed** from you was really interesting.",
  ],
  "Đảo ngữ": [
    "**Never have I seen** such a beautiful sunset.",
    "**Rarely do we** get such a great opportunity.",
  ],
  "Ngữ điệu": [
    "**Are you coming tonight?** (lên giọng) — **I'm staying home.** (xuống giọng)",
    "**Really?** (lên giọng, ngạc nhiên) — **That's great news.** (xuống giọng, khẳng định)",
  ],
  "Phát âm rõ": [
    "Phát âm rõ **/θ/** trong **think**, không thành tink hay fink.",
    "Phát âm rõ **/ð/** trong **this**, không thành dis hay zis.",
  ],
  "Âm cuối": [
    "**books**, **walked**, **cats**: phải nghe rõ đuôi -s, -ed.",
    "**worked**, **missed**, **helped**: đuôi -ed phải được phát âm rõ.",
  ],
  "Nối âm": [
    "**turn it off** nghe như tur-ni-toff; **pick it up** nghe như pi-ki-tup.",
    "**check it out** nghe như che-ki-tout; **an apple** nghe như a-napple.",
  ],
  "Nhóm từ": [
    "**Yesterday** / **I went to the market** / **and bought some fresh vegetables**.",
    "**When I arrived** / **at the office** / **everyone was already working**.",
  ],
  "Trọng âm từ": [
    "**^photograph**, **pho^tography**, **photo^graphic**.",
    "**^record** (danh từ), **re^cord** (động từ).",
  ],
};

// Tách chữ in đậm (đánh dấu bằng **) để hiển thị trong ví dụ
function renderBold(text: string) {
  return text.split(/\*\*(.+?)\*\*/).map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="font-bold text-[#1a1a1a]">
        {stressNodes(part)}
      </strong>
    ) : (
      <span key={i}>{stressNodes(part)}</span>
    )
  );
}

// Nền pastel theo tiêu chí, giống phong cách thẻ mẫu
// Nền nhạt hơn để chữ đen dễ đọc (màu gốc đã pha thêm 50% trắng)
const CRIT_BG: Record<Crit, string> = {
  FC: "#f2effb",
  LR: "#fbecf1",
  GRA: "#f3f5e4",
  PRON: "#f0f3f6",
};

// Nội dung ghi chú của một tiêu chí, animate mỗi khi đổi tab
function NoteContent({ index }: { index: number }) {
  const card = CARDS[index];
  const color = CRIT_COLOR[card.crit];
  return (
    <div className="relative z-10 flex h-full flex-col">
      <style>{`@keyframes note-slide-right { from { opacity: 0; transform: translateX(14px); } to { opacity: 1; transform: none; } } .note-slide-right { opacity: 0; animation: note-slide-right 700ms cubic-bezier(0.22, 1, 0.36, 1) forwards; }`}</style>
      <div className="flex flex-wrap items-center gap-2">
        <span
          className="note-slide-right inline-block w-max rounded-md px-2 py-1 font-mono text-[length:var(--fs-tag)] font-bold uppercase tracking-[0.15em]"
          style={{ backgroundColor: LEVEL_TINT[card.level].bg, color: LEVEL_TINT[card.level].fg }}
        >
          {LEVELS[card.level]}
        </span>
        <span className="note-slide-right font-mono text-[length:var(--fs-tag)] font-bold uppercase tracking-[0.2em]" style={{ color, animationDelay: "120ms" }}>
          {card.crit}
        </span>
      </div>
      <h4 className="note-rise mt-3 text-[length:var(--fs-card)] font-bold md:mt-[0.8vw]" style={{ animationDelay: "240ms" }}>
        {card.title}
      </h4>
      <p className="mt-2 text-[length:var(--fs-text)] leading-snug text-[#1a1a1a] md:mt-[0.5vw]">
        <RiseText text={card.note} delay={200} />
      </p>
      {EXAMPLES[card.title] && (
        <div
          className="note-rise mt-3 text-[length:var(--fs-text)] leading-relaxed text-justify text-[#1a1a1a] md:mt-[0.8vw]"
          style={{ animationDelay: "520ms" }}
        >
          {EXAMPLES[card.title].map((sentence, i) => (
            <p key={i} className="mt-1 italic first:mt-0">
              {renderBold(sentence)}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

// Khối 3D trang trí góc phải, mỗi tiêu chí một khối: FC cầu, LR trụ, GRA lập phương, PRON kim tự tháp.
// Các khối nghiêng về một góc và có vệt sáng để thấy độ bóng.
function NoteDecor({ crit }: { crit: Crit }) {
  const c = CRIT_COLOR[crit];
  const id = `decor-${crit}`;
  let body: React.ReactNode;
  if (crit === "FC") {
    body = (
      <>
        <defs>
          <radialGradient id={id} cx="0.32" cy="0.3" r="0.75">
            <stop offset="0" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="0.35" stopColor={c} stopOpacity="0.55" />
            <stop offset="1" stopColor={c} stopOpacity="0.2" />
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="44" fill={`url(#${id})`} />
      </>
    );
  } else if (crit === "LR") {
    body = (
      <>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor={c} stopOpacity="0.3" />
            <stop offset="0.35" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="0.7" stopColor={c} stopOpacity="0.55" />
            <stop offset="1" stopColor={c} stopOpacity="0.2" />
          </linearGradient>
        </defs>
        <path d="M26 24 L26 84 A24 9 0 0 0 74 84 L74 24 Z" fill={`url(#${id})`} />
        <ellipse cx="50" cy="24" rx="24" ry="9" fill="#ffffff" fillOpacity="0.7" />
      </>
    );
  } else if (crit === "GRA") {
    body = (
      <>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={c} stopOpacity="0.6" />
            <stop offset="1" stopColor={c} stopOpacity="0.25" />
          </linearGradient>
        </defs>
        <defs>
          <filter id={`${id}-blur`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" />
          </filter>
        </defs>
        {/* Bóng đổ phía trước khối */}
        <ellipse cx="46" cy="95" rx="40" ry="5" fill="#000000" fillOpacity="0.35" filter={`url(#${id}-blur)`} />
        <rect x="16" y="40" width="50" height="50" fill={`url(#${id})`} />
        <polygon points="16,40 30,26 80,26 66,40" fill="#ffffff" fillOpacity="0.75" />
        <polygon points="66,40 80,26 80,76 66,90" fill={c} fillOpacity="0.3" />
      </>
    );
  } else {
    body = (
      <>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="1" stopColor={c} stopOpacity="0.35" />
          </linearGradient>
        </defs>
        <polygon points="50,14 12,90 50,72" fill={c} fillOpacity="0.4" />
        <polygon points="50,14 88,90 50,72" fill={`url(#${id})`} />
        <polygon points="12,90 88,90 50,72" fill={c} fillOpacity="0.2" />
      </>
    );
  }
  return (
    <svg
      className="pointer-events-none absolute -right-[12%] -top-[31%] h-[162%] w-[74%]"
      style={{ opacity: 0.36 }}
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      {/* Trụ được phóng to 40% và đẩy sang phải, để thấy mặt tròn phía trên và cạnh bên bị cắt */}
      <g transform={DECOR_TRANSFORM[crit]}>
        {body}
      </g>
    </svg>
  );
}

// Phóng to và đẩy từng khối để thấy mặt trên: trụ (LR), lập phương (GRA), kim tự tháp (PRON)
const DECOR_TRANSFORM: Record<Crit, string | undefined> = {
  FC: "translate(18 18) translate(50 50) scale(0.85) translate(-50 -50)",
  LR: "translate(20 26) translate(50 50) scale(1.4) translate(-50 -50)",
  GRA: "translate(34 12) translate(50 50) scale(1.4) translate(-50 -50)",
  PRON: "translate(20 30) translate(50 50) scale(1.4) translate(-50 -50)",
};

// Khung ghi chú luôn hiện bên phải; khi không tab nào nằm dưới mũi tên thì hiện gợi ý
function NoteCard({ active, index }: { active: boolean; index: number }) {
  const bg = active ? CRIT_BG[CARDS[index].crit] : "#f3f3f1";
  return (
    // Trên máy tính bảng các ghi chú xếp chồng trong cùng một ô lưới, khung cao bằng ghi chú dài nhất và không đổi khi đổi tab
    <div
      className="relative h-auto w-full overflow-hidden rounded-2xl px-5 py-4 transition-colors duration-500 md:h-full md:px-[23px] md:py-[17.5px] md:max-lg:grid"
      style={{ backgroundColor: bg }}
    >
      {/* Hình cầu bóng loáng ở góc phải, hình dạng khác nhau theo tiêu chí */}
      {active && <NoteDecor crit={CARDS[index].crit} />}
      {CARDS.map((_, k) => {
        const on = active && k === index;
        // Ghi chú không được chọn chỉ giữ chỗ trên máy tính bảng; trên các cỡ khác không hiển thị
        // Khóa đổi theo trạng thái để nội dung chạy lại hiệu ứng mỗi khi được chọn
        return (
          <div
            key={`${k}-${on}`}
            className={`md:max-lg:col-start-1 md:max-lg:row-start-1 ${on ? "" : "hidden md:max-lg:block md:max-lg:invisible"}`}
          >
            <NoteContent index={k} />
          </div>
        );
      })}
      <div
        className={`relative z-10 md:max-lg:col-start-1 md:max-lg:row-start-1 ${active ? "hidden md:max-lg:block md:max-lg:invisible" : ""}`}
      >
        <span className="inline-block w-max rounded-md bg-white px-2 py-1 font-mono text-[length:var(--fs-tag)] font-bold uppercase tracking-[0.15em] text-[#9a9a9a]">
          TIP
        </span>
        <p className="mt-3 text-[length:var(--fs-card)] font-bold md:mt-[0.8vw]">Kéo thẻ để xem tip điểm cao.</p>
      </div>
    </div>
  );
}

// Kết cấu giấy: nhiễu fractal xám ấm, vẽ bằng SVG nhúng
const PAPER_TEXTURE =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.45  0 0 0 0 0.4  0 0 0 0 0.33  0 0 0 0.1 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";

// Các góc gấp của tờ giấy note: vị trí, hướng bóng và kích thước xoay vòng theo tab
// Mỗi góc: vị trí, đường cắt góc của tờ giấy, và nửa tam giác là phần giấy được gập lại
const FOLD_CORNERS = [
  {
    pos: "bottom-0 right-0",
    cut: (s: number) => `polygon(0 0, 100% 0, 100% ${100 - s}%, ${100 - s}% 100%, 0 100%)`,
    flap: "polygon(0 0, 100% 0, 0 100%)",
  },
  {
    pos: "bottom-0 left-0",
    cut: (s: number) => `polygon(0 0, 100% 0, 100% 100%, ${s}% 100%, 0 ${100 - s}%)`,
    flap: "polygon(0 0, 100% 0, 100% 100%)",
  },
  {
    pos: "top-0 right-0",
    cut: (s: number) => `polygon(0 0, ${100 - s}% 0, 100% ${s}%, 100% 100%, 0 100%)`,
    flap: "polygon(0 0, 0 100%, 100% 100%)",
  },
  {
    pos: "top-0 left-0",
    cut: (s: number) => `polygon(${s}% 0, 100% 0, 100% 100%, 0 100%, 0 ${s}%)`,
    flap: "polygon(100% 0, 100% 100%, 0 100%)",
  },
];
// Kích thước góc gấp (%), xoay vòng theo tab
const FOLD_PCT = [12, 15, 18];

// Chiều cao của ghim giấy (px)
const PIN_H = 24;
// Khoảng cách cố định từ tâm hàng trên đến hai ghim (px)
const PIN_UP_DESKTOP = 110;
const PIN_DOWN_DESKTOP = 88;
const PIN_UP_MOBILE = 100;
const PIN_DOWN_MOBILE = 80;

// Ghim giấy đỏ: đầu tròn có bóng và mũi kim. flip lật ngược để mũi kim chỉ lên.
function PaperPin({ flip = false }: { flip?: boolean }) {
  return (
    <svg
      width="16"
      height={PIN_H}
      viewBox="0 0 16 24"
      style={{ transform: flip ? "rotate(180deg)" : undefined, filter: "drop-shadow(0 2px 2px rgba(0,0,0,0.25))" }}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id={`pin-head-${flip ? "b" : "t"}`} cx="0.35" cy="0.3" r="0.7">
          <stop offset="0" stopColor="#ffb3b3" />
          <stop offset="0.5" stopColor={MARKER_COLOR} />
          <stop offset="1" stopColor="#8f0d0d" />
        </radialGradient>
      </defs>
      <line x1="8" y1="13" x2="8" y2="23" stroke="#9a9a9a" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="8" cy="7" r="6" fill={`url(#pin-head-${flip ? "b" : "t"})`} />
    </svg>
  );
}

export default function LearningSection() {
  const viewRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<HTMLDivElement>(null);
  const markerBottomRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const linkRefs = useRef<(SVGPathElement | null)[]>([]);
  const dotRefs = useRef<(SVGCircleElement | null)[]>([]);
  const beeRef = useRef<HTMLDivElement>(null);
  // Quãng đã kéo, đơn vị px, không giới hạn
  const offset = useRef(0);
  // Vị trí đích do người dùng kéo; offset đuổi theo giá trị này bằng rAF
  const target = useRef(0);
  const frame = useRef(0);
  const last = useRef(0);
  const drag = useRef({ on: false, x: 0 });
  const activeRef = useRef(-1);
  const [mobile, setMobile] = useState(false);
  const [inView, setInView] = useState(false);
  const [noteIndex, setNoteIndex] = useState(0);
  const [showNote, setShowNote] = useState(false);

  const apply = () => {
    const view = viewRef.current;
    if (!view) return;
    const W = view.clientWidth;
    const H = view.clientHeight;
    const isMobile = window.innerWidth < MOBILE_BP;
    const { placed, cw, topY } = layoutBelt(offset.current, W, H, isMobile);

    placed.forEach((p, k) => {
      const node = cardRefs.current[k];
      if (!node) return;
      const s = p.top ? TOP_SCALE : BOTTOM_SCALE;
      node.style.width = `${cw}px`;
      // Di chuyển bằng transform (không đổi left/top) để trình duyệt chỉ cần composite, không tính lại bố cục
      node.style.transform = `translate3d(${p.cx - cw / 2}px, ${p.cy}px, 0) translateY(-50%) scale(${s})`;
      node.style.opacity = p.top ? "1" : isMobile ? "0" : String(BOTTOM_OPACITY);
    });

    // Dây nối từng cặp thẻ liền kề, kể cả chỗ nối hai hàng và mối khép vòng
    for (let k = 0; k < N; k++) {
      const a = placed[k];
      const b = placed[(k + 1) % N];
      const sa = a.top ? TOP_SCALE : BOTTOM_SCALE;
      const sb = b.top ? TOP_SCALE : BOTTOM_SCALE;
      const ha = (cw / 2) * sa;
      const hb = (cw / 2) * sb;
      const forward = b.cx >= a.cx;
      const x1 = forward ? a.cx + ha : a.cx - ha;
      const x2 = forward ? b.cx - hb : b.cx + hb;
      const y1 = a.cy;
      const y2 = b.cy;
      const dx = Math.max(24, (x2 - x1) * 0.5);
      // Trên mobile ẩn dây nối với hàng dưới
      const hidden = isMobile && (!a.top || !b.top);
      linkRefs.current[k]?.setAttribute("d", hidden ? "" : `M${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`);
      dotRefs.current[k * 2]?.setAttribute("cx", String(x1));
      dotRefs.current[k * 2]?.setAttribute("cy", String(y1));
      dotRefs.current[k * 2 + 1]?.setAttribute("cx", String(x2));
      dotRefs.current[k * 2 + 1]?.setAttribute("cy", String(y2));
    }

    // Mũi tên đỏ đặt phía trên hàng trên; tab hàng trên nào đang nằm dưới nó thì hiện ghi chú
    const markerX = MARKER_X * W;
    let active = -1;
    let best = Infinity;
    placed.forEach((p, k) => {
      if (!p.top) return;
      const d = Math.abs(p.cx - markerX);
      if (d < best) {
        best = d;
        active = k;
      }
    });
    // Hai ghim cố định theo hàng trên, không phụ thuộc vào thẻ đang nằm dưới
    if (best > cw / 2) active = -1;
    const viewTop = view.offsetTop;
    if (markerRef.current) markerRef.current.style.transform = `translate3d(0, ${viewTop + topY - (isMobile ? PIN_UP_MOBILE : PIN_UP_DESKTOP)}px, 0)`;
    if (markerBottomRef.current) markerBottomRef.current.style.transform = `translate3d(0, ${viewTop + topY + (isMobile ? PIN_DOWN_MOBILE : PIN_DOWN_DESKTOP)}px, 0)`;

    if (active !== activeRef.current) {
      activeRef.current = active;
      setShowNote(active >= 0);
      if (active >= 0) setNoteIndex(active);
    }
  };

  // Vòng lặp rAF: đưa offset về target một cách mượt, chỉ chạy khi còn đang trôi hoặc đang kéo
  const tick = (now: number) => {
    const dt = Math.min((now - last.current) / 1000, 0.05);
    last.current = now;
    const goal = target.current;
    const k = drag.current.on ? DRAG_FOLLOW : GLIDE;
    offset.current += (goal - offset.current) * (1 - Math.exp(-k * dt));
    if (Math.abs(goal - offset.current) < SETTLE_PX) offset.current = goal;
    apply();
    const settled = !drag.current.on && offset.current === goal;
    frame.current = settled ? 0 : requestAnimationFrame(tick);
  };

  const kick = () => {
    if (!frame.current) {
      last.current = performance.now();
      frame.current = requestAnimationFrame(tick);
    }
  };

  // Kéo ngang d px: hàng trên đi theo hướng kéo, hàng dưới đi ngược lại
  const moveBy = (dxPx: number) => {
    target.current -= dxPx;
    kick();
  };

  useEffect(() => {
    const media = window.matchMedia(`(max-width: ${MOBILE_BP - 1}px)`);
    // Khi mở trang, đặt thẻ Basic đầu tiên ngay mép trái của hàng trên
    const view = viewRef.current;
    if (view) {
      const { x0 } = layoutBelt(0, view.clientWidth, view.clientHeight, window.innerWidth < MOBILE_BP);
      offset.current = x0;
      target.current = x0;
    }
    const onChange = () => {
      setMobile(media.matches);
      apply();
    };
    const onResize = () => apply();
    onChange();
    media.addEventListener("change", onChange);
    window.addEventListener("resize", onResize);
    return () => {
      media.removeEventListener("change", onChange);
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(frame.current);
      frame.current = 0;
    };
  }, []);

  // Con ong chỉ tiến độ đi qua section: theo vị trí cuộn trong khoảng ghim
  useEffect(() => {
    const update = () => {
      const sec = document.getElementById("learning");
      const bee = beeRef.current;
      if (!sec || !bee) return;
      const range = sec.offsetHeight - window.innerHeight;
      const p = Math.min(1, Math.max(0, -sec.getBoundingClientRect().top / range));
      bee.style.offsetDistance = `${p * 100}%`;
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  // Khi lướt xuống và đỉnh section đang trồi lên từ phía dưới, kéo section vào đúng vị trí ghim.
  // Đợi quán tính cuộn gần dừng rồi mới kéo, để chuyển động không bị giật.
  useEffect(() => {
    let lastY = window.scrollY;
    let timer = 0;
    const lenisRef = () => (window as unknown as { __lenis?: { stop: () => void; start: () => void } }).__lenis;
    const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);
    // Tự tween vị trí cuộn bằng rAF, tạm dừng Lenis trong lúc kéo để hai bên không tranh nhau
    const snap = () => {
      const sec = document.getElementById("learning");
      if (!sec) return;
      const top = sec.getBoundingClientRect().top;
      if (top <= 0 || top > window.innerHeight * 0.8) return;
      const from = window.scrollY;
      const dist = top;
      const start = performance.now();
      const lenis = lenisRef();
      lenis?.stop();
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / 900);
        window.scrollTo(0, from + dist * easeOutQuart(t));
        if (t < 1) requestAnimationFrame(step);
        else lenis?.start();
      };
      requestAnimationFrame(step);
    };
    const onScroll = () => {
      const y = window.scrollY;
      const down = y > lastY;
      lastY = y;
      window.clearTimeout(timer);
      if (!down) return;
      timer = window.setTimeout(snap, 90);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  // Khi chế độ mobile đổi, chiều cao khung đã cập nhật xong sau khi render, nên tính lại vị trí thẻ
  useEffect(() => {
    apply();
  }, [mobile]);

  // Chỉ bật hiệu ứng xuất hiện một lần, khi section đi vào khung nhìn
  useEffect(() => {
    const section = document.getElementById("learning");
    if (!section) return;
    if (!("IntersectionObserver" in window)) {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold: 0, rootMargin: "0px 0px -10% 0px" }
    );
    io.observe(section);
    return () => io.disconnect();
  }, []);

  // Chữ bên trái trượt từ trái vào
  const revealStyle = (delay: number): CSSProperties => ({
    opacity: inView ? 1 : 0,
    transform: inView ? "none" : "translate3d(-32px, 0, 0)",
    transition: `opacity 800ms cubic-bezier(.22,1,.36,1) ${delay}ms, transform 900ms cubic-bezier(.22,1,.36,1) ${delay}ms`,
  });

  // Dây hiện ra ngay sau thẻ đầu của nó, nên lần lượt theo các thẻ
  const linkStyle = (k: number): CSSProperties => ({
    opacity: inView ? 1 : 0,
    transition: `opacity 700ms ease ${(k + 1) * ENTER_STAGGER_MS + 300}ms`,
  });

  // Chỉ bắt đầu kéo khi con trỏ nằm ở nửa trên của khung: hàng dưới không kéo trực tiếp
  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    // Trên desktop chỉ kéo được từ nửa trên; trên mobile chỉ còn hàng trên nên kéo được cả khung
    if (window.innerWidth >= MOBILE_BP && e.clientY - rect.top > rect.height / 2) return;
    drag.current = { on: true, x: e.clientX };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d.on) return;
    const dx = e.clientX - d.x;
    d.x = e.clientX;
    moveBy(dx);
  };

  const onUp = () => {
    drag.current.on = false;
    kick();
  };

  const renderLink = (k: number) => {
    const st = LINK_STYLES[k % LINK_STYLES.length];
    return (
      <g key={k} style={linkStyle(k)}>
        <path
          ref={(node) => {
            linkRefs.current[k] = node;
          }}
          fill="none"
          stroke={st.color}
          strokeWidth={st.width}
          strokeDasharray={st.dash}
          strokeLinecap="round"
        />
        <circle
          ref={(node) => {
            dotRefs.current[k * 2] = node;
          }}
          r="3"
          fill="#ffffff"
          stroke={st.color}
          strokeWidth="1.2"
        />
        <circle
          ref={(node) => {
            dotRefs.current[k * 2 + 1] = node;
          }}
          r="3"
          fill="#ffffff"
          stroke={st.color}
          strokeWidth="1.2"
        />
      </g>
    );
  };

  return (
    <section id="learning" className="relative text-[#1a1a1a]" style={{ height: `${PIN_HEIGHT_VH}vh` }}>
      <div className="sticky top-0 relative flex h-screen flex-col overflow-hidden bg-white py-8 md:py-[4vh]">
        <div className="shrink-0 px-5 md:px-12">
          {/* Cố định chiều cao khối đầu để hai hàng thẻ không bị đẩy khi nội dung ghi chú thay đổi */}
          <div className="grid gap-6 md:h-auto md:grid-cols-1 lg:h-[11.5rem] lg:grid-cols-2 lg:gap-12">
            {/* Bên trái: tiêu đề và mô tả */}
            <div style={revealStyle(0)}>
              <h2 className="font-serif text-[length:var(--fs-title)] italic leading-[1.25] tracking-tight md:leading-[1.3]">
                {HEADLINE}
              </h2>
              <p className="mt-4 text-[length:var(--fs-subtitle)] font-medium leading-snug">{LEFT_HEAD}</p>
              <p className="mt-2 max-w-xl text-[length:var(--fs-text)] leading-relaxed text-justify text-[#1a1a1a]">{LEFT_BODY}</p>
            </div>

            {/* Bên phải: ghi chú hiện khi một tab chạm mũi tên đỏ, cùng hàng với tiêu đề */}
            <NoteCard active={showNote} index={noteIndex} />
          </div>
        </div>

        <div className="relative mt-2 min-h-0 md:flex-1" style={{ height: mobile ? MOBILE_HEIGHT : undefined }}>
          <div
            ref={viewRef}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
            className="relative h-full w-full cursor-grab select-none overflow-hidden"
            style={{ touchAction: "pan-y" }}
          >
            {CARDS.map((cd, k) => {
              const tint = LEVEL_TINT[cd.level];
              const color = CRIT_COLOR[cd.crit];
              return (
                <div
                  key={k}
                  ref={(node) => {
                    cardRefs.current[k] = node;
                  }}
                  className="absolute left-0 top-0 z-10 will-change-transform"
                  style={{ filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.1))" }}
                >
                  <div
                    className="relative flex flex-col rounded-[3px] bg-white p-3 md:p-[1.1vw]"
                    style={{
                      opacity: inView ? 1 : 0,
                      transform: inView ? "none" : `translate3d(0, ${ENTER_OFFSET_Y}px, 0)`,
                      transition: `opacity ${Math.round(ENTER_MS * 0.8)}ms cubic-bezier(.22,1,.36,1) ${k * ENTER_STAGGER_MS}ms, transform ${ENTER_MS}ms cubic-bezier(.22,1,.36,1) ${k * ENTER_STAGGER_MS}ms`,
                      willChange: "transform, opacity",
                      // Cắt góc tờ giấy; bóng đổ được vẽ ở lớp ngoài để không bị cắt theo
                      clipPath: FOLD_CORNERS[k % 4].cut(FOLD_PCT[k % 3]),
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className="min-w-0 break-words rounded px-1 py-0.5 font-mono text-[7.5px] uppercase leading-tight tracking-[0.1em] md:px-1.5 md:text-[0.5vw] md:tracking-[0.2em]"
                        style={{ backgroundColor: tint.bg, color: tint.fg }}
                      >
                        {LEVELS[cd.level].toUpperCase()}
                      </span>
                      <span className="font-mono text-[9px] text-[#9a9a9a] md:text-[0.55vw]">
                        {String(k + 1).padStart(2, "0")}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-col md:mt-[1.6vw]">
                      <h3 className="text-[12.5px] font-bold leading-snug md:text-[0.78vw]">{cd.title}</h3>
                      <p className="mt-1 text-[10px] leading-snug text-[#1a1a1a]/65 md:mt-[0.5vw] md:text-[0.7vw]">{cd.body}</p>
                    </div>

                    <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.1em] text-[#9a9a9a] md:mt-[1vw] md:text-[0.5vw] md:tracking-[0.2em]">
                      <span className="font-bold" style={{ color }}>
                        {cd.crit}
                      </span>{" "}
                      · {EASE_LABEL[cd.ease]}
                    </p>
                    {/* Lớp nhiễu mịn và vài nếp nhăn nhẹ, tạo cảm giác giấy thật */}
                    <div
                      className="pointer-events-none absolute inset-0 rounded-[3px]"
                      style={{ backgroundImage: PAPER_TEXTURE, opacity: 0.3, mixBlendMode: "multiply" }}
                    />
                    <div
                      className="pointer-events-none absolute inset-0 rounded-[3px]"
                      style={{
                        background: `linear-gradient(${(k * 37) % 180}deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.018) 50%, rgba(0,0,0,0) 60%)`,
                      }}
                    />
                    {/* Phần giấy gập lại ở góc đã cắt: một tam giác sáng với bóng nhẹ */}
                    <div
                      className={`pointer-events-none absolute ${FOLD_CORNERS[k % 4].pos}`}
                      style={{
                        width: `${FOLD_PCT[k % 3]}%`,
                        height: `${FOLD_PCT[k % 3]}%`,
                        background: "linear-gradient(135deg, #ffffff 0%, #f5f5f3 60%, #e9e9e6 100%)",
                        clipPath: FOLD_CORNERS[k % 4].flap,
                      }}
                    />
                  </div>
                </div>
              );
            })}

            {/* Dây mắt xích nằm dưới các thẻ, để chỗ giao nhau không chồng lên chữ */}
            <svg className="pointer-events-none absolute inset-0 z-[5] h-full w-full overflow-visible" aria-hidden="true">
              {Array.from({ length: N }, (_, k) => renderLink(k))}
            </svg>
          </div>

          {/* Ghim giấy đỏ cố định ở 45% chiều ngang, nằm ngoài khung dây để không bị cắt */}
          <div
            ref={markerRef}
            className="pointer-events-none absolute left-0 top-0 z-30 -translate-x-1/2 will-change-transform"
            style={{ left: `${MARKER_X * 100}%`, top: 0 }}
          >
            <PaperPin />
          </div>
          <div
            ref={markerBottomRef}
            className="pointer-events-none absolute left-0 top-0 z-30 -translate-x-1/2 will-change-transform"
            style={{ left: `${MARKER_X * 100}%`, top: 0 }}
          >
            <PaperPin flip />
          </div>

          <div
            className="pointer-events-none absolute inset-y-0 left-0 z-40 bg-gradient-to-r from-white to-transparent"
            style={{ width: EDGE_WIDTH }}
          />
          <div
            className="pointer-events-none absolute inset-y-0 right-0 z-40 bg-gradient-to-l from-white to-transparent"
            style={{ width: EDGE_WIDTH }}
          />
        </div>

        {/* Con ong chỉ tiến độ cuộn, nằm dưới cùng section như phần transition story */}
        <div className="pointer-events-none absolute bottom-6 left-1/2 hidden -translate-x-1/2 md:block">
          <ScrollBee beeRef={beeRef} />
        </div>
      </div>
    </section>
  );
}
