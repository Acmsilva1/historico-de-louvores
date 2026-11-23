import { Suspense } from "react";
import { HistoricoContent } from "./HistoricoContent";

export default function HistoricoPage() {
  return (
    <Suspense
      fallback={
        <main className="card p-5 text-[var(--muted)]">Carregando histórico…</main>
      }
    >
      <HistoricoContent />
    </Suspense>
  );
}