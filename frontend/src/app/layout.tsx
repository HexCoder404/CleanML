import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SessionCleanupManager from "./components/SessionCleanupManager";
import SupabaseAuthProvider from "./components/SupabaseAuthProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RefineML - Premium Data Preprocessing & Cleaning",
  description: "Clean, visualize, and preprocess your datasets with RefineML - the modern, high-performance data cleaning pipeline.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SupabaseAuthProvider>
          <SessionCleanupManager />
          {children}
        </SupabaseAuthProvider>
      </body>
    </html>
  );
}
