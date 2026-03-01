import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { NavigationPixie } from "@/components/NavigationPixie";

export const metadata: Metadata = {
  title: "Serrian Tide",
  description: "Enter your imagination.",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="theme-void">
      <body suppressHydrationWarning>
        <ThemeProvider>
          {children}
          <NavigationPixie />
        </ThemeProvider>
      </body>
    </html>
  );
}
