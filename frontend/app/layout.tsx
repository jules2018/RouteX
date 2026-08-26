import ServiceWorker from "./components/ServiceWorker";
import type { Metadata } from "next";
import { Geist, Geist_Mono, Outfit } from "next/font/google";
import "./globals.css";
import Navigation from "./components/Navigation";
import InstallBanner from "./components/InstallBanner";
import FirebaseTest from "./components/FirebaseTest";

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
  title: "RouteX",
  description: "Getting Upington Moving",
  manifest: "/manifest.json",
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
  <FirebaseTest />
  <ServiceWorker />
  <InstallBanner />
  <Navigation />
  {children}
</body>

    </html>
  );
}