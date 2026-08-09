import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NewEpiBot",
  description: "Discord anime and manga release tracker and notification dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}