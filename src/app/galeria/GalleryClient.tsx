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
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div>
      {/* Grid de Fotografias dos Trabalhos */}
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
        {styles.map((item) => (
          <div
            key={item.id}
            className={`group rounded-2xl overflow-hidden border transition shadow-sm ${
              isDark
                ? "bg-zinc-900 border-zinc-800 hover:border-red-500/40"
                : "bg-white border-slate-200 hover:border-rose-300"
            }`}
          >
            <div className="h-80 overflow-hidden relative bg-black/40">
              <img
                src={item.imageUrl}
                alt="Trabalho Diogo Viegas"
                className="w-full h-full object-cover object-[center_20%] group-hover:scale-105 transition duration-500"
              />
            </div>
          </div>
        ))}
      </div>

      {styles.length === 0 && (
        <div
          className={`text-center py-16 rounded-2xl border ${
            isDark ? "bg-zinc-900/30 border-zinc-800 text-zinc-500" : "bg-slate-50 border-slate-200 text-slate-400"
          }`}
        >
          <p>Galeria de fotografias em atualização.</p>
        </div>
      )}

      {/* Botão de Marcação Geral */}
      <div className="mt-14 text-center">
        <Link
          href="/marcar"
          className="brand-button inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-base shadow-xl transition"
        >
          MARCAR HORÁRIO
        </Link>
      </div>
    </div>
  );
}
