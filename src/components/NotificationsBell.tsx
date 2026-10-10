"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTheme } from "@/context/ThemeContext";

import { Bell } from "lucide-react";

type UserNotification = {
  id: string;
  title: string;
  message: string;
  actionUrl: string | null;
  read: boolean;
  createdAt: string;
};

export default function NotificationsBell() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [error, setError] = useState("");
  const [perm, setPerm] = useState<string>("default");

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPerm(Notification.permission);
    }
  }, []);

  async function requestNotificationPermission() {
    if (typeof window === "undefined" || !("Notification" in window)) {
      alert("O teu navegador não suporta notificações de sistema.");
      return;
    }
    try {
      const result = await Notification.requestPermission();
      setPerm(result);
      if (result === "granted" && "serviceWorker" in navigator) {
        const reg = await navigator.serviceWorker.ready;
        reg.showNotification("Notificações Ativadas! 💈", {
          body: "Receberás avisos de cortes, vagas e lembretes da Viegas Barber.",
          icon: "/icon-192.png",
          badge: "/icon-192.png",
        });
      }
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    fetch("/api/notifications")
      .then(async (response) => {
        if (!response.ok) return;
        const data = await response.json();
        setNotifications(data.notifications);
      })
      .catch((error) => console.error("Erro ao carregar notificações", error));
  }, []);

  async function showNotifications() {
    setOpen((current) => !current);
    if (notifications.some((notification) => !notification.read)) {
      try {
        const response = await fetch("/api/notifications", { method: "PATCH" });
        if (!response.ok) {
          setError("Não foi possível marcar as notificações como lidas.");
          return;
        }
        setNotifications((current) => current.map((notification) => ({ ...notification, read: true })));
      } catch {
        setError("Erro de ligação ao atualizar notificações.");
      }
    }
  }

  const unread = notifications.filter((notification) => !notification.read).length;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={showNotifications}
        aria-label={`Notificações${unread ? `, ${unread} por ler` : ""}`}
        className={`relative flex h-9 w-9 items-center justify-center rounded-xl border transition ${
          isDark ? "border-zinc-800 bg-zinc-900 text-amber-400" : "border-slate-200 bg-white text-amber-600"
        }`}
      >
        <Bell className="w-4 h-4" />
        {unread > 0 && <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-amber-500 px-1 text-[10px] font-bold text-black">{unread}</span>}
      </button>
      {open && (
        <div className={`absolute right-0 top-12 z-50 w-80 max-w-[90vw] overflow-hidden rounded-2xl border shadow-2xl ${
          isDark ? "border-zinc-800 bg-zinc-950 text-white" : "border-slate-200 bg-white text-slate-900"
        }`}>
          <h2 className="border-b border-inherit p-4 text-sm font-bold flex justify-between items-center">
            <span>Notificações</span>
            {perm === "granted" && <span className="text-[10px] text-green-500 font-normal">● Ativas</span>}
          </h2>
          {perm !== "granted" && (
            <div className="p-3 border-b border-inherit bg-amber-500/10">
              <button
                type="button"
                onClick={requestNotificationPermission}
                className="w-full py-2 px-3 text-xs font-bold bg-amber-500 text-black rounded-xl hover:bg-amber-400 transition"
              >
                🔔 Ativar Notificações no Telemóvel
              </button>
            </div>
          )}
          {error && <p role="alert" className="px-4 pt-3 text-xs text-red-500">{error}</p>}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="p-5 text-sm text-slate-500 dark:text-zinc-400">Ainda não tens notificações.</p>
            ) : notifications.map((notification) => (
              <article key={notification.id} className="border-b border-slate-200 p-4 last:border-0 dark:border-zinc-800">
                <p className="text-sm font-bold">{notification.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-zinc-400">{notification.message}</p>
                {notification.actionUrl && (
                  <Link
                    href={notification.actionUrl}
                    onClick={() => setOpen(false)}
                    className="mt-3 inline-block text-xs font-bold text-amber-600 hover:underline dark:text-amber-400"
                  >
                    {notification.actionUrl.startsWith("/espera/") ? "Aceitar vaga →" : "Ver detalhes →"}
                  </Link>
                )}
              </article>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
