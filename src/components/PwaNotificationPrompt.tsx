"use client";

import { useEffect, useState } from "react";

export default function PwaNotificationPrompt() {
  const [permission, setPermission] = useState<string>("default");
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(true);
  const [showIOSModal, setShowIOSModal] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream;
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;

    setIsIOS(ios);
    setIsStandalone(standalone);

    if ("Notification" in window) {
      setPermission(Notification.permission);
      if (Notification.permission === "default") {
        const lastDismissed = localStorage.getItem("vb-pwa-dismissed");
        if (!lastDismissed || Date.now() - parseInt(lastDismissed, 10) > 24 * 60 * 60 * 1000) {
          setDismissed(false);
        }
      }
    } else if (ios && !standalone) {
      // No iPhone Safari fora de PWA
      const lastDismissed = localStorage.getItem("vb-pwa-dismissed");
      if (!lastDismissed || Date.now() - parseInt(lastDismissed, 10) > 24 * 60 * 60 * 1000) {
        setDismissed(false);
      }
    }
  }, []);

  async function handleEnable() {
    if (isIOS && !isStandalone && !("Notification" in window)) {
      setShowIOSModal(true);
      return;
    }

    if (!("Notification" in window)) {
      alert("O teu navegador não suporta notificações de sistema.");
      return;
    }

    if (Notification.permission === "denied") {
      alert(
        "⚠️ As notificações estão bloqueadas nas definições do teu telemóvel/navegador.\n\n" +
        "Para ativar:\n" +
        "• No Chrome/Android: Clica no cadeado ao lado do endereço > Permissões > Ativar Notificações.\n" +
        "• No iPhone: Abre Definições > Notificações > Viegas Barber > Permitir Notificações."
      );
      return;
    }

    try {
      const res = await Notification.requestPermission();
      setPermission(res);
      if (res === "granted") {
        setDismissed(true);
        if ("serviceWorker" in navigator) {
          navigator.serviceWorker.ready.then((reg) => {
            reg.showNotification("Notificações Ativadas! 💈", {
              body: "Receberás avisos de cortes e vagas da Viegas Barber diretamente no teu telemóvel.",
              icon: "/icon-192.png",
              badge: "/icon-192.png",
            });
          });
        }
      }
    } catch (e) {
      console.error(e);
    }
  }

  function handleDismiss() {
    setDismissed(true);
    localStorage.setItem("vb-pwa-dismissed", String(Date.now()));
  }

  if (dismissed || permission === "granted") return null;

  return (
    <>
      {/* Banner Flutuante no Telemóvel */}
      <div className="fixed bottom-4 left-3 right-3 z-50 mx-auto max-w-md rounded-2xl border border-red-500/50 bg-zinc-950 p-4 text-white shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/20 text-xl text-red-400">
            🔔
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-white">Ativar notificações no telemóvel?</h4>
            <p className="mt-1 text-xs leading-relaxed text-zinc-400">
              Recebe alertas de confirmação, horários de corte e avisos quando abrirem novas vagas.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={handleEnable}
                className="brand-button rounded-xl px-4 py-2 text-xs font-bold text-white shadow-lg transition transform active:scale-95"
              >
                Ativar Notificações
              </button>
              <button
                onClick={handleDismiss}
                className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-semibold text-zinc-400 hover:text-white"
              >
                Agora não
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal explicativo iOS */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="max-w-sm rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-white shadow-2xl">
            <div className="text-2xl">📱</div>
            <h3 className="mt-2 text-base font-bold">Como ativar no iPhone:</h3>
            <ol className="mt-3 list-decimal space-y-2 pl-4 text-xs text-zinc-300 leading-relaxed">
              <li>Toca no ícone de <strong>Partilhar</strong> (o quadrado com a seta para cima ⎋ na barra inferior do Safari).</li>
              <li>Desliza para baixo e seleciona <strong>&quot;Adicionar ao Ecrã Principal&quot;</strong> (+).</li>
              <li>Abre a aplicação pelo novo ícone no teu ecrã inicial e clica em <strong>Ativar Notificações</strong>!</li>
            </ol>
            <button
              onClick={() => setShowIOSModal(false)}
              className="brand-button mt-5 w-full rounded-xl py-2.5 text-xs font-bold text-white"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
}
