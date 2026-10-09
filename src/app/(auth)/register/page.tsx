"use client";

import { FormEvent, useState } from "react";
import { getSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { useTheme } from "@/context/ThemeContext";
import { instagramLoginEmail, normalizeInstagramHandle } from "@/lib/auth-identifiers";

type RegisterMethod = "instagram" | "gmail";

export default function RegisterPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [method, setMethod] = useState<RegisterMethod>("instagram");
  const [name, setName] = useState("");
  const [instagramHandle, setInstagramHandle] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const normalizedHandle =
        method === "instagram" ? normalizeInstagramHandle(instagramHandle) : null;
      if (method === "instagram" && !normalizedHandle) {
        setError("Introdu um @ de Instagram válido, sem espaços.");
        return;
      }
      if (normalizedHandle === "admin") {
        setError("Este utilizador está reservado para a conta do barbeiro.");
        return;
      }

      const loginEmail =
        method === "instagram" && normalizedHandle
          ? instagramLoginEmail(normalizedHandle)
          : email.trim().toLowerCase();
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          loginMethod: method,
          instagramHandle,
          email,
          password,
        }),
      });
      const result = (await response.json()) as { message?: string };

      if (!response.ok) {
        setError(result.message || "Não foi possível criar a conta.");
        return;
      }

      const loginResult = await signIn("credentials", {
        redirect: false,
        email: loginEmail,
        password,
      });

      if (!loginResult || loginResult.error) {
        setError("Conta criada, mas não foi possível iniciar sessão. Entra com os teus dados.");
        return;
      }

      const session = await getSession();
      router.replace(
        session?.user.role === "ADMIN" || session?.user.role === "BARBER"
          ? "/dashboard"
          : "/"
      );
      router.refresh();
    } catch {
      setError("Ocorreu um erro ao criar a conta. Tenta novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      className={`relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12 transition-colors ${
        isDark ? "bg-black text-white" : "bg-rose-50 text-zinc-900"
      }`}
    >
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full blur-3xl ${
          isDark ? "bg-red-600/15" : "bg-rose-300/40"
        }`}
      />
      <section
        className={`relative w-full max-w-md rounded-3xl border p-7 shadow-2xl sm:p-10 ${
          isDark
            ? "border-zinc-800 bg-zinc-950 shadow-black/60"
            : "border-rose-100 bg-white shadow-rose-200/60"
        }`}
      >
        <div className="mb-8 flex items-center justify-between">
          <Link
            href="/"
            className={`text-xs font-semibold transition ${
              isDark ? "text-zinc-400 hover:text-red-400" : "text-zinc-600 hover:text-red-600"
            }`}
          >
            ← Voltar ao início
          </Link>
          <ThemeToggle />
        </div>

        <header className="mb-8 text-center">
          <Link href="/" className="text-2xl font-black tracking-tight">
            VIEGAS<span className="text-red-600">.</span>
            <span
              className={`ml-1 rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-widest ${
                isDark
                  ? "border-red-500/30 bg-red-500/10 text-red-400"
                  : "border-rose-200 bg-rose-50 text-red-700"
              }`}
            >
              Barber
            </span>
          </Link>
          <h1 className="mt-5 text-2xl font-extrabold">Criar conta</h1>
          <p className={`mt-2 text-sm ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
            Escolhe como queres entrar e cria a tua palavra-passe Viegas Barber.
          </p>
        </header>

        <div
          role="tablist"
          aria-label="Método de registo"
          className={`mb-5 grid grid-cols-2 gap-1 rounded-xl border p-1 ${
            isDark ? "border-zinc-800 bg-zinc-900" : "border-rose-100 bg-rose-50"
          }`}
        >
          {([
            ["instagram", "@ do Instagram"],
            ["gmail", "Gmail / email"],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={method === value}
              onClick={() => {
                setMethod(value);
                setError("");
              }}
              className={`rounded-lg px-3 py-2.5 text-sm font-bold transition ${
                method === value
                  ? "bg-red-600 text-white shadow"
                  : isDark
                    ? "text-zinc-400 hover:text-white"
                    : "text-zinc-600 hover:text-red-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {error && (
          <div
            role="alert"
            className={`mb-5 rounded-xl border p-3 text-sm ${
              isDark
                ? "border-red-500/30 bg-red-950/40 text-red-300"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="mb-1.5 block text-sm font-semibold">
              Nome
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              minLength={2}
              maxLength={80}
              required
              disabled={loading}
              value={name}
              onChange={(event) => setName(event.target.value)}
              className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/20 disabled:opacity-60 ${
                isDark
                  ? "border-zinc-800 bg-zinc-900 text-white placeholder-zinc-600"
                  : "border-zinc-200 bg-white text-zinc-900 placeholder-zinc-400"
              }`}
            />
          </div>
          {method === "instagram" ? (
            <div>
              <label htmlFor="instagram-handle" className="mb-1.5 block text-sm font-semibold">
                @ do Instagram
              </label>
              <input
                id="instagram-handle"
                type="text"
                autoComplete="username"
                maxLength={31}
                required
                disabled={loading}
                value={instagramHandle}
                onChange={(event) => setInstagramHandle(event.target.value)}
                placeholder="@o_teu_utilizador"
                className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/20 disabled:opacity-60 ${
                  isDark
                    ? "border-zinc-800 bg-zinc-900 text-white placeholder-zinc-600"
                    : "border-zinc-200 bg-white text-zinc-900 placeholder-zinc-400"
                }`}
              />
            </div>
          ) : (
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-semibold">
              Gmail ou email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              maxLength={254}
              required
              disabled={loading}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="nome@gmail.com"
              className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/20 disabled:opacity-60 ${
                isDark
                  ? "border-zinc-800 bg-zinc-900 text-white placeholder-zinc-600"
                  : "border-zinc-200 bg-white text-zinc-900 placeholder-zinc-400"
              }`}
            />
          </div>
          )}
          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-semibold">
              Cria a tua palavra-passe Viegas Barber{" "}
              <span className="font-normal opacity-70">(mínimo 8 caracteres)</span>
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                minLength={8}
                maxLength={128}
                required
                disabled={loading}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className={`w-full rounded-xl border px-4 py-3 pr-12 text-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/20 disabled:opacity-60 ${
                  isDark
                    ? "border-zinc-800 bg-zinc-900 text-white"
                    : "border-zinc-200 bg-white text-zinc-900"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? "Ocultar palavra-passe" : "Mostrar palavra-passe"}
                aria-pressed={showPassword}
                className={`absolute inset-y-0 right-0 flex w-12 items-center justify-center ${
                  isDark ? "text-zinc-400 hover:text-red-400" : "text-zinc-500 hover:text-red-600"
                }`}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <p className={`mt-2 text-xs ${isDark ? "text-zinc-500" : "text-zinc-500"}`}>
              Não uses a palavra-passe do Instagram nem do Gmail. Esta palavra-passe é
              criada só para a tua conta na Viegas Barber.
            </p>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="brand-button mt-2 w-full rounded-xl px-4 py-3.5 text-sm font-bold shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "A criar conta..." : "Criar conta"}
          </button>
        </form>

        <div
          className={`mt-7 border-t pt-5 text-center text-sm ${
            isDark ? "border-zinc-800 text-zinc-400" : "border-rose-100 text-zinc-500"
          }`}
        >
          Já tens conta?{" "}
          <Link href="/login" className="font-bold text-red-600 hover:text-red-500">
            Iniciar sessão
          </Link>
        </div>
      </section>
    </main>
  );
}
