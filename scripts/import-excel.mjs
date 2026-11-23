import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import XLSX from "xlsx";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
dotenv.config({ path: path.join(root, ".env") });

const file =
  process.argv[2] ||
  path.join(process.env.USERPROFILE || "", "Downloads", "LISTA DE LOUVORES JA CANTADOS.xlsx");

if (!fs.existsSync(file)) {
  console.error("Arquivo nao encontrado:", file);
  process.exit(1);
}
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY ausentes");
  process.exit(1);
}

const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function normalizeTitulo(titulo) {
  return titulo
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function parseHeader(header) {
  const h = String(header).trim().toUpperCase();
  const dateMatch = String(header).match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  let data = null;
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
  return null;
}

function detectTipo(numero, titulo) {
  const t = String(titulo).toUpperCase();
  if (t.includes("CIAS") || String(numero || "").toUpperCase() === "CIAS") return "cias";
  if (numero && /^\d+$/.test(String(numero))) return "hinario";
  return "outro";
}

const wb = XLSX.readFile(file);
const sheet = wb.Sheets[wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null, raw: true });
const songCols = [
  [0, 1],
  [3, 4],
  [6, 7],
  [9, 10],
  [12, 13],
  [15, 16],
];

/** @type {Map<number, {header:string, tipo:string, data:string|null, songs: any[]}>} */
const columns = new Map();

for (let r = 0; r < rows.length; r++) {
  const row = rows[r] || [];
  for (const [numIdx] of songCols) {
    const cell = row[numIdx];
    if (typeof cell === "string" && /FEIRA|SABADO|SÁBADO|DOMINGO|CULTO/i.test(cell)) {
      const parsed = parseHeader(cell);
      if (!parsed) continue;
      columns.set(numIdx, {
        header: cell,
        tipo: parsed.tipo,
        data: parsed.data,
        songs: [],
      });
    }
  }

  for (const [numIdx, titleIdx] of songCols) {
    const col = columns.get(numIdx);
    if (!col || !col.data) continue;
    const num = row[numIdx];
    const title = row[titleIdx];
    if (!title || typeof title !== "string") continue;
    if (/FEIRA|SABADO|SÁBADO|DOMINGO|LISTA|CULTO/i.test(title)) continue;
    const numero =
      num === null || num === undefined || String(num).toUpperCase() === "CIAS"
        ? String(num || "").toUpperCase() === "CIAS"
          ? "CIAS"
          : null
        : String(num).trim();
    col.songs.push({
      numero: numero === "CIAS" ? null : numero,
      titulo: title.trim(),
      tipo: detectTipo(numero, title),
    });
  }
}

// Agrupa por culto (data+tipo) na ordem das colunas encontradas
/** @type {Map<string, {data:string, tipo:string, titulo:string, songs:any[]}>} */
const cultos = new Map();
for (const col of columns.values()) {
  if (!col.data || !col.songs.length) continue;
  const key = `${col.data}|${col.tipo}`;
  const cur = cultos.get(key) || {
    data: col.data,
    tipo: col.tipo,
    titulo: col.header,
    songs: [],
  };
  // se reaparecer o mesmo culto (planilha com blocos duplicados), substitui pela ultima lista nao vazia
  cur.songs = col.songs;
  cur.titulo = col.header;
  cultos.set(key, cur);
}

console.log("Cultos detectados:", cultos.size);

let louvorCache = new Map();
async function ensureLouvor(song) {
  const titulo_norm = normalizeTitulo(song.titulo);
  if (louvorCache.has(titulo_norm)) return louvorCache.get(titulo_norm);

  const { data: existing } = await db
    .from("louvor")
    .select("*")
    .eq("titulo_norm", titulo_norm)
    .maybeSingle();
  if (existing) {
    louvorCache.set(titulo_norm, existing.id);
    return existing.id;
  }
  const { data, error } = await db
    .from("louvor")
    .insert({
      numero: song.numero,
      titulo: song.titulo,
      titulo_norm,
      tipo: song.tipo,
    })
    .select("id")
    .single();
  if (error) throw error;
  louvorCache.set(titulo_norm, data.id);
  return data.id;
}

let cultoCount = 0;
let linkCount = 0;
for (const culto of cultos.values()) {
  const { data: row, error } = await db
    .from("culto")
    .upsert(
      { data: culto.data, tipo: culto.tipo, titulo: culto.titulo },
      { onConflict: "data,tipo" },
    )
    .select("id")
    .single();
  if (error) throw error;
  await db.from("culto_louvor").delete().eq("culto_id", row.id);

  const links = [];
  for (let i = 0; i < culto.songs.length; i++) {
    const louvorId = await ensureLouvor(culto.songs[i]);
    links.push({ culto_id: row.id, louvor_id: louvorId, ordem: i + 1 });
  }
  if (links.length) {
    const { error: linkErr } = await db.from("culto_louvor").insert(links);
    if (linkErr) throw linkErr;
    linkCount += links.length;
  }
  cultoCount += 1;
  if (cultoCount % 20 === 0) console.log(`... ${cultoCount} cultos`);
}

console.log(`OK: ${cultoCount} cultos, ${linkCount} louvores vinculados, ${louvorCache.size} louvores unicos.`);
