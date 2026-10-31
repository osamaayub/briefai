import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BriefAI: turn messy notes into clear action items",
  description: "An AI SaaS starter built with Next.js, Drizzle, libSQL and OpenAI.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans">{children}</body>
    </html>
  );
}
