import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Aurora } from "@/components/aurora";
import { SiteNav } from "@/components/site-nav";
import { themeScript } from "@/lib/theme-script";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Grammaid — AI story analysis for writers",
  description:
    "Sign in, create a project, paste or upload your manuscript, and get a full craft breakdown: structure, characters, pacing, dialogue, prose, and more.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>
          <Aurora />
          <SiteNav />
          <main className="mx-auto w-full max-w-7xl px-4 pb-20 pt-6 sm:px-6">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
