"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type ThemeMode = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

interface ThemeContextValue {
  theme: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemeMode) => void;
}

const THEME_STORAGE_KEY = "theme";
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") {
    return "light";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function getStoredTheme(): ThemeMode {
  if (typeof window === "undefined") {
    return "system";
  }

  const storedTheme = window.localStorage.getItem(
    THEME_STORAGE_KEY,
  ) as ThemeMode | null;

  if (
    storedTheme === "light" ||
    storedTheme === "dark" ||
    storedTheme === "system"
  ) {
    return storedTheme;
  }

  return "system";
}

function applyTheme(resolvedTheme: ResolvedTheme): void {
  const root = document.documentElement;
  root.setAttribute("data-theme", resolvedTheme);
  root.style.colorScheme = resolvedTheme;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(() => getStoredTheme());
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => {
    const initialTheme = getStoredTheme();
    return initialTheme === "system" ? getSystemTheme() : initialTheme;
  });

  useEffect(() => {
    applyTheme(resolvedTheme);

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleMediaChange = () => {
      if (theme !== "system") {
        return;
      }

      const systemTheme = getSystemTheme();
      setResolvedTheme(systemTheme);
      applyTheme(systemTheme);
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== THEME_STORAGE_KEY) {
        return;
      }

      const storedTheme = getStoredTheme();
      const nextResolvedTheme =
        storedTheme === "system" ? getSystemTheme() : storedTheme;

      setThemeState(storedTheme);
      setResolvedTheme(nextResolvedTheme);
      applyTheme(nextResolvedTheme);
    };

    mediaQuery.addEventListener("change", handleMediaChange);
    window.addEventListener("storage", handleStorage);

    return () => {
      mediaQuery.removeEventListener("change", handleMediaChange);
      window.removeEventListener("storage", handleStorage);
    };
  }, [resolvedTheme, theme]);

  const setTheme = (nextTheme: ThemeMode) => {
    const nextResolvedTheme =
      nextTheme === "system" ? getSystemTheme() : nextTheme;

    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    setThemeState(nextTheme);
    setResolvedTheme(nextResolvedTheme);
    applyTheme(nextResolvedTheme);
  };

  const contextValue = useMemo<ThemeContextValue>(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
    }),
    [resolvedTheme, theme],
  );

  return (
    <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }

  return context;
}
