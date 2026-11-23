export function normalizeTitulo(titulo: string): string {
  return titulo
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function detectTipo(numero: string | null | undefined, titulo: string): "hinario" | "cias" | "outro" {
  const t = titulo.toUpperCase();
  if (t.includes("CIAS") || String(numero || "").toUpperCase() === "CIAS") return "cias";
  if (numero && /^\d+$/.test(String(numero).trim())) return "hinario";
  return "outro";
}

export function parseCultoTipo(header: string): { tipo: string; data: string | null } {
  const h = header.trim().toUpperCase();
  const dateMatch = header.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  let data: string | null = null;
  if (dateMatch) {
    const d = dateMatch[1].padStart(2, "0");
    const m = dateMatch[2].padStart(2, "0");
    let y = dateMatch[3];
    if (y.length === 2) y = `20${y}`;
    data = `${y}-${m}-${d}`;
  }

  if (h.includes("CULTO NOITE")) return { tipo: "culto_noite", data };
  if (h.includes("EBD")) return { tipo: "domingo_ebd", data };
  if (h.includes("DOMINGO")) return { tipo: "domingo", data };
  if (h.includes("SABADO") || h.includes("SÁBADO")) return { tipo: "sabado", data };
  if (h.includes("2") && h.includes("FEIRA")) return { tipo: "2a", data };
  if (h.includes("3") && h.includes("FEIRA")) return { tipo: "3a", data };
  if (h.includes("4") && h.includes("FEIRA")) return { tipo: "4a", data };
  if (h.includes("5") && h.includes("FEIRA")) return { tipo: "5a", data };
  return { tipo: "outro", data };
}
