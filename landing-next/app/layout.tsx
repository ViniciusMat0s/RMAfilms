import type { Metadata } from "next";
import { Bodoni_Moda, Manrope } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const headingFont = Bodoni_Moda({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-heading",
});

const bodyFont = Manrope({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-body",
});

const aventaFont = localFont({
  src: "../public/fonts/Aventa-Light.otf",
  weight: "300",
  display: "swap",
  variable: "--font-aventa",
});

const bierikaFont = localFont({
  src: "../public/fonts/bierika.otf",
  weight: "400",
  display: "swap",
  variable: "--font-bierika",
});

export const metadata: Metadata = {
  title: "Lumen Atelier | Editorial Landing Craft",
  description:
    "Award level landing experiences with cinematic motion, refined layouts, and scroll storytelling.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${bodyFont.variable} ${headingFont.variable} ${aventaFont.variable} ${bierikaFont.variable}`}
      >
        {children}
      </body>
    </html>
  );
}
