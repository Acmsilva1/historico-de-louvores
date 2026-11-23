"use client";

import { useEffect } from "react";
import { DIAS_LANCAR } from "@/lib/culto-dias";
import { fmtBr } from "@/lib/week";
import type { CultoTipo } from "@/lib/types";
import { CultoListEditor } from "@/components/CultoListEditor";

type Props = {
  open: boolean;
  data: string;
  tipo: CultoTipo;
  slotLabel: string;
  onClose: () => void;
  onChanged: () => void;
};

export function CultoEditModal({ open, data, tipo, slotLabel, onClose, onChanged }: Props) {
  const dia = DIAS_LANCAR.find((d) => d.tipo === tipo);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal-root" role="dialog" aria-modal="true" aria-labelledby="culto-modal-title">
      <button type="button" className="modal-backdrop" aria-label="Fechar" onClick={onClose} />
      <div className="modal-sheet card">
        <div className="modal-head">
          <div className="min-w-0">
            <p className="text-xs text-[var(--muted)] uppercase tracking-wide">Editar culto</p>
            <h2 id="culto-modal-title" className="text-lg font-semibold truncate">
              {slotLabel}
            </h2>
            <p className="text-sm text-[var(--muted)]">
              {dia?.label || tipo} · {fmtBr(data)}
            </p>
          </div>
          <button type="button" className="btn-icon touch-target" aria-label="Fechar" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          <CultoListEditor
            data={data}
            tipo={tipo}
            mode="edit"
            onSaved={onChanged}
            onDeleted={() => {
              onChanged();
              onClose();
            }}
          />
        </div>
      </div>
    </div>
  );
}
