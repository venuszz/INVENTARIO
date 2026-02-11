import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import HeaderContainer from "@/components/HeaderContainer";
import { SpeedInsights } from '@vercel/speed-insights/next';
import { ThemeProvider } from "@/context/ThemeContext";
import IndexationPopover from "@/components/IndexationPopover";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "INVENTARIO | INICIO",
  description: "Software de Gestión de Inventario @by Antony",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col h-screen`}
      >
        <ThemeProvider>
          <div className="header-container">
            <HeaderContainer />
          </div>
          <main className="flex-1 overflow-hidden">
            {children}
            <SpeedInsights />
          </main>
          <div className="indexation-popover-container">
            <IndexationPopover />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
