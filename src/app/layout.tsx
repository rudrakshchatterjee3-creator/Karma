import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono, Outfit } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Karma | Carbon Emissions Tracker",
  description:
    "A storytelling-based carbon emissions tracker that helps people understand, track, and reduce their footprint through practical daily actions.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Karma"
  }
};

export const viewport = {
  themeColor: "#0B0F14",
};

import { Providers } from "./providers";
import { Toaster } from "sonner";

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${outfit.variable} h-[100dvh] antialiased`}
    >
      <body className="min-h-[100dvh] flex flex-col">
        <Providers>
          {children}
          <Toaster position="bottom-center" theme="dark" />
        </Providers>
      </body>
    </html>
  );
}
