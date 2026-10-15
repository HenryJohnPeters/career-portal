import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import { readStorage, writeStorage } from "./storage";

export type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

/** Same key and logic as public/theme-init.js, which applies the theme before first paint. */
const STORAGE_KEY = "theme";
const DARK_QUERY = "(prefers-color-scheme: dark)";

export function parseTheme(value: unknown): Theme | null {
  return value === "light" || value === "dark" ? value : null;
}

function systemTheme(): Theme {
  try {
    return window.matchMedia(DARK_QUERY).matches ? "dark" : "light";
  } catch {
    return "light";
  }
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // An explicit choice wins; otherwise follow the OS setting, including live changes.
  const [chosen, setChosen] = useState<Theme | null>(() =>
    parseTheme(readStorage(STORAGE_KEY)),
  );
  const [system, setSystem] = useState<Theme>(systemTheme);
  const theme = chosen ?? system;

  useEffect(() => {
    let media: MediaQueryList;
    try {
      media = window.matchMedia(DARK_QUERY);
    } catch {
      return;
    }
    const onChange = (event: MediaQueryListEvent) =>
      setSystem(event.matches ? "dark" : "light");
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useLayoutEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.style.colorScheme = theme;
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    setChosen(next);
    writeStorage(STORAGE_KEY, next);
  }, []);

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
