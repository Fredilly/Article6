import fs from "node:fs";
import { ensureKnowledgeDir, normalizeRecord, recordPath } from "./knowledge-lib.mjs";

const inputPath = process.argv[2];
if (!inputPath) {
  console.error("Usage: npm run knowledge:ingest -- path/to/record.json");
  process.exit(1);
}

const raw = JSON.parse(fs.readFileSync(inputPath, "utf8"));
const inputs = Array.isArray(raw) ? raw : [raw];
ensureKnowledgeDir();

for (const input of inputs) {
  const record = normalizeRecord(input);
  const target = recordPath(record.id);
  fs.writeFileSync(target, `${JSON.stringify(record, null, 2)}\n`, "utf8");
  console.log(`${record.id}\t${record.kind}\t${record.title}`);
}
