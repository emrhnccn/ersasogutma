import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/context/StoreContext";
import { MainLayout } from "@/components/layout/MainLayout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "Ersa Soğutma B2B Bayi Portalı | ersasogutma.com.tr",
  description: "Ersa Soğutma Isıtma San. ve Tic. Ltd. Şti. Resmi B2B Bayi ve Toptan Satış Portalı. Kompresörler, Soğutucu Gazlar, Fan Motorları ve Servis Ekipmanları.",
  keywords: "ersa soğutma, b2b bayi portalı, soğutma sistemleri, embraco kompresör, danfoss, r134a gaz, r404a, fan motoru, soğuk hava deposu",
  authors: [{ name: "Ersa Soğutma" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="dark scroll-smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-950 text-slate-100 min-h-screen flex flex-col`}
      >
        <StoreProvider>
          <MainLayout>{children}</MainLayout>
        </StoreProvider>
      </body>
    </html>
  );
}
