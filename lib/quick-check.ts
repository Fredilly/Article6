import mupdf from "mupdf";

export interface QuickCheckResult {
  version: 1;
  fileSize: number;
  isPdf: boolean;
  pageCount: number | null;
  extractedTextPreview: string;
  checks: { name: string; passed: boolean; detail: string }[];
}

function cleanExtractedText(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]+/g, "")
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** The first pipeline stage: validate the private PDF and retain a small audit preview. */
export function runQuickCheck(document: Buffer): QuickCheckResult {
  const isPdf = document.subarray(0, 5).toString("ascii") === "%PDF-";
  let pageCount: number | null = null;
  let preview = "";

  if (isPdf && document.length > 0) {
    try {
      const pdf = mupdf.Document.openDocument(document);
      pageCount = pdf.countPages();
      preview = cleanExtractedText(
        Array.from({ length: pageCount }, (_, index) => cleanExtractedText(pdf.loadPage(index).toStructuredText().asText()))
          .filter(Boolean)
          .join("\n\n"),
      ).slice(0, 2000);
    } catch {
      // Keep the signature and non-empty checks useful for malformed uploads without
      // ever falling back to storing the PDF's raw object stream as extracted text.
      const rawPageMatches = document.toString("latin1").match(/\/Type\s*\/Page(?=\s|\/|>|$)/g);
      pageCount = rawPageMatches?.length || null;
    }
  }

  return {
    version: 1, fileSize: document.length, isPdf, pageCount, extractedTextPreview: preview,
    checks: [
      { name: "pdf_signature", passed: isPdf, detail: isPdf ? "PDF signature detected." : "PDF signature is missing." },
      { name: "non_empty", passed: document.length > 0, detail: document.length > 0 ? "Document is non-empty." : "Document is empty." },
    ],
  };
}
