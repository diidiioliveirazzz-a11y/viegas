"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import ThemeToggle from "./ThemeToggle";
import { useTheme } from "@/context/ThemeContext";
import NotificationsBell from "./NotificationsBell";

interface NavbarProps {
  user?: {
    name?: string | null;
    email?: string | null;
    role?: string | null;
  } | null;
}

export default function Navbar({ user }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 animate-nav-slide-down ${
        isDark
          ? "bg-zinc-950/80 border-b border-zinc-800/80 shadow-[0_10px_30px_rgba(0,0,0,0.35)]"
          : "bg-white/75 border-b border-slate-200/80 shadow-[0_10px_30px_rgba(225,29,72,0.08)]"
      } backdrop-blur-2xl`}
    >
    <div
      className="navbar-accent-line absolute inset-x-0 bottom-0 h-px"
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-20 flex justify-between items-center relative">
        <Link
          href="/"
          onClick={closeMenu}
          className="group flex items-center gap-1.5 text-xl sm:text-2xl font-black tracking-tighter transition-transform duration-300 hover:scale-[1.02]"
        >
          <span className={isDark ? "text-white" : "text-zinc-900"}>VIEGAS</span>
          <span
            className={`transition-all duration-300 ${
              isDark
                ? "text-red-400 group-hover:drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]"
                : "text-red-600 group-hover:drop-shadow-[0_0_8px_rgba(220,38,38,0.5)]"
            }`}
          >
            .
          </span>
          <span
            className={`text-[10px] sm:text-xs uppercase tracking-[0.24em] px-2 py-1 rounded-full font-bold transition-colors ${
              isDark
                ? "bg-red-500/10 text-red-400 border border-red-500/20"
                : "bg-rose-50 text-rose-700 border border-rose-200"
            }`}
          >
            Barber
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav
          className={`hidden md:flex gap-6 items-center text-xs font-semibold ${
            isDark ? "text-zinc-400" : "text-slate-600"
          }`}
        >
          <Link
            href="/diogo"
            className={`transition ${isDark ? "hover:text-red-400" : "hover:text-red-600"}`}
          >
            O Diogo
          </Link>
          <Link
            href="/#servicos"
            className={`transition ${isDark ? "hover:text-red-400" : "hover:text-red-600"}`}
          >
            Serviços
          </Link>
          <Link
            href="/galeria"
            className={`transition ${isDark ? "hover:text-red-400" : "hover:text-red-600"}`}
          >
            Galeria
          </Link>

          <Link
            href="/loja"
            className={`transition ${isDark ? "hover:text-red-400" : "hover:text-red-600"}`}
          >
            Loja
          </Link>
          <Link
            href="/fidelizacao"
            className={`transition ${isDark ? "hover:text-red-400" : "hover:text-red-600"}`}
          >
            Fidelização
          </Link>
          <Link href="/plano" className={`transition ${isDark ? "hover:text-red-400" : "hover:text-red-600"}`}>
            Plano mensal
          </Link>

          {user && (
            <Link
              href="/minhas-marcacoes"
              className={`transition ${isDark ? "hover:text-sky-400" : "hover:text-pink-600"}`}
            >
              As Minhas Marcações
            </Link>
          )}

          {user && (user.role === "ADMIN" || user.role === "BARBER") && (
            <Link
              href="/dashboard"
              className={`font-bold px-2.5 py-1 rounded-lg border transition ${
                isDark
                  ? "text-red-400 border-red-500/40 hover:bg-red-500/10"
                  : "text-red-700 border-rose-300 hover:bg-rose-50"
              }`}
            >
              ⚙️ Dashboard
            </Link>
          )}
        </nav>

        {/* Right Controls: Theme Toggle + Profile / Login + CTA */}
        <div className="hidden md:flex gap-3.5 items-center">
          {/* Botão de Alternar Modo Dark / White */}
          <ThemeToggle />
          <NotificationsBell />

          {user ? (
            <div className="flex items-center gap-3">
              <span className={`text-xs font-medium ${isDark ? "text-zinc-400" : "text-slate-600"}`}>
                Olá, <strong className={isDark ? "text-white" : "text-zinc-900"}>{user.name?.split(" ")[0]}</strong>
              </span>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-[11px] text-zinc-500 hover:text-red-400 transition"
                title="Terminar Sessão"
              >
                Sair
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className={`text-xs font-bold transition px-2 py-1 rounded-lg ${
                isDark
                  ? "text-zinc-300 hover:text-white"
                  : "text-slate-700 hover:text-slate-900"
              }`}
            >
              Entrar
            </Link>
          )}

          <Link
            href="/marcar"
            className="brand-button px-5 py-2.5 rounded-xl font-bold text-xs transition duration-200 transform hover:-translate-y-0.5"
          >
            MARCAR AGORA
          </Link>
        </div>

        {/* Mobile Controls */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <NotificationsBell />

          <Link
            href="/marcar"
            className="brand-button px-3 py-1.5 rounded-lg font-black text-xs"
          >
            MARCAR
          </Link>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`p-2 transition focus:outline-none ${
              isDark ? "text-zinc-300 hover:text-white" : "text-slate-700 hover:text-slate-900"
            }`}
            aria-label="Abrir Menu"
          >
            {mobileMenuOpen ? (
              <span className="text-2xl font-bold leading-none">✕</span>
            ) : (
              <span className="text-2xl leading-none">☰</span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div
          className={`md:hidden border-b px-6 py-6 space-y-4 animate-in slide-in-from-top duration-200 ${
            isDark
              ? "bg-zinc-950/95 border-zinc-900 text-zinc-300"
              : "bg-white/95 border-slate-200 text-slate-800"
          }`}
        >
          <div className="flex flex-col space-y-2.5 text-sm font-bold">
            <Link
              href="/diogo"
              onClick={closeMenu}
              className={`p-2.5 rounded-xl flex items-center gap-2.5 transition ${
                isDark ? "hover:bg-zinc-900 hover:text-red-400" : "hover:bg-rose-50 hover:text-red-700"
              }`}
            >
              <span>💈 O Diogo Viegas</span>
            </Link>
            <Link
              href="/#servicos"
              onClick={closeMenu}
              className={`p-2.5 rounded-xl flex items-center gap-2.5 transition ${
                isDark ? "hover:bg-zinc-900 hover:text-red-400" : "hover:bg-rose-50 hover:text-red-700"
              }`}
            >
              <span>✂️ Serviços & Preços</span>
            </Link>
            <Link
              href="/galeria"
              onClick={closeMenu}
              className={`p-2.5 rounded-xl flex items-center gap-2.5 transition ${
                isDark ? "hover:bg-zinc-900 hover:text-red-400" : "hover:bg-rose-50 hover:text-red-700"
              }`}
            >
              <span>🖼️ Galeria de Cortes</span>
            </Link>

            <Link
              href="/loja"
              onClick={closeMenu}
              className={`p-2.5 rounded-xl flex items-center gap-2.5 transition ${
                isDark ? "hover:bg-zinc-900 hover:text-red-400" : "hover:bg-rose-50 hover:text-red-700"
              }`}
            >
              <span>🛒 Loja de Produtos</span>
            </Link>
            <Link
              href="/fidelizacao"
              onClick={closeMenu}
              className={`p-2.5 rounded-xl flex items-center gap-2.5 transition ${
                isDark ? "hover:bg-zinc-900 hover:text-red-400" : "hover:bg-rose-50 hover:text-red-700"
              }`}
            >
              <span>🎁 Cartão de Fidelização</span>
            </Link>
            <Link
              href="/plano"
              onClick={closeMenu}
              className={`p-2.5 rounded-xl flex items-center gap-2.5 transition ${
                isDark ? "hover:bg-zinc-900 hover:text-red-400" : "hover:bg-rose-50 hover:text-red-700"
              }`}
            >
              <span>💳 Plano mensal</span>
            </Link>

            {user && (
              <Link
                href="/minhas-marcacoes"
                onClick={closeMenu}
                className={`p-2.5 rounded-xl flex items-center gap-2.5 transition ${
                  isDark ? "hover:bg-zinc-900 hover:text-red-400" : "hover:bg-rose-50 hover:text-red-700"
                }`}
              >
                <span>📅 As Minhas Marcações</span>
              </Link>
            )}

            {user && (user.role === "ADMIN" || user.role === "BARBER") && (
              <Link
                href="/dashboard"
                onClick={closeMenu}
                className={`p-2.5 rounded-xl border flex items-center gap-2.5 ${
                  isDark
                    ? "bg-red-500/10 text-red-400 border-red-500/40"
                    : "bg-rose-50 text-red-700 border-rose-200"
                }`}
              >
                <span>⚙️ Dashboard do Barbeiro</span>
              </Link>
            )}

            <button
              onClick={async () => {
                if (typeof window !== "undefined" && "Notification" in window) {
                  try {
                    const res = await Notification.requestPermission();
                    if (res === "granted" && "serviceWorker" in navigator) {
                      const reg = await navigator.serviceWorker.ready;
                      reg.showNotification("Notificações Ativadas! 💈", {
                        body: "Receberás avisos de novos cortes e vagas da Viegas Barber.",
                        icon: "/icon-192.png",
                        badge: "/icon-192.png",
                      });
                    }
                  } catch {}
                } else {
                  alert("No iPhone: toca em Partilhar ⎋ > Adicionar ao Ecrã Principal para ativar notificações.");
                }
                closeMenu();
              }}
              className="p-2.5 rounded-xl flex items-center gap-2.5 text-left font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition"
            >
              <span>🔔</span>
              <span>Ativar Notificações no Telemóvel</span>
            </button>
          </div>

          <div
            className={`pt-4 border-t flex justify-between items-center ${
              isDark ? "border-zinc-900" : "border-slate-200"
            }`}
          >
            {user ? (
              <div className="flex justify-between items-center w-full">
                <span className={`text-xs ${isDark ? "text-zinc-400" : "text-slate-600"}`}>
                  Sessão: <strong className={isDark ? "text-white" : "text-zinc-900"}>{user.name?.split(" ")[0]}</strong>
                </span>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="text-xs text-red-500 font-bold"
                >
                  Terminar Sessão
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                onClick={closeMenu}
                className={`w-full text-center py-2.5 rounded-xl text-xs font-bold border transition ${
                  isDark
                    ? "bg-zinc-900 text-white border-zinc-800"
                    : "bg-slate-100 text-slate-800 border-slate-300"
                }`}
              >
                Iniciar Sessão / Criar Conta
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
