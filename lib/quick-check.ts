export interface QuickCheckResult {
  version: 1;
  fileSize: number;
  isPdf: boolean;
  pageCount: number | null;
  extractedTextPreview: string;
  checks: { name: string; passed: boolean; detail: string }[];
}

/** The first pipeline stage: validate the private PDF and retain a small audit preview. */
export function runQuickCheck(document: Buffer): QuickCheckResult {
  const isPdf = document.subarray(0, 5).toString("ascii") === "%PDF-";
  const text = document.toString("latin1").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]+/g, " ").replace(/\s+/g, " ").trim();
  const preview = text.slice(0, 2000);
  const pageMatches = text.match(/\/Type\s*\/Page(?=\s|\/|>|$)/g);
  return {
    version: 1, fileSize: document.length, isPdf,
    pageCount: pageMatches?.length || null, extractedTextPreview: preview,
    checks: [
      { name: "pdf_signature", passed: isPdf, detail: isPdf ? "PDF signature detected." : "PDF signature is missing." },
      { name: "non_empty", passed: document.length > 0, detail: document.length > 0 ? "Document is non-empty." : "Document is empty." },
    ],
  };
}
