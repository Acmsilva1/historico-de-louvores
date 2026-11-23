"use client";

import Link from "next/link";

const OPTIONS = [
  {
    href: "/historico",
    title: "Histórico",
    desc: "Veja e edite os cultos da semana",
    icon: "📅",
  },
  {
    href: "/lancar",
    title: "Novo lançamento",
    desc: "Registre louvores de um culto novo",
    icon: "✨",
  },
  {
    href: "/buscar",
    title: "Buscar",
    desc: "Encontre louvores no catálogo",
    icon: "🔍",
  },
  {
    href: "/ranking",
    title: "Ranking",
    desc: "Louvores mais cantados",
    icon: "📊",
  },
] as const;

export function HomeContent() {
  return (
    <main className="space-y-5">
      <p className="text-[var(--muted)] text-base leading-relaxed">
        Escolha uma opção para começar.
      </p>
      <div className="hub-grid">
        {OPTIONS.map((opt) => (
          <Link key={opt.href} href={opt.href} className="hub-card card">
            <span className="hub-card-icon" aria-hidden>
              {opt.icon}
            </span>
            <div className="hub-card-body">
              <h2 className="hub-card-title">{opt.title}</h2>
              <p className="hub-card-desc">{opt.desc}</p>
            </div>
            <span className="hub-card-chevron" aria-hidden>
              ›
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}