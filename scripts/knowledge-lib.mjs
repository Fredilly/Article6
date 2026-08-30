import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export const KNOWLEDGE_DIR = path.resolve(process.cwd(), "knowledge/records");
export const VALID_KINDS = new Set(["organization","contact","tender","project","interaction","research","sales_rule","product_rule","objection","experiment","outcome","document"]);
export const VALID_CERTAINTY = new Set(["CONFIRMED","PROBABLE","INFERRED","UNVERIFIED","STALE"]);

export function normalizeRecord(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Knowledge record must be a JSON object");
  const title = String(input.title || "").trim();
  const content = String(input.content || "").trim();
  const kind = String(input.kind || "").trim();
  const certainty = String(input.certainty || "UNVERIFIED").trim().toUpperCase();
  if (!title) throw new Error("title is required");
  if (!content) throw new Error("content is required");
  if (!VALID_KINDS.has(kind)) throw new Error(`Invalid kind: ${kind}`);
  if (!VALID_CERTAINTY.has(certainty)) throw new Error(`Invalid certainty: ${certainty}`);

  const source = input.source && typeof input.source === "object" ? input.source : {};
  const sourceType = String(source.type || "manual").trim();
  const sourceRef = source.ref == null ? null : String(source.ref).trim() || null;
  const capturedAt = input.capturedAt ? new Date(input.capturedAt).toISOString() : new Date().toISOString();
  const occurredAt = input.occurredAt ? new Date(input.occurredAt).toISOString() : null;
  const links = input.links && typeof input.links === "object" && !Array.isArray(input.links) ? input.links : {};
  const tags = Array.isArray(input.tags) ? [...new Set(input.tags.map((tag) => String(tag).trim()).filter(Boolean))] : [];
  const id = String(input.id || crypto.createHash("sha256").update(`${kind}\n${title}\n${sourceType}\n${sourceRef || ""}\n${occurredAt || ""}`).digest("hex").slice(0, 24));

  return { id, kind, title, content, source: { type: sourceType, ref: sourceRef }, occurredAt, capturedAt, certainty, links, tags };
}

export function ensureKnowledgeDir() {
  fs.mkdirSync(KNOWLEDGE_DIR, { recursive: true });
}

export function recordPath(id) {
  return path.join(KNOWLEDGE_DIR, `${id.replace(/[^a-zA-Z0-9._-]/g, "-")}.json`);
}

export function readAllRecords() {
  ensureKnowledgeDir();
  return fs.readdirSync(KNOWLEDGE_DIR)
    .filter((name) => name.endsWith(".json"))
    .sort()
    .map((name) => JSON.parse(fs.readFileSync(path.join(KNOWLEDGE_DIR, name), "utf8")));
}

export function searchableText(record) {
  return [record.kind, record.title, record.content, record.source?.type, record.source?.ref, record.certainty, ...(record.tags || []), ...Object.values(record.links || {})]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function scoreRecord(record, query) {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return 0;
  const haystack = searchableText(record);
  const title = String(record.title || "").toLowerCase();
  return terms.reduce((score, term) => score + (haystack.includes(term) ? 1 : 0) + (title.includes(term) ? 2 : 0), 0);
}
