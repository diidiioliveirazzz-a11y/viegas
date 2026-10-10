"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function FlashDropBanner() {
  const [timeLeft, setTimeLeft] = useState<{ minutes: number; seconds: number }>({
    minutes: 18,
    seconds: 42,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { minutes: prev.minutes - 1, seconds: 59 };
        } else {
          return { minutes: 25, seconds: 0 }; // resets countdown cycle
        }
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flash-drop-container my-5 max-w-xl mx-auto rounded-2xl overflow-hidden border border-red-500/50 bg-gradient-to-r from-red-950/80 via-zinc-950 to-red-950/80 p-4 sm:p-5 shadow-2xl relative text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest bg-red-600 text-white animate-pulse">
              ⚡ FLASH DROP
            </span>
            <span className="text-[11px] font-mono text-zinc-400">
              EXPIRA EM:{" "}
              <strong className="text-white font-bold">
                {String(timeLeft.minutes).padStart(2, "0")}:{String(timeLeft.seconds).padStart(2, "0")}
              </strong>
            </span>
          </div>

          <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-tight">
            Vaga Relâmpago Libertada • 1 Cadeira Hoje
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Horário livre de última hora na cadeira do Diogo. Primeiro a confirmar fica com ela.
          </p>
        </div>

        <Link
          href="/marcar"
          className="whitespace-nowrap px-4 py-2.5 rounded-xl font-black text-xs bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/40 text-center transition active:scale-95 flex items-center justify-center gap-1.5"
        >
          <span>AGARRAR O DROP</span>
          <span>⚡</span>
        </Link>
      </div>
    </div>
  );
}
