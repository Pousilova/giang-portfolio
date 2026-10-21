import type { Metadata } from "next";
import { appFont } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Giang",
  description: "Portfolio của Giang",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={appFont.variable}>
      <body className="bg-white font-sans antialiased">{children}</body>
    </html>
  );
}