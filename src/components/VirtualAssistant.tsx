"use client";

import { useState, useRef, useEffect } from "react";
import { useTheme } from "@/context/ThemeContext";

interface Message {
  role: "user" | "assistant";
  text: string;
}

export default function VirtualAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "Olá! Sou o assistente da Viegas Barber. Posso ajudar-te com marcações, preços, horário, localização e fidelização. Se quiseres, podes perguntar: 'onde faço as marcações?' ou 'qual é o horário?'.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userText }]);
    setLoading(true);

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText }),
      });

      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", text: data.reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "Erro ao comunicar com o assistente. Tenta de novo." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Botão Flutuante */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={`group relative p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-105 flex items-center gap-2.5 border-2 overflow-hidden ${
            isDark
              ? "bg-amber-400 hover:bg-amber-300 text-zinc-950 border-amber-200 shadow-[0_0_30px_rgba(245,158,11,0.25)]"
              : "bg-amber-500 hover:bg-amber-400 text-zinc-950 border-amber-200 shadow-[0_18px_40px_rgba(217,119,6,0.22)]"
          }`}
          title="Assistente Viegas Barber"
        >
          <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <span className="relative text-xl">💬</span>
          <span className="relative text-xs font-black hidden sm:inline tracking-[0.12em] uppercase">Assistente</span>
        </button>
      )}

      {/* Janela de Chat */}
      {isOpen && (
        <div
          className={`w-[340px] sm:w-[380px] h-[500px] rounded-[28px] shadow-[0_28px_80px_rgba(15,23,42,0.55)] flex flex-col overflow-hidden border backdrop-blur-xl ${
            isDark
              ? "bg-zinc-900/90 border-zinc-700/80 text-white shadow-black/80"
              : "bg-white/90 border-white/80 text-slate-900 shadow-slate-300/70"
          }`}
        >
          {/* Header */}
          <div
            className={`p-4 border-b flex justify-between items-center bg-gradient-to-r ${
              isDark
                ? "from-zinc-950 via-zinc-900 to-sky-950/80 border-zinc-800"
                : "from-white via-slate-50 to-pink-50 border-slate-200"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`relative w-9 h-9 rounded-2xl flex items-center justify-center font-black text-xs shadow-inner ${
                  isDark                   ? "bg-amber-400 text-zinc-950" : "bg-amber-500 text-zinc-950"
                }`}
              >
                <span className="absolute inset-0 rounded-2xl ring-2 ring-white/40" />
                VB
              </div>
              <div>
                <h4 className="text-sm font-black">Assistente Viegas Barber</h4>
                <p className="text-[10px] text-emerald-500 flex items-center gap-1 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Disponibilidade em tempo real
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className={`p-1.5 rounded-lg transition text-base ${
                isDark ? "text-zinc-400 hover:text-white" : "text-slate-400 hover:text-slate-800"
              }`}
            >
              ✕
            </button>
          </div>

          {/* Mensagens */}
          <div className={`flex-1 p-4 overflow-y-auto space-y-3 ${isDark ? "bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.08),transparent_40%)]" : "bg-[radial-gradient(circle_at_top,_rgba(236,72,153,0.08),transparent_40%)]"}`}>
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed whitespace-pre-line shadow-sm ${
                    m.role === "user"
                      ? isDark
                        ? "bg-amber-400 text-zinc-950 font-semibold shadow-[0_10px_18px_rgba(245,158,11,0.2)]"
                        : "bg-amber-500 text-zinc-950 font-semibold shadow-[0_10px_20px_rgba(217,119,6,0.2)]"
                      : isDark
                      ? "bg-zinc-950/90 text-zinc-200 border border-zinc-800/80"
                      : "bg-slate-100 text-slate-800 border border-slate-200"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div
                  className={`p-3 rounded-2xl text-xs flex gap-1 border ${
                    isDark
                      ? "bg-zinc-950 text-sky-400 border-zinc-800"
                      : "bg-slate-100 text-pink-500 border-slate-200"
                  }`}
                >
                  <span className="animate-bounce">●</span>
                  <span className="animate-bounce delay-100">●</span>
                  <span className="animate-bounce delay-200">●</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={handleSend}
            className={`p-3 border-t flex gap-2 ${
              isDark ? "bg-zinc-950 border-zinc-800" : "bg-slate-50 border-slate-200"
            }`}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pergunta sobre preços, horários, etc..."
              className={`flex-1 rounded-xl px-3.5 py-2.5 text-xs outline-none transition border shadow-inner ${
                isDark
                  ? "bg-zinc-900 border-zinc-800 text-white placeholder-zinc-500 focus:border-sky-400 focus:shadow-[0_0_0_3px_rgba(56,189,248,0.18)]"
                  : "bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-pink-500 focus:shadow-[0_0_0_3px_rgba(236,72,153,0.12)]"
              }`}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition disabled:opacity-40 shadow-sm ${
                isDark
                  ? "bg-gradient-to-r from-sky-400 to-cyan-300 hover:brightness-110 text-zinc-950 shadow-[0_8px_18px_rgba(56,189,248,0.28)]"
                  : "bg-gradient-to-r from-purple-500 via-pink-500 to-sky-400 text-white hover:opacity-95 shadow-[0_8px_18px_rgba(236,72,153,0.22)]"
              }`}
            >
              ➤
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
