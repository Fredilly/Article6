export type ExtractionStatus = "completed" | "empty";

export interface QuickCheckInput {
  submissionReference: string;
  documentUrl: string;
  filename: string;
  fileSize: number;
}

export interface QuickCheckResultV1 {
  version: 1;
  fileSize: number;
  isPdf: boolean;
  pageCount: number | null;
  extractedTextPreview: string;
  checks: { name: string; passed: boolean; detail: string }[];
}

export interface QuickCheckResultV2 {
  version: 2;
  parserEngine: string;
  parserVersion: string | null;
  pageCount: number | null;
  extractedTextPreview: string;
  extractionStatus: ExtractionStatus;
  extractionError?: string;
}

export type QuickCheckResult = QuickCheckResultV1 | QuickCheckResultV2;

const MAX_PREVIEW_LENGTH = 2000;
const MAX_RESPONSE_BYTES = 256 * 1024;

function processorTimeoutMs(): number {
  const configured = Number(process.env.APP_ARTICLE6_PROCESSOR_TIMEOUT_MS || 180_000);
  return Number.isFinite(configured) && configured > 0 ? configured : 180_000;
}

function processorUrl(): string {
  const value = process.env.APP_ARTICLE6_PROCESSOR_URL?.trim();
  if (!value) throw new Error("APP_ARTICLE6_PROCESSOR_URL is not configured.");
  return value;
}

function processorSecret(): string {
  const value = process.env.APP_ARTICLE6_PROCESSOR_SECRET;
  if (!value) throw new Error("APP_ARTICLE6_PROCESSOR_SECRET is not configured.");
  return value;
}

async function readBoundedResponse(response: Response): Promise<string> {
  const declaredLength = Number(response.headers.get("content-length") || 0);
  if (declaredLength > MAX_RESPONSE_BYTES) throw new Error("Extraction processor response was too large.");
  const reader = response.body?.getReader();
  if (!reader) return response.text();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_RESPONSE_BYTES) throw new Error("Extraction processor response was too large.");
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return new TextDecoder().decode(bytes);
}

function cleanPreview(value: unknown): string {
  if (typeof value !== "string") return "";
  const cleaned = value.replace(/\r\n?/g, "\n").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]+/g, "")
    .split("\n").map((line) => line.replace(/[ \t]+/g, " ").trim()).join("\n").replace(/\n{3,}/g, "\n\n").trim();
  return cleaned.startsWith("%PDF") ? "" : cleaned.slice(0, MAX_PREVIEW_LENGTH);
}

export async function runQuickCheck(input: QuickCheckInput): Promise<QuickCheckResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), processorTimeoutMs());
  try {
    const response = await fetch(processorUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${processorSecret()}` },
      body: JSON.stringify(input),
      signal: controller.signal,
      redirect: "error",
    });
    const bodyText = await readBoundedResponse(response);
    let body: Record<string, unknown> = {};
    try { body = JSON.parse(bodyText) as Record<string, unknown>; } catch { /* use generic error */ }
    if (!response.ok) throw new Error(typeof body.error === "string" ? body.error.slice(0, 500) : "Extraction processor failed.");
    const extractedTextPreview = cleanPreview(body.extractedTextPreview);
    return {
      version: 2,
      parserEngine: typeof body.parserEngine === "string" ? body.parserEngine : "unknown",
      parserVersion: typeof body.parserVersion === "string" ? body.parserVersion : null,
      pageCount: typeof body.pageCount === "number" ? body.pageCount : null,
      extractedTextPreview,
      extractionStatus: extractedTextPreview && body.extractionStatus !== "empty" ? "completed" : "empty",
      ...(typeof body.extractionError === "string" ? { extractionError: body.extractionError.slice(0, 500) } : {}),
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw new Error("Extraction processor timed out.");
    throw error instanceof Error ? new Error(error.message.slice(0, 500)) : new Error("Extraction processor failed.");
  } finally { clearTimeout(timeout); }
}
