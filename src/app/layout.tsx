import { JetBrains_Mono, Space_Grotesk, Orbitron } from "next/font/google";
import type { Metadata } from "next";
import "./globals.css";
import { APP_NAME, APP_SUBTITLE } from "@/lib/constants";
import { Providers } from "@/providers/Providers";

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: `${APP_NAME} — Enterprise Crisis Command Network`,
  description: APP_SUBTITLE,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${jetbrains.variable} ${spaceGrotesk.variable} ${orbitron.variable}`}>
      <body className="h-full overflow-hidden font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
