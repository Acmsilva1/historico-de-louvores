"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CULTO_TIPO_LABEL } from "@/lib/types";

type WeekPayload = {
  from: string;
  to: string;
  cultos: Array<{
    id: string;
    data: string;
    tipo: string;
    titulo: string | null;
    culto_louvor: Array<{
      id: string;
      ordem: number;
      louvor: { numero: string | null; titulo: string; tipo: string } | null;
    }>;
  }>;
};

function fmt(date: string) {
  const [y, m, d] = date.split("-");
  return `${d}/${m}/${y}`;
}

export default function HomePage() {
  const [data, setData] = useState<WeekPayload | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/cultos?mode=week")
      .then(async (r) => {
        if (!r.ok) throw new Error("falha");
        setData(await r.json());
      })
      .catch(() => setError("Não foi possível carregar a semana."));
  }, []);

  return (
    <main className="space-y-4">
      <div className="card flex items-center justify-between gap-3 p-4">
        <div>
          <p className="text-sm text-[var(--muted)]">Semana atual</p>
          <p className="text-lg font-medium">
            {data ? `${fmt(data.from)} — ${fmt(data.to)}` : "Carregando…"}
          </p>
        </div>
        <Link href="/lancar" className="btn" style={{ width: "auto" }}>
          Lançar culto
        </Link>
      </div>

      {error ? <p className="text-[var(--danger)]">{error}</p> : null}

      {(data?.cultos || []).length === 0 && data ? (
        <div className="card p-5 text-[var(--muted)]">
          Nenhum culto lançado nesta semana. Use <strong>Lançar</strong> para registrar.
        </div>
      ) : null}

      <div className="space-y-3">
        {(data?.cultos || []).map((c) => (
          <section key={c.id} className="card p-4">
            <div className="mb-2 flex items-baseline justify-between gap-2">
              <h2 className="text-lg font-semibold">
                {CULTO_TIPO_LABEL[c.tipo] || c.tipo}
              </h2>
              <span className="text-sm text-[var(--muted)]">{fmt(c.data)}</span>
            </div>
            <ul className="space-y-1.5">
              {[...(c.culto_louvor || [])]
                .sort((a, b) => a.ordem - b.ordem)
                .map((item) => (
                  <li key={item.id} className="flex gap-2 text-sm">
                    <span className="w-10 shrink-0 text-[var(--muted)]">
                      {item.louvor?.numero || "—"}
                    </span>
                    <span>{item.louvor?.titulo}</span>
                  </li>
                ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
