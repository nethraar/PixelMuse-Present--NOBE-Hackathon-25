import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const geist = Inter({ subsets: ["latin"], variable: "--font-geist" });

export const metadata: Metadata = {
  title: "PixelMuse Present",
  description: "AI literacy trainer for student presentations",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} h-full`}>
      <body className="h-full antialiased" style={{ background: '#f1f3f4', color: '#202124' }}>{children}</body>
    </html>
  );
}
