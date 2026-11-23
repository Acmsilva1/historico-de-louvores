"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { InstallPWA } from "@/components/InstallPWA";

const PAGE_TITLES: Record<string, string> = {
  "/historico": "Histórico",
  "/lancar": "Novo lançamento",
  "/buscar": "Buscar",
  "/ranking": "Ranking",
};

export function Nav() {
  const pathname = usePathname();
  const isHub = pathname === "/";

  if (isHub) {
    return (
      <header className="mb-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs tracking-[0.18em] text-[var(--muted)] uppercase">Igreja</p>
            <h1 className="text-2xl font-semibold tracking-tight">Histórico de Louvores</h1>
          </div>
          <InstallPWA />
        </div>
      </header>
    );
  }

  const title = PAGE_TITLES[pathname] || "Histórico de Louvores";

  return (
    <header className="mb-5">
      <Link
        href="/"
        className="mb-2 inline-flex items-center gap-1 text-sm text-[var(--muted)] touch-target-inline hover:text-[var(--text)]"
      >
        ← Início
      </Link>
      <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
    </header>
  );
}