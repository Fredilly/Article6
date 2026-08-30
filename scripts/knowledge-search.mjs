import { readAllRecords, scoreRecord } from "./knowledge-lib.mjs";

const query = process.argv.slice(2).join(" ").trim();
if (!query) {
  console.error('Usage: npm run knowledge:search -- "search terms"');
  process.exit(1);
}

const results = readAllRecords()
  .map((record) => ({ record, score: scoreRecord(record, query) }))
  .filter(({ score }) => score > 0)
  .sort((a, b) => b.score - a.score || String(b.record.occurredAt || b.record.capturedAt).localeCompare(String(a.record.occurredAt || a.record.capturedAt)))
  .slice(0, 20);

if (!results.length) {
  console.log("No matching knowledge records.");
  process.exit(0);
}

for (const { record, score } of results) {
  console.log(`\n[${score}] ${record.title}`);
  console.log(`${record.kind} | ${record.certainty} | ${record.source?.type}${record.source?.ref ? ` | ${record.source.ref}` : ""}`);
  console.log(record.content.length > 500 ? `${record.content.slice(0, 500)}…` : record.content);
  if (record.links && Object.keys(record.links).length) console.log(`links: ${JSON.stringify(record.links)}`);
}
