import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Music",
  description: "See what I'm listening to, and make me a music recommendation.",
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
