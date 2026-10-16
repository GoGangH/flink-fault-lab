import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_KR, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const plex = IBM_Plex_Sans_KR({
  variable: "--font-plex",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
});

const mono = JetBrains_Mono({
  variable: "--font-jb",
  weight: ["400", "600"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Flink 장애 복구 랩",
  description:
    "TaskManager 장애 복구, Checkpoint 기반 State 복원, Restart Strategy, Exactly-once를 직접 장애를 주입하며 살펴보는 발표 자료",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${plex.variable} ${mono.variable}`}>
      <body className="font-sans text-base leading-relaxed antialiased">{children}</body>
    </html>
  );
}
