import { Suspense } from "react";
import { LancarContent } from "./LancarContent";

export default function LancarPage() {
  return (
    <Suspense
      fallback={<main className="card p-5 text-[var(--muted)]">Carregando formulário…</main>}
    >
      <LancarContent />
    </Suspense>
  );
}