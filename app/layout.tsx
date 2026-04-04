import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WatchParty — Watch Together, Perfectly in Sync",
  description:
    "Create a room, share the link, and watch videos together with perfectly synced playback. Supports YouTube, HLS streams, and more.",
  metadataBase: new URL("https://watchparty-coral.vercel.app"),
  openGraph: {
    title: "WatchParty — Watch Together, Perfectly in Sync",
    description:
      "Create a room, share the link, and watch videos together with perfectly synced playback.",
    siteName: "WatchParty",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "WatchParty — Watch Together, Perfectly in Sync",
    description:
      "Create a room, share the link, and watch videos together with perfectly synced playback.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.2),_transparent_40%),linear-gradient(180deg,_#09090b_0%,_#020617_100%)] text-white flex flex-col">
        {children}
      </body>
    </html>
  );
}
