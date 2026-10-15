
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import type { ReactNode } from "react";

type Theme = "light" | "dark" | "system";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [theme, setThemeState] = useState<Theme>("system");

  // Read saved preference after mounting.
  useEffect(() => {
    const saved = localStorage.getItem("routex-theme");

    if (
      saved === "light" ||
      saved === "dark" ||
      saved === "system"
    ) {
      setThemeState(saved);
    }
  }, []);

  // Apply theme and listen for system changes.
  useEffect(() => {
    const media = window.matchMedia(
      "(prefers-color-scheme: dark)"
    );

    const applyTheme = () => {
      const saved = localStorage.getItem("routex-theme");

      const selectedTheme =
        saved === "light" ||
        saved === "dark" ||
        saved === "system"
          ? saved
          : theme;

      const isDark =
        selectedTheme === "dark" ||
        (selectedTheme === "system" && media.matches);

      document.documentElement.classList.toggle(
        "dark",
        isDark
      );
    };

    applyTheme();

    media.addEventListener("change", applyTheme);

    return () => {
      media.removeEventListener("change", applyTheme);
    };
  }, [theme]);

  const setTheme = (value: Theme) => {
    localStorage.setItem("routex-theme", value);

    document.documentElement.classList.toggle(
      "dark",
      value === "dark" ||
        (value === "system" &&
          window.matchMedia("(prefers-color-scheme: dark)").matches)
    );

    setThemeState(value);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useRouteXTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error(
      "useRouteXTheme must be used inside ThemeProvider"
    );
  }

  return context;
}
