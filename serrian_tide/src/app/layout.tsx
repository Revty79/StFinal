import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Serrian Tide",
  description: "Enter your imagination.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // Theme flips by swapping this class later (theme-void | theme-parchment)
    <html lang="en" className="theme-void">
      <body>{children}</body>
    </html>
  );
}
