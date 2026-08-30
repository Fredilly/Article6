import fs from "node:fs";
import path from "node:path";
import { KNOWLEDGE_DIR, normalizeRecord, ensureKnowledgeDir } from "./knowledge-lib.mjs";

ensureKnowledgeDir();
let checked = 0;
for (const name of fs.readdirSync(KNOWLEDGE_DIR).filter((name) => name.endsWith(".json")).sort()) {
  const filePath = path.join(KNOWLEDGE_DIR, name);
  const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const normalized = normalizeRecord(parsed);
  if (normalized.id !== parsed.id) throw new Error(`${name}: unstable id`);
  checked += 1;
}
console.log(`Knowledge store OK: ${checked} record(s) checked.`);
