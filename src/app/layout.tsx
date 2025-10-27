import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import HeaderContainer from "@/components/HeaderContainer";
import { SpeedInsights } from '@vercel/speed-insights/next';
import { ThemeProvider } from "@/context/ThemeContext";
import { IneaIndexationProvider } from "@/context/IneaIndexationContext";
import { IteaIndexationProvider } from "@/context/IteaIndexationContext";
import { IneaObsoletosIndexationProvider } from "@/context/IneaObsoletosIndexationContext";
import { IteaObsoletosIndexationProvider } from "@/context/IteaObsoletosIndexationContext";
import { ResguardosIndexationProvider } from "@/context/ResguardosIndexationContext";
import { ResguardosBajasIndexationProvider } from "@/context/ResguardosBajasIndexationContext";
import { InactivityProvider } from "@/context/InactivityContext";
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
          <InactivityProvider>
            <IneaIndexationProvider>
              <IteaIndexationProvider>
                <IneaObsoletosIndexationProvider>
                  <IteaObsoletosIndexationProvider>
                    <ResguardosIndexationProvider>
                      <ResguardosBajasIndexationProvider>
                        <div>
                          <HeaderContainer />
                        </div>
                        <main className="flex-1 overflow-hidden">
                          {children}
                          <SpeedInsights />
                        </main>
                        <IndexationPopover />
                      </ResguardosBajasIndexationProvider>
                    </ResguardosIndexationProvider>
                  </IteaObsoletosIndexationProvider>
                </IneaObsoletosIndexationProvider>
              </IteaIndexationProvider>
            </IneaIndexationProvider>
          </InactivityProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}