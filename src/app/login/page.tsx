"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    });
    setLoading(false);
    if (!res.ok) {
      setError("PIN inválido");
      return;
    }
    router.replace(params.get("next") || "/");
  }

  return (
    <main className="mx-auto mt-16 max-w-sm">
      <div className="card p-6">
        <p className="text-xs tracking-[0.18em] text-[var(--muted)] uppercase">Acesso da equipe</p>
        <h1 className="mt-1 text-2xl font-semibold">Histórico de Louvores</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Digite o PIN para lançar e consultar o repertório.
        </p>
        <form className="mt-5 space-y-3" onSubmit={onSubmit}>
          <input
            className="input"
            type="password"
            inputMode="numeric"
            autoComplete="current-password"
            placeholder="PIN"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            required
          />
          {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
          <button className="btn" disabled={loading}>
            {loading ? "Entrando…" : "Entrar"}
          </button>
        </form>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
