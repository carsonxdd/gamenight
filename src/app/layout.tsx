import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SessionProvider from "@/components/providers/SessionProvider";
import SiteSettingsProvider from "@/components/providers/SiteSettingsProvider";
import PageTransition from "@/components/providers/PageTransition";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { getSiteSettings } from "@/app/admin/settings-actions";
import { hexToRgb, darkenHex } from "@/lib/settings-constants";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    title: settings.communityName || "Game Night",
    description: settings.communityTagline || "Weekly PC gaming sessions with the squad",
    ...(settings.faviconUrl && {
      icons: { icon: settings.faviconUrl },
    }),
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSiteSettings();

  // Pre-compute accent color CSS vars so they're in the initial HTML (no FOUC)
  const hex = settings.accentColor || "#00ff41";
  const [r, g, b] = hexToRgb(hex);
  const accentStyle = {
    "--accent-color": hex,
    "--accent-dim": darkenHex(hex, 0.2),
    "--accent-dark": darkenHex(hex, 0.4),
    "--neon-rgb": `${r}, ${g}, ${b}`,
  } as React.CSSProperties;

  return (
    <html lang="en" className="dark" style={accentStyle}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background text-foreground`}
      >
        <SessionProvider>
          <SiteSettingsProvider settings={settings}>
            <Navbar />
            <main className="pt-16">
              <PageTransition>{children}</PageTransition>
            </main>
            <Footer />
          </SiteSettingsProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
