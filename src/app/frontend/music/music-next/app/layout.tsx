import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#1a1a1a",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://music.mariolopez.org"),
  title: "Mario's Listening History (Next)",
  description:
    "Track music habits and discover recommendations. Built with Next.js, featuring Apple Music and Spotify integration.",
  keywords: [
    "music",
    "Apple Music",
    "Spotify",
    "music tracking",
    "Next.js",
    "music history",
  ],
  authors: [{ name: "Mario Lopez Martinez" }],
  openGraph: {
    type: "website",
    url: "https://music.mariolopez.org/next",
    title: "Mario's Listening History (Next)",
    description:
      "Track music habits and discover recommendations. Built with Next.js, featuring Apple Music and Spotify integration.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mario's Listening History (Next)",
    description:
      "Track music habits and discover recommendations. Built with Next.js, featuring Apple Music and Spotify integration.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
