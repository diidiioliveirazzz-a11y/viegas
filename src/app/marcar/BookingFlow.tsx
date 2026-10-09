"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";
import { getMaxBookableDate, getTodayBookingDate } from "@/lib/booking-window";

type Service = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration: number;
};

type BookingFlowProps = {
  services: Service[];
  isVip: boolean;
  initialUser?: {
    name?: string | null;
    email?: string | null;
  } | null;
};

export default function BookingFlow({ services, initialUser, isVip }: BookingFlowProps) {
  const searchParams = useSearchParams();
  const initialRef = searchParams.get("ref");
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [styleReference, setStyleReference] = useState<string>(initialRef || "");
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [loadingTimes, setLoadingTimes] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [bookedSuccess, setBookedSuccess] = useState(false);
  const [coveredByPlan, setCoveredByPlan] = useState(false);

  // Guest inputs
  const [guestName, setGuestName] = useState(initialUser?.name || "");
  const [guestEmail, setGuestEmail] = useState(initialUser?.email || "");
  const [guestPhone, setGuestPhone] = useState("");
  
  // Premium Features
  const [isSilent, setIsSilent] = useState(false);
  const [musicRequest, setMusicRequest] = useState("");
  const [isDuo, setIsDuo] = useState(false);
  const [companionName, setCompanionName] = useState("");

  // Lista de espera
  const [waitlistJoining, setWaitlistJoining] = useState(false);
  const [waitlistSuccess, setWaitlistSuccess] = useState(false);

  // Fetch real times when date or service changes and step is 3
  useEffect(() => {
    if (step === 3 && selectedService && selectedDate) {
      fetch(`/api/appointments/availability?date=${selectedDate}&serviceId=${selectedService.id}&duo=${isDuo}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.availableTimes) setAvailableTimes(data.availableTimes);
          if (data.error) setError(data.error);
        })
        .catch(() => setError("Erro ao carregar horários"))
        .finally(() => setLoadingTimes(false));
    }
  }, [step, selectedDate, selectedService, isDuo]);

  const handleJoinWaitlist = async () => {
    if (!selectedDate || !selectedService) return;
    setWaitlistJoining(true);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selectedDate,
          serviceId: selectedService.id,
          isDuo,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Não foi possível entrar na lista de espera.");
        return;
      }
      setWaitlistSuccess(true);
    } catch {
      setError("Erro ao entrar na lista de espera");
    } finally {
      setWaitlistJoining(false);
    }
  };

  const handleConfirm = async () => {
    if (!selectedService || !selectedDate || !selectedTime) return;
    if (isDuo && !companionName.trim()) {
      setError("Indica o nome da pessoa que vai contigo.");
      return;
    }

    if (!initialUser && (!guestName.trim() || !guestEmail.trim())) {
      setError("Por favor preenche o teu nome e email para confirmarmos a reserva.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: selectedService.id,
          date: selectedDate,
          startTime: selectedTime,
          styleReference: styleReference || undefined,
          isSilent,
          musicRequest: musicRequest.trim() || undefined,
          isDuo,
          companionName: isDuo ? companionName.trim() : undefined,
          clientName: guestName.trim() || initialUser?.name || "Cliente",
          clientEmail: guestEmail.trim() || initialUser?.email || undefined,
          clientPhone: guestPhone.trim() || undefined,
          guestName: guestName.trim() || initialUser?.name || undefined,
          guestEmail: guestEmail.trim() || initialUser?.email || undefined,
          guestPhone: guestPhone.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Ocorreu um erro ao agendar.");
        setIsSubmitting(false);
        return;
      }

      setCoveredByPlan(Boolean(data.subscriptionId));
      setBookedSuccess(true);
    } catch {
      setError("Erro ao conectar ao servidor. Tenta novamente.");
      setIsSubmitting(false);
    }
  };

  if (bookedSuccess) {
    return (
      <div
        className={`w-full max-w-lg mx-auto rounded-3xl p-8 sm:p-10 border text-center space-y-6 animate-in zoom-in-95 duration-300 shadow-2xl ${
          isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-slate-200"
        }`}
      >
        <div
          className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto text-4xl border ${
            isDark
              ? "bg-sky-400/20 text-sky-400 border-sky-400/40"
              : "bg-emerald-50 text-emerald-600 border-emerald-200"
          }`}
        >
          ✓
        </div>

        <div>
          <h2 className="text-3xl font-black">Marcação Confirmada!</h2>
          <p className={`text-xs mt-2 ${isDark ? "text-zinc-400" : "text-slate-600"}`}>
            A tua cadeira está reservada com o Diogo Viegas.
          </p>
        </div>

        <div
          className={`p-5 rounded-2xl border text-left space-y-3 text-xs ${
            isDark ? "bg-zinc-950 border-zinc-800" : "bg-slate-50 border-slate-200"
          }`}
        >
          <div className="flex justify-between border-b border-zinc-800/40 pb-2">
            <span className="text-zinc-500">Serviço</span>
            <span className="font-bold">{selectedService?.name}</span>
          </div>
          <div className="flex justify-between border-b border-zinc-800/40 pb-2">
            <span className="text-zinc-500">Data e Hora</span>
            <span className={`font-bold ${isDark ? "text-sky-400" : "text-pink-600"}`}>
              {selectedDate} às {selectedTime}
            </span>
          </div>
          <div className="flex justify-between border-b border-zinc-800/40 pb-2">
            <span className="text-zinc-500">Cliente</span>
            <span className="font-bold">{guestName || initialUser?.name}</span>
          </div>
          {isDuo && (
            <div className="flex justify-between border-b border-zinc-800/40 pb-2">
              <span className="text-zinc-500">Acompanhante</span>
              <span className="font-bold">{companionName}</span>
            </div>
          )}
          {styleReference && (
            <div className="flex justify-between border-b border-zinc-800/40 pb-2">
              <span className="text-zinc-500">Referência Estilo</span>
              <span className={isDark ? "text-sky-400" : "text-pink-600"}>{styleReference}</span>
            </div>
          )}
          <div className="flex justify-between pt-1">
            <span className="text-zinc-500">{coveredByPlan ? "Incluído no plano mensal" : "Total a pagar ao Diogo"}</span>
            <span className={`font-black text-base ${isDark ? "text-sky-400" : "text-pink-600"}`}>
                {coveredByPlan ? "0,00€" : selectedService ? `${(selectedService.price * (isDuo ? 2 : 1)).toFixed(2)}€` : "—"}
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link
            href="/minhas-marcacoes"
            className={`flex-1 py-3 text-xs font-bold rounded-xl transition ${
              isDark
                ? "bg-sky-400 hover:bg-sky-300 text-zinc-950"
                : "bg-gradient-to-r from-purple-500 via-pink-500 to-sky-400 text-white"
            }`}
          >
            Ver as Minhas Marcações
          </Link>
          <Link
            href="/"
            className={`flex-1 py-3 text-xs font-bold rounded-xl transition border ${
              isDark
                ? "bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-700"
                : "bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300"
            }`}
          >
            Voltar ao Início
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`w-full max-w-2xl mx-auto rounded-3xl shadow-2xl overflow-hidden border transition-all ${
        isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-slate-200"
      }`}
    >
      {/* Banner de Referência de Corte se existir */}
      {styleReference && (
        <div
          className={`px-6 py-2.5 flex justify-between items-center text-xs border-b ${
            isDark
              ? "bg-sky-400/10 border-sky-400/20 text-sky-400"
              : "bg-pink-50 border-pink-200 text-pink-600"
          }`}
        >
          <span>✨ Referência associada: <strong>{styleReference}</strong></span>
          <button onClick={() => setStyleReference("")} className="text-zinc-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Step Indicator */}
      <div
        className={`flex justify-between items-center p-5 border-b text-xs font-bold ${
          isDark ? "bg-zinc-950 border-zinc-800" : "bg-slate-50 border-slate-200"
        }`}
      >
        <span className={step >= 1 ? (isDark ? "text-sky-400" : "text-pink-600") : "text-zinc-500"}>
          1. Serviço
        </span>
        <span className={step >= 2 ? (isDark ? "text-sky-400" : "text-pink-600") : "text-zinc-500"}>
          2. Data
        </span>
        <span className={step >= 3 ? (isDark ? "text-sky-400" : "text-pink-600") : "text-zinc-500"}>
          3. Hora
        </span>
        <span className={step >= 4 ? (isDark ? "text-sky-400" : "text-pink-600") : "text-zinc-500"}>
          4. Confirmação
        </span>
      </div>

      <div className="p-6 sm:p-8">
        {error && (
          <div
            className={`mb-6 p-4 rounded-xl text-xs border ${
              isDark
                ? "bg-red-950/60 border-red-500/50 text-red-200"
                : "bg-red-50 border-red-200 text-red-700"
            }`}
          >
            {error}
          </div>
        )}

        {/* STEP 1: SERVICE */}
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-2xl font-black mb-6">Escolhe o teu serviço</h2>
            <div className="space-y-4">
              {services.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setSelectedService(s);
                    setStep(2);
                  }}
                  className={`w-full text-left p-5 rounded-2xl border transition flex justify-between items-center group ${
                    isDark
                      ? "border-zinc-800 hover:border-sky-400/60 hover:bg-zinc-800/40"
                      : "border-slate-200 hover:border-pink-300 hover:bg-slate-50"
                  }`}
                >
                  <div>
                    <h3
                      className={`text-lg font-bold transition ${
                        isDark ? "group-hover:text-sky-400" : "group-hover:text-pink-600"
                      }`}
                    >
                      {s.name}
                    </h3>
                    <p className={`text-xs mt-1 ${isDark ? "text-zinc-400" : "text-slate-500"}`}>
                      {s.description}
                    </p>
                  </div>
                  <div className="text-right pl-4">
                    <p className={`text-xl font-black ${isDark ? "text-sky-400" : "text-pink-600"}`}>
                      {s.price.toFixed(2)}€
                    </p>
                    <p className="text-[11px] text-zinc-500">~{s.duration} min</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: DATE */}
        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <button
              onClick={() => setStep(1)}
              className={`text-xs font-semibold mb-4 hover:underline ${
                isDark ? "text-sky-400" : "text-pink-600"
              }`}
            >
              ← Voltar aos Serviços
            </button>
            <h2 className="text-2xl font-black mb-2">Qual o melhor dia?</h2>
            <p className={`text-xs mb-6 ${isDark ? "text-zinc-400" : "text-slate-500"}`}>
              A agenda abre até 7 dias para clientes regulares{isVip ? " e até 8 dias para membros VIP" : ""}. Seleciona o dia pretendido para veres os horários livres com o Diogo.
            </p>

            <input
              type="date"
              min={getTodayBookingDate()}
              max={getMaxBookableDate(isVip)}
              className={`w-full rounded-2xl p-4 outline-none mb-6 text-base border transition ${
                isDark
                  ? "bg-zinc-950 border-zinc-800 text-white focus:border-sky-400"
                  : "bg-slate-50 border-slate-200 text-slate-900 focus:border-pink-500"
              }`}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{ colorScheme: isDark ? "dark" : "light" }}
            />

            <button
              onClick={() => {
                if (selectedDate) {
                  setLoadingTimes(true);
                  setError("");
                  setWaitlistSuccess(false);
                  setStep(3);
                }
              }}
              disabled={!selectedDate}
              className={`w-full font-bold py-4 rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed shadow-lg text-sm ${
                isDark
                  ? "bg-sky-400 hover:bg-sky-300 text-zinc-950 shadow-sky-400/20"
                  : "bg-gradient-to-r from-purple-500 via-pink-500 to-sky-400 hover:opacity-95 text-white shadow-pink-500/20"
              }`}
            >
              Ver Horários Disponíveis
            </button>
          </div>
        )}

        {/* STEP 3: TIME */}
        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <button
              onClick={() => setStep(2)}
              className={`text-xs font-semibold mb-4 hover:underline ${
                isDark ? "text-sky-400" : "text-pink-600"
              }`}
            >
              ← Escolher Outro Dia
            </button>
            <h2 className="text-2xl font-black mb-2">Horários Disponíveis</h2>
            <p className={`text-xs mb-6 ${isDark ? "text-zinc-400" : "text-slate-500"}`}>
              Apenas os horários sem conflito com outras marcações ou pausas são exibidos.
            </p>

            {loadingTimes ? (
              <div className="py-16 text-center space-y-3">
                <div
                  className={`w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto ${
                    isDark ? "border-sky-400" : "border-pink-500"
                  }`}
                ></div>
                <p className={`text-xs ${isDark ? "text-zinc-400" : "text-slate-500"}`}>
                  A verificar a agenda do Diogo em tempo real...
                </p>
              </div>
            ) : availableTimes.length === 0 ? (
              <div
                className={`py-10 text-center space-y-4 rounded-2xl border p-6 ${
                  isDark ? "bg-zinc-950/60 border-zinc-800" : "bg-slate-50 border-slate-200"
                }`}
              >
                <p className="text-sm font-semibold">
                  Não existem horários livres disponíveis para este dia.
                </p>
                <p className={`text-xs ${isDark ? "text-zinc-500" : "text-slate-500"}`}>
                  Para hoje os horários imediatos podem estar fechados pela antecedência configurada. Experimenta selecionar amanhã ou entrar na lista de espera!
                </p>

                {waitlistSuccess ? (
                  <div className="p-3 bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 rounded-xl text-xs">
                    ✓ Estás na lista. Se surgir uma vaga, receberás uma notificação dentro do site e terás 10 minutos para a aceitar.
                  </div>
                ) : (
                  <button
                    onClick={handleJoinWaitlist}
                    disabled={waitlistJoining}
                    className={`px-6 py-3 rounded-xl text-xs font-bold transition border ${
                      isDark
                        ? "bg-zinc-800 hover:bg-zinc-700 text-sky-400 border-sky-400/30"
                        : "bg-white hover:bg-pink-50 text-pink-600 border-pink-300"
                    }`}
                  >
                    {waitlistJoining ? "A registar..." : "⚡ Avisem-me se surgir uma vaga por cancelamento"}
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {availableTimes.map((time) => (
                  <button
                    key={time}
                    onClick={() => {
                      setSelectedTime(time);
                      setStep(4);
                    }}
                    className={`p-3 text-center rounded-xl border font-bold text-sm transition ${
                      isDark
                        ? "border-zinc-800 text-white hover:bg-sky-400 hover:text-zinc-950 hover:border-sky-400"
                        : "border-slate-200 text-slate-800 hover:bg-gradient-to-r hover:from-purple-500 hover:via-pink-500 hover:to-sky-400 hover:text-white hover:border-transparent"
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* STEP 4: CONFIRMATION */}
        {step === 4 && selectedService && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <button
              onClick={() => setStep(3)}
              className={`text-xs font-semibold mb-4 hover:underline ${
                isDark ? "text-sky-400" : "text-pink-600"
              }`}
            >
              ← Alterar Hora
            </button>
            <h2 className="text-2xl font-black mb-6">Resumo da Reserva</h2>

            <div
              className={`p-6 rounded-2xl border mb-6 space-y-3 text-sm ${
                isDark ? "bg-zinc-950 border-zinc-800" : "bg-slate-50 border-slate-200"
              }`}
            >
              <div className="flex justify-between border-b border-zinc-800/40 pb-3">
                <span className="text-zinc-500">Barbeiro</span>
                <span className="font-bold">Diogo Viegas</span>
              </div>
              <div className="flex justify-between border-b border-zinc-800/40 pb-3">
                <span className="text-zinc-500">Serviço</span>
                <span className="font-bold">{isDuo ? `Duo · ${selectedService.name} × 2` : selectedService.name}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-800/40 pb-3">
                <span className="text-zinc-500">Data</span>
                <span className="font-bold">{selectedDate}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-800/40 pb-3">
                <span className="text-zinc-500">Hora</span>
                <span className={`font-bold ${isDark ? "text-sky-400" : "text-pink-600"}`}>
                  {selectedTime}
                </span>
              </div>
              {styleReference && (
                <div className="flex justify-between border-b border-zinc-800/40 pb-3">
                  <span className="text-zinc-500">Referência Estilo</span>
                  <span className={`font-semibold ${isDark ? "text-sky-400" : "text-pink-600"}`}>
                    {styleReference}
                  </span>
                </div>
              )}
              <div className="flex justify-between pt-2">
                <span className="font-semibold text-zinc-500">Total a Pagar</span>
                <span className={`text-2xl font-black ${isDark ? "text-sky-400" : "text-pink-600"}`}>
                  {(selectedService.price * (isDuo ? 2 : 1)).toFixed(2)}€
                </span>
              </div>
            </div>
            
            {/* Premium Options */}
            <div className={`p-6 rounded-2xl border mb-6 space-y-5 ${isDark ? "bg-zinc-950 border-zinc-800" : "bg-slate-50 border-slate-200"}`}>
              <h3 className="text-sm font-bold flex items-center gap-2">
                <span>👑 Experiência Premium</span>
              </h3>
              
              <div className="space-y-4">
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isDuo}
                      onChange={(event) => {
                        setIsDuo(event.target.checked);
                        setSelectedTime("");
                        setLoadingTimes(true);
                        setStep(3);
                        setError("");
                      }}
                      className="mt-0.5 h-5 w-5 rounded border-zinc-700 text-amber-500 focus:ring-amber-500/30"
                    />
                    <span>
                      <span className="block text-sm font-bold">Marcar para dois 👨‍👦</span>
                      <span className={`mt-1 block text-xs ${isDark ? "text-zinc-400" : "text-slate-500"}`}>
                        Reserva dois serviços seguidos. Total: {(selectedService.price * 2).toFixed(2)}€.
                      </span>
                    </span>
                  </label>
                  {isDuo && (
                    <input
                      type="text"
                      maxLength={100}
                      required
                      value={companionName}
                      onChange={(event) => setCompanionName(event.target.value)}
                      placeholder="Nome da pessoa que vem contigo"
                      className={`mt-3 w-full rounded-xl border p-3 text-xs outline-none transition ${
                        isDark
                          ? "bg-zinc-900 border-zinc-800 text-white focus:border-amber-500"
                          : "bg-white border-slate-200 text-slate-900 focus:border-amber-500"
                      }`}
                    />
                  )}
                </div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isSilent}
                    onChange={(e) => setIsSilent(e.target.checked)}
                    className="w-5 h-5 rounded border-zinc-700 text-sky-400 focus:ring-sky-400/30"
                  />
                  <div>
                    <p className={`text-sm font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Corte Silencioso 🤫</p>
                    <p className={`text-xs ${isDark ? "text-zinc-400" : "text-slate-500"}`}>
                      Sem conversa de circunstância. Apenas relaxa enquanto tratamos do teu visual.
                    </p>
                  </div>
                </label>

                <div>
                  <label className="block text-xs font-semibold text-zinc-500 mb-1">
                    Sugere até 2 músicas para a tua sessão 🎵
                  </label>
                  <input
                    type="text"
                    maxLength={160}
                    placeholder="Ex.: artista — música; artista — música"
                    value={musicRequest}
                    onChange={(e) => setMusicRequest(e.target.value)}
                    className={`w-full rounded-xl p-3 text-xs outline-none border transition ${
                      isDark
                        ? "bg-zinc-900 border-zinc-800 text-white focus:border-sky-400"
                        : "bg-white border-slate-200 text-slate-900 focus:border-pink-500"
                    }`}
                  />
                </div>
              </div>
            </div>


            {/* Se não estiver logado, pedir dados do cliente */}
            {!initialUser && (
              <div
                className={`p-6 rounded-2xl border mb-6 space-y-4 ${
                  isDark ? "bg-zinc-950 border-zinc-800" : "bg-slate-50 border-slate-200"
                }`}
              >
                <h3 className="text-sm font-bold">Os Teus Dados de Contacto</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-500 mb-1">
                      Nome Completo
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Diogo Oliveira"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      className={`w-full rounded-xl p-3 text-xs outline-none border transition ${
                        isDark
                          ? "bg-zinc-900 border-zinc-800 text-white focus:border-sky-400"
                          : "bg-white border-slate-200 text-slate-900 focus:border-pink-500"
                      }`}
                      required
                    />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-500 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        placeholder="diogo@exemplo.com"
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.target.value)}
                        className={`w-full rounded-xl p-3 text-xs outline-none border transition ${
                          isDark
                            ? "bg-zinc-900 border-zinc-800 text-white focus:border-sky-400"
                            : "bg-white border-slate-200 text-slate-900 focus:border-pink-500"
                        }`}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-500 mb-1">
                        Telemóvel (opcional)
                      </label>
                      <input
                        type="tel"
                        placeholder="912 345 678"
                        value={guestPhone}
                        onChange={(e) => setGuestPhone(e.target.value)}
                        className={`w-full rounded-xl p-3 text-xs outline-none border transition ${
                          isDark
                            ? "bg-zinc-900 border-zinc-800 text-white focus:border-sky-400"
                            : "bg-white border-slate-200 text-slate-900 focus:border-pink-500"
                        }`}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={handleConfirm}
              disabled={isSubmitting}
              className={`w-full font-bold py-4 rounded-xl transition shadow-lg disabled:opacity-50 text-base ${
                isDark
                  ? "bg-sky-400 hover:bg-sky-300 text-zinc-950 shadow-sky-400/20"
                  : "bg-gradient-to-r from-purple-500 via-pink-500 to-sky-400 hover:opacity-95 text-white shadow-pink-500/20"
              }`}
            >
              {isSubmitting ? "A confirmar a tua vaga..." : "Confirmar Marcação Definitiva"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
