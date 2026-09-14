import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CEEM MADANEEYAM OFFICE | Office Management & Communication System",
  description:
    "Production multi-office employee management, geofenced attendance, and real-time team communication system for CEEM Madaneeyam E-Learning.",
  icons: {
    icon: "/brand/logo_en.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans">
        {children}
      </body>
    </html>
  );
}
