import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "AG Wuse - Assemblies of God Church, Wuse Zone 5, Abuja",
    template: "%s | AG Wuse",
  },
  description:
    "Welcome to Assemblies of God Church, Wuse Zone 5, Abuja — Center of Love and Worship. Join us for worship, fellowship, and spiritual growth.",
  keywords: [
    "Assemblies of God",
    "AG Wuse",
    "Church Abuja",
    "Wuse Zone 5",
    "Pentecostal Church",
    "AG Nigeria",
  ],
  openGraph: {
    type: "website",
    locale: "en_NG",
    siteName: "AG Wuse Church",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <TooltipProvider>
          {children}
          <Toaster richColors position="top-right" />
        </TooltipProvider>
      </body>
    </html>
  );
}
