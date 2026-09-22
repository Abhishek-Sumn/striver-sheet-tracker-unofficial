import type { Metadata } from "next";
import "./globals.css";
import { AttributionBanner } from "../components/AttributionBanner";

export const metadata: Metadata = {
  title: "Unofficial Striver A2Z & SDE Sheet Tracker",
  description:
    "Unofficial, free progress tracker for Striver's A2Z and SDE DSA sheets with LeetCode links. Not affiliated with takeUforward.",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='20' fill='%2318181b'/><text x='50%' y='55%' dominant-baseline='middle' text-anchor='middle' font-size='50' font-family='sans-serif' font-weight='bold' fill='%23f97316'>D</text></svg>",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body className="bg-zinc-950 text-zinc-100 antialiased selection:bg-zinc-700 selection:text-zinc-100 min-h-screen">
        <div className="flex min-h-screen flex-col">
          <AttributionBanner />
          {children}
        </div>
      </body>
    </html>
  );
}
