import type { Metadata } from "next";
import { Geist_Mono, Newsreader, IBM_Plex_Sans } from "next/font/google";
import ClientProviders from "@/components/providers/ClientProviders";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "CareKaki — Your care buddy that knows where to start",
  description:
    "An agentic Care Navigator that turns Singapore's fragmented community-care system into a single, personalised plan — built through conversation, not forms.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${plexSans.variable} ${geistMono.variable} ${newsreader.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-cream text-ink text-lg">
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
