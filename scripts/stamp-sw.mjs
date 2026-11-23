import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const buildId =
  process.env.NEXT_PUBLIC_APP_BUILD_ID?.trim() ||
  process.env.APP_BUILD_ID?.trim() ||
  "dev";

const template = readFileSync(resolve(root, "public/sw.template.js"), "utf8");
const out = template.replaceAll("__BUILD_ID__", buildId);
writeFileSync(resolve(root, "public/sw.js"), out, "utf8");
console.log(`[stamp-sw] build=${buildId}`);