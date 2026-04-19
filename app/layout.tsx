import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Script from "next/script";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });

export const metadata: Metadata = {
  title: "PixelMuse Present",
  description: "AI literacy trainer for student presentations",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} h-full`}>
      <head>
        <Script src="https://js.puter.com/v2/" strategy="beforeInteractive" />
      </head>
      <body className="h-full bg-gray-950 text-white antialiased">{children}</body>
    </html>
  );
}
