import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "交流ビンゴ",
  description: "イベント参加者同士が交流しながらビンゴを完成させるゲーム",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
