import { Outfit } from "next/font/google";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import LogoutButton from "./components/LogoutButton";
import Navigation from "./components/Navigation";
import { Playfair_Display } from "next/font/google";

const outfit = Outfit({
  subsets: ["latin"],
});
export const playfair = Playfair_Display({
  subsets: ["latin"],
});
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Transport SaaS",
  description: "Transport Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className={outfit.className}>
        <Navigation />
        {children}
      </body>
    </html>
  );
}
