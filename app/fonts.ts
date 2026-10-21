import { Inter } from "next/font/google";

// Font toàn hệ thống. Đổi font: thay Inter bằng font khác, rồi giữ nguyên các biến bên dưới.
export const appFont = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-app",
  display: "swap",
  style: ["normal", "italic"],
});