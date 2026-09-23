import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { PwaRegister } from "@/components/pwa/pwa-register";
import { InstallPrompt } from "@/components/pwa/install-prompt";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });
const display = Space_Grotesk({ subsets: ["latin"], variable: "--font-display" });

export const metadata: Metadata = {
  title: "RunTheMic — Karaoke Nights, Effortlessly",
  description:
    "Create a karaoke night in minutes: a stunning flyer, one shareable link, RSVPs, and a collaborative YouTube song queue you run from your phone.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/icons/icon-192.png",
  },
  verification: {
    google: "3l5rg-FhVVy-khDvthzPWFVx1tu3EnsUzFXoS8z4Cx4",
  },
};

export const viewport: Viewport = {
  themeColor: "#0d0620",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" className={`${sans.variable} ${display.variable}`}>
      <body className="min-h-dvh font-sans antialiased">
        <Providers>{children}</Providers>
        <PwaRegister />
        <InstallPrompt />
      </body>
    </html>
  );
}
