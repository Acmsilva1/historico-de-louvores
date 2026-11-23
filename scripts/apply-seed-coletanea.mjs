import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
dotenv.config({ path: path.join(root, ".env") });

const sqlPath = path.join(root, "supabase", "seed", "coletanea_icm.sql");
if (!fs.existsSync(sqlPath)) {
  console.error("Gere o seed antes:", sqlPath);
  process.exit(1);
}

function parseDbUrl(raw) {
  const m = raw.match(/^postgresql:\/\/([^:/]+):(.+)@([^@/:\[]+|\[[^\]]+\]):(\d+)(\/[^?]*)?/);
  if (m) {
    return `postgresql://${encodeURIComponent(decodeURIComponent(m[1]))}:${encodeURIComponent(decodeURIComponent(m[2]))}@${m[3]}:${m[4]}${m[5] || "/postgres"}`;
  }
  return raw;
}

const client = new pg.Client({
  connectionString: parseDbUrl(process.env.DATABASE_URL),
  ssl: { rejectUnauthorized: false },
});

await client.connect();
try {
  const before = await client.query(
    `select count(*)::int as total,
            count(*) filter (where tipo='hinario')::int as hinario,
            count(*) filter (where tipo='cias')::int as cias
     from louvor`,
  );
  console.log("antes", before.rows[0]);

  const sql = fs.readFileSync(sqlPath, "utf8");
  await client.query(sql);

  const after = await client.query(
    `select count(*)::int as total,
            count(*) filter (where tipo='hinario')::int as hinario,
            count(*) filter (where tipo='cias')::int as cias
     from louvor`,
  );
  console.log("depois", after.rows[0]);
  console.log("delta_total", after.rows[0].total - before.rows[0].total);
} finally {
  await client.end();
}
