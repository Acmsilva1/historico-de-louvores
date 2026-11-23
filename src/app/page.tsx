import { Suspense } from "react";
import { HomeContent } from "./HomeContent";

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <main className="card p-5 text-[var(--muted)]">Carregando…</main>
      }
    >
      <HomeContent />
    </Suspense>
  );
}