export type ManualLouvorInput = { numero: string; titulo: string };

/** Interpreta número, título ou "123 · Nome" digitados na busca. */
export function parseManualLouvor(raw: string): ManualLouvorInput | null {
  const q = raw.trim();
  if (!q) return null;

  const sep = q.match(/^(\d+)\s*(?:[·\-–—/]|\.)\s*(.+)$/);
  if (sep) {
    return { numero: sep[1], titulo: sep[2].trim() };
  }

  const spaced = q.match(/^(\d+)\s+(.+)$/);
  if (spaced && spaced[2].trim().length > 0) {
    return { numero: spaced[1], titulo: spaced[2].trim() };
  }

  if (/^\d+$/.test(q)) {
    return { numero: q, titulo: q };
  }

  return { numero: "", titulo: q };
}