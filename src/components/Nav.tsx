"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const LINKS = [
  { href: "/", label: "Semana" },
  { href: "/lancar", label: "Lançar" },
  { href: "/buscar", label: "Buscar" },
  { href: "/ranking", label: "Ranking" },
];

export function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  if (pathname === "/login") return null;

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  }

  return (
    <header className="mb-5">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <p className="text-xs tracking-[0.18em] text-[var(--muted)] uppercase">Igreja</p>
          <h1 className="text-2xl font-semibold tracking-tight">Histórico de Louvores</h1>
        </div>
        <button
          className="btn secondary"
          style={{ width: "auto", padding: "0.45rem 0.8rem", fontSize: "0.85rem" }}
          type="button"
          onClick={logout}
        >
          Sair
        </button>
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
