"use client";

import React, { createContext, useContext, useEffect, useSyncExternalStore } from "react";

type Theme = "dark" | "light";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function getThemeSnapshot(): Theme {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

function getServerThemeSnapshot(): Theme {
  return "dark";
}

function subscribeToTheme(onChange: () => void) {
  window.addEventListener("viegas-theme-change", onChange);
  return () => window.removeEventListener("viegas-theme-change", onChange);
}

function applyTheme(newTheme: Theme) {
  const root = document.documentElement;
  localStorage.setItem("viegas-theme", newTheme);
  root.classList.toggle("dark", newTheme === "dark");
  root.classList.toggle("light", newTheme === "light");
  root.setAttribute("data-theme", newTheme);
  root.style.colorScheme = newTheme;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", newTheme === "dark" ? "#090909" : "#fffafb");
  window.dispatchEvent(new Event("viegas-theme-change"));
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(subscribeToTheme, getThemeSnapshot, getServerThemeSnapshot);

  useEffect(() => {
    const savedTheme = localStorage.getItem("viegas-theme") as Theme | null;
    const initialTheme: Theme = savedTheme === "light" ? "light" : "dark";
    applyTheme(initialTheme);
  }, []);

  const setTheme = (newTheme: Theme) => {
    applyTheme(newTheme);
  };

  const toggleTheme = () => {
    const nextTheme: Theme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme deve ser usado dentro de um ThemeProvider");
  }
  return context;
}
