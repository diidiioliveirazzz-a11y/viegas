"use client";

import { useTheme } from "@/context/ThemeContext";

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`relative group flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-300 border ${
        isDark
          ? "bg-zinc-900 border-red-900/60 hover:border-red-500 hover:shadow-[0_0_15px_rgba(239,68,68,0.3)] text-red-400"
          : "bg-white border-rose-200 hover:border-red-400 hover:shadow-[0_0_15px_rgba(225,29,72,0.2)] text-red-600 shadow-sm"
      } ${className}`}
      aria-label={isDark ? "Mudar para Modo Claro" : "Mudar para Modo Escuro"}
      title={isDark ? "Mudar para modo claro" : "Mudar para modo escuro"}
    >
      <div className="relative w-5 h-5 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
        {isDark ? (
          <svg
            className="w-4 h-4 fill-red-400 text-red-400 transition-all duration-300 animate-in fade-in zoom-in-75"
            viewBox="0 0 24 24"
          >
            <path d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
          </svg>
        ) : (
          <svg
            className="w-4 h-4 text-red-600 fill-red-600 transition-all duration-300 animate-in fade-in zoom-in-75"
            viewBox="0 0 24 24"
          >
            <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" />
          </svg>
        )}
      </div>
    </button>
  );
}
