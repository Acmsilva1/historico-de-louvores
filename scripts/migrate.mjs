import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
dotenv.config({ path: path.join(root, ".env") });

const sqlPath = path.join(root, "supabase", "migrations", "001_initial.sql");
const sql = fs.readFileSync(sqlPath, "utf8");

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL ausente no .env");
  process.exit(1);
}

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

await client.connect();
try {
  await client.query(sql);
  console.log("Migration 001_initial aplicada.");
} finally {
  await client.end();
}
