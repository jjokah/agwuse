import type { Metadata } from "next";
import { Outfit, Playfair_Display } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-sans",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-serif",
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
        className={`${outfit.variable} ${playfair.variable} font-sans antialiased`}
      >
        <TooltipProvider>
          {children}
          <Toaster richColors position="top-right" />
        </TooltipProvider>
      </body>
    </html>
  );
}
