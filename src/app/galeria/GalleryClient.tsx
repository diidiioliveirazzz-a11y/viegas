"use client";

import { useState } from "react";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";

interface HairStyleItem {
  id: string;
  title: string;
  category: string;
  description: string | null;
  imageUrl: string;
  likes: number;
}

export default function GalleryClient({ styles }: { styles: HairStyleItem[] }) {
  const [selectedCategory, setSelectedCategory] = useState<string>("Todos");
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const categories = [
    "Todos",
    "Low Fade",
    "Mid Fade",
    "High Fade",
    "Taper Fade",
    "Textured Crop",
    "Slick Back",
    "Mullet",
  ];

  const filteredStyles =
    selectedCategory === "Todos"
      ? styles
      : styles.filter((s) => s.category.toLowerCase().includes(selectedCategory.toLowerCase()));

  return (
    <div>
      {/* Category Pills */}
      <div className="flex gap-2 overflow-x-auto pb-6 scrollbar-none mb-8">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              selectedCategory === cat
                ? isDark
                  ? "bg-sky-400 text-zinc-950 shadow-lg shadow-sky-400/20"
                  : "bg-gradient-to-r from-purple-500 via-pink-500 to-sky-400 text-white shadow-md shadow-pink-500/20"
                : isDark
                ? "bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white hover:border-zinc-700"
                : "bg-white text-slate-600 border border-slate-200 hover:text-slate-900 hover:border-slate-300"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid of Styles */}
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
        {filteredStyles.map((item) => (
          <div
            key={item.id}
            className={`group rounded-2xl overflow-hidden border transition flex flex-col justify-between shadow-sm ${
              isDark
                ? "bg-zinc-900 border-zinc-800 hover:border-sky-400/50"
                : "bg-white border-slate-200 hover:border-pink-300"
            }`}
          >
            <div>
              <div className="h-72 overflow-hidden relative bg-black/40">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
                <div
                  className={`absolute top-3 left-3 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold border ${
                    isDark
                      ? "bg-zinc-950/85 text-sky-400 border-zinc-800"
                      : "bg-white/90 text-pink-600 border-pink-200"
                  }`}
                >
                  {item.category}
                </div>
              </div>
              <div className="p-5">
                <h3 className="font-bold text-lg mb-1">{item.title}</h3>
                <p className={`text-xs leading-relaxed mb-4 ${isDark ? "text-zinc-400" : "text-slate-600"}`}>
                  {item.description}
                </p>
              </div>
            </div>

            <div className="p-5 pt-0 flex gap-2">
              <Link
                href={`/marcar?ref=${encodeURIComponent(item.title)}`}
                className={`w-full py-2.5 text-xs font-bold rounded-xl text-center transition ${
                  isDark
                    ? "bg-sky-400 hover:bg-sky-300 text-zinc-950 shadow-sky-400/20"
                    : "bg-gradient-to-r from-purple-500 via-pink-500 to-sky-400 hover:opacity-95 text-white shadow-pink-500/20"
                }`}
              >
                Marcar Este
              </Link>
            </div>
          </div>
        ))}
      </div>

      {filteredStyles.length === 0 && (
        <div
          className={`text-center py-16 rounded-2xl border ${
            isDark ? "bg-zinc-900/30 border-zinc-800 text-zinc-500" : "bg-slate-50 border-slate-200 text-slate-400"
          }`}
        >
          <p>Nenhum corte encontrado para esta categoria.</p>
        </div>
      )}
    </div>
  );
}
