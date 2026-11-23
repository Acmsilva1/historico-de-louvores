"""Gera supabase/seed/coletanea_icm.sql a partir de tmp/hinos-db.sqlite."""
from __future__ import annotations

import re
import sqlite3
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DB_PATH = ROOT / "tmp" / "hinos-db.sqlite"
OUT_PATH = ROOT / "supabase" / "seed" / "coletanea_icm.sql"


def normalize_titulo(titulo: str) -> str:
    t = unicodedata.normalize("NFD", titulo)
    t = "".join(c for c in t if unicodedata.category(c) != "Mn")
    t = t.upper()
    t = re.sub(r"[^A-Z0-9]+", " ", t)
    return re.sub(r"\s+", " ", t).strip()


def sql_str(s: str) -> str:
    return "'" + s.replace("'", "''") + "'"


def clean_titulo(nome: str) -> str:
    nome = re.sub(r"^\d+\s*[-–—.:)]\s*", "", nome or "").strip()
    return re.sub(r"\s+", " ", nome)


def extract_numero(raw_num, nome: str):
    if raw_num is not None and str(raw_num).strip() not in ("", "0"):
        n = str(raw_num).strip()
        if re.fullmatch(r"\d+", n):
            return n
    m = re.match(r"^(\d+)\s*[-–—.:)]", nome or "")
    return m.group(1) if m else None


def main() -> None:
    if not DB_PATH.exists():
        raise SystemExit(f"Arquivo ausente: {DB_PATH}")

    con = sqlite3.connect(DB_PATH)
    rows = con.execute(
        """
        SELECT hc.coletanea_id, hc.hino_numero, h.nome
        FROM hino_coletanea hc
        JOIN hino h ON h.id = hc.hino_id
        WHERE hc.coletanea_id IN (1, 2)
        ORDER BY hc.coletanea_id, CAST(NULLIF(hc.hino_numero,'') AS INTEGER)
        """
    ).fetchall()
    con.close()

    by_norm: dict[str, dict] = {}
    for coletanea_id, hino_numero, nome in rows:
        tipo = "cias" if coletanea_id == 2 else "hinario"
        titulo = clean_titulo(nome)
        if len(titulo) < 2:
            continue
        numero = extract_numero(hino_numero, nome)
        titulo_norm = normalize_titulo(titulo)
        if not titulo_norm:
            continue
        prev = by_norm.get(titulo_norm)
        if not prev:
            by_norm[titulo_norm] = {
                "numero": numero,
                "titulo": titulo.upper(),
                "titulo_norm": titulo_norm,
                "tipo": tipo,
            }
        else:
            if not prev["numero"] and numero:
                prev["numero"] = numero
            if prev["tipo"] == "outro":
                prev["tipo"] = tipo

    items = sorted(
        by_norm.values(),
        key=lambda it: (it["tipo"], int(it["numero"] or 99999), it["titulo"]),
    )

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    lines: list[str] = [
        "-- Seed catalogo ICM (numero + titulo)",
        "-- Fonte: github.com/evaristocosta/hinos-db (Coletanea ICM + CIAs)",
        "-- Idempotente: upsert por titulo_norm; nao apaga culto_louvor",
        "-- Gerado por scripts/generate_seed_coletanea.py",
        "",
        "BEGIN;",
        "",
    ]

    chunk = 80
    for i in range(0, len(items), chunk):
        slice_ = items[i : i + chunk]
        lines.append("INSERT INTO louvor (numero, titulo, titulo_norm, tipo) VALUES")
        values = []
        for it in slice_:
            num = "NULL" if it["numero"] is None else sql_str(it["numero"])
            values.append(
                f"  ({num}, {sql_str(it['titulo'])}, {sql_str(it['titulo_norm'])}, {sql_str(it['tipo'])})"
            )
        lines.append(",\n".join(values))
        lines.append(
            """ON CONFLICT (titulo_norm) DO UPDATE SET
  numero = COALESCE(NULLIF(EXCLUDED.numero, ''), louvor.numero),
  titulo = EXCLUDED.titulo,
  tipo = CASE
    WHEN louvor.tipo = 'outro' THEN EXCLUDED.tipo
    ELSE louvor.tipo
  END;"""
        )
        lines.append("")

    lines.append("COMMIT;")
    lines.append("")
    hinario = sum(1 for i in items if i["tipo"] == "hinario")
    cias = sum(1 for i in items if i["tipo"] == "cias")
    lines.append(f"-- Total upsert: {len(items)}")
    lines.append(f"-- hinario: {hinario}")
    lines.append(f"-- cias: {cias}")

    OUT_PATH.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("OK", OUT_PATH)
    print({"total": len(items), "hinario": hinario, "cias": cias})


if __name__ == "__main__":
    main()
