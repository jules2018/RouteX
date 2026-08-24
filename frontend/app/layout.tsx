
import type { Metadata } from "next";
import { Geist, Geist_Mono, Outfit } from "next/font/google";
import "./globals.css";
import LogoutButton from "./components/LogoutButton";
import Navigation from "./components/Navigation";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});
const outfit = Outfit({
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
      className={`${outfit.className} antialiased`}
    >
      <body>
  <Navigation />
  {children}
</body>
    </html>
  );
}
