
"use client";

import LogoutButton from "./LogoutButton";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useRouteXTheme } from "./ThemeProvider";

export default function Navigation() {
  const pathname = usePathname();

  const { theme, setTheme } = useRouteXTheme();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isPassenger, setIsPassenger] = useState(false);
  const [isDriver, setIsDriver] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [systemDark, setSystemDark] = useState(false);

  useEffect(() => {
    const admin = Boolean(localStorage.getItem("user"));
    const passenger = Boolean(localStorage.getItem("passenger"));
    const driver = Boolean(localStorage.getItem("driver"));

    setIsAdmin(admin);
    setIsPassenger(passenger);
    setIsDriver(driver);
    setIsLoggedIn(admin || passenger || driver);
  }, [pathname]);

  useEffect(() => {
    const media = window.matchMedia(
      "(prefers-color-scheme: dark)"
    );

    const update = () => setSystemDark(media.matches);

    update();
    media.addEventListener("change", update);

    return () => media.removeEventListener("change", update);
  }, []);

  const isDark =
    theme === "dark" ||
    (theme === "system" && systemDark);

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  const hiddenRoutes = [
    "/",
    "/login",
    "/driver-login",
    "/passenger-login",
    "/passenger-register",
  ];

  if (hiddenRoutes.includes(pathname)) {
    return null;
  }

  const navLink =
    "inline-flex shrink-0 items-center justify-center " +
    "rounded-full px-4 py-2.5 text-[11px] font-bold " +
    "text-[#17191f] dark:text-[#f4f4f6] " +
    "bg-[#f0f1f5] dark:bg-[#22242d] " +
    "shadow-[4px_4px_9px_rgba(0,0,0,0.10),-4px_-4px_9px_rgba(255,255,255,0.95)] " +
    "dark:shadow-[4px_4px_10px_rgba(0,0,0,0.5),-3px_-3px_9px_rgba(255,255,255,0.04)] " +
    "hover:text-[#ff6846] active:scale-95 transition-all";

  return (
    <nav className="relative z-30 border-b border-black/5 bg-[#e9ebf1] dark:border-white/10 dark:bg-[#15171e]">
      <div className="mx-auto flex min-h-[70px] w-full max-w-md items-center justify-between gap-3 px-5 py-3">

        {/* LEFT NAVIGATION */}
        <div className="flex min-w-0 items-center gap-2 overflow-x-auto py-1">

          {isAdmin && (
            <>
              <a href="/" className={navLink}>
                Dashboard
              </a>

              <a href="/trips" className={navLink}>
                Trips
              </a>

              <a href="/trips/new" className={navLink}>
                New Trip
              </a>

              <a href="/passengers" className={navLink}>
                Passengers
              </a>

              <a href="/vehicles" className={navLink}>
                Vehicles
              </a>

              <a href="/drivers" className={navLink}>
                Drivers
              </a>

              <a href="/bookings" className={navLink}>
                New Booking
              </a>
            </>
          )}

          {isPassenger && !isAdmin && (
            <a href="/passenger-portal" className={navLink}>
              Home
            </a>
          )}
        </div>

        {/* RIGHT CONTROLS */}
        <div className="flex shrink-0 items-center gap-3">

          {/* THEME SWITCH */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={
              isDark
                ? "Switch to light mode"
                : "Switch to dark mode"
            }
            title={
              isDark
                ? "Light mode"
                : "Dark mode"
            }
            className="
              flex h-10 w-10 items-center justify-center
              rounded-full
              bg-[#e9ebf1] text-[#17191f]
              dark:bg-[#22242d] dark:text-[#ff6846]
              shadow-[4px_4px_9px_rgba(0,0,0,0.12),-4px_-4px_9px_rgba(255,255,255,0.95)]
              dark:shadow-[4px_4px_10px_rgba(0,0,0,0.5),-3px_-3px_9px_rgba(255,255,255,0.05)]
              transition-all duration-200
              hover:text-[#ff6846]
              active:scale-90
            "
          >
            {isDark ? (
              <svg
                width="19"
                height="19"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42" />
              </svg>
            ) : (
              <svg
                width="19"
                height="19"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z" />
              </svg>
            )}
          </button>

          {/* EXISTING LOGOUT */}
          {isLoggedIn && (
            <div className="text-[11px] font-bold dark:text-white">
              <LogoutButton />
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
