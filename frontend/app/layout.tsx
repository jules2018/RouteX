
import ServiceWorker from "./components/ServiceWorker";
import type { Metadata } from "next";
import { Geist, Geist_Mono, Outfit } from "next/font/google";
import "./globals.css";
import Navigation from "./components/Navigation";
import NotificationPermission from "./components/NotificationPermission";
import { ThemeProvider } from "./components/ThemeProvider";

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

// Apply the saved theme before the page is painted.
const themeScript = `
(function () {
  try {
    var savedTheme = localStorage.getItem("routex-theme") || "system";

    var prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;

    var isDark =
      savedTheme === "dark" ||
      (savedTheme === "system" && prefersDark);

    document.documentElement.classList.toggle("dark", isDark);
  } catch (error) {
    var prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;

    document.documentElement.classList.toggle(
      "dark",
      prefersDark
    );
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.className} ${geistSans.variable} ${geistMono.variable} antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: themeScript,
          }}
        />
      </head>

      <body>
        <ThemeProvider>
          <NotificationPermission />
          <ServiceWorker />
          <Navigation />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
