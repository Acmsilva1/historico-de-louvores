"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { InstallPWA } from "@/components/InstallPWA";

const LINKS = [
  { href: "/", label: "Histórico" },
  { href: "/lancar", label: "Lançar" },
  { href: "/buscar", label: "Buscar" },
  { href: "/ranking", label: "Ranking" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <header className="mb-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs tracking-[0.18em] text-[var(--muted)] uppercase">Igreja</p>
          <h1 className="text-2xl font-semibold tracking-tight">Histórico de Louvores</h1>
        </div>
        <InstallPWA />
      </div>
      <nav className="nav">
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} className={pathname === l.href ? "active" : ""}>
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
