import type { Metadata } from "next";
import "./globals.css";
import { APP_NAME, APP_SUBTITLE } from "@/lib/constants";

export const metadata: Metadata = {
  title: `${APP_NAME} — Enterprise Crisis Command Network`,
  description: APP_SUBTITLE,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
