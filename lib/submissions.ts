export const MAX_FILE_SIZE = 150 * 1024 * 1024;
export const PDF_CONTENT_TYPE = "application/pdf";

export type SubmissionSource = "website" | "whatsapp" | "email" | "internal" | "other";

export interface SubmissionMetadata {
  contactName: string;
  workEmail?: string;
  organization: string;
  projectName: string;
  methodology: string;
  submissionSource: SubmissionSource;
  externalContact?: string;
  note?: string;
  fileName: string;
  fileSize: number;
}

export const NON_WEBSITE_SOURCES: SubmissionSource[] = ["whatsapp", "email", "internal", "other"];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function sanitizeOriginalFilename(fileName: string): string {
  const baseName = fileName.replace(/\\/g, "/").split("/").pop() || "document.pdf";
  const sanitized = baseName
    .normalize("NFKC")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/["']/g, "")
    .replace(/[^a-zA-Z0-9._()\- ]/g, "_")
    .replace(/^\.+/, "")
    .trim()
    .slice(0, 180);
  return sanitized || "document.pdf";
}

export function buildContentDisposition(fileName: string): string {
  return `attachment; filename="${sanitizeOriginalFilename(fileName)}"`;
}

export function isSubmissionReference(value: unknown): value is string {
  return typeof value === "string" && /^A6-\d{8}-[0-9A-HJKMNP-TV-Z]{6}$/.test(value);
}

export function validateSubmissionMetadata(
  input: Partial<SubmissionMetadata> & { submissionSource?: unknown }
): string | null {
  const value = input as Partial<SubmissionMetadata>;
  if (typeof value.submissionSource !== "string" || !["website", ...NON_WEBSITE_SOURCES].includes(value.submissionSource)) {
    return "Invalid submission source.";
  }
  if (typeof value.contactName !== "string" || !value.contactName.trim() || value.contactName.length > 200) {
    return "Contact name is required (max 200 characters).";
  }
  if (value.submissionSource === "website" && (!value.workEmail || !value.workEmail.trim())) {
    return "A valid work email is required.";
  }
  if (value.workEmail !== undefined && value.workEmail !== "" && (typeof value.workEmail !== "string" || value.workEmail.length > 320 || !EMAIL_PATTERN.test(value.workEmail.trim()))) {
    return "Please enter a valid email address.";
  }
  if (typeof value.organization !== "string" || !value.organization.trim() || value.organization.length > 200) {
    return "Organization is required (max 200 characters).";
  }
  if (typeof value.projectName !== "string" || !value.projectName.trim() || value.projectName.length > 300) {
    return "Project name is required (max 300 characters).";
  }
  if (typeof value.methodology !== "string" || !value.methodology.trim() || value.methodology.length > 200) {
    return "Methodology is required (max 200 characters).";
  }
  if (value.externalContact !== undefined && (typeof value.externalContact !== "string" || value.externalContact.length > 320)) {
    return "External contact must be under 320 characters.";
  }
  if (value.note !== undefined && (typeof value.note !== "string" || value.note.length > 2000)) {
    return "Note must be under 2000 characters.";
  }
  if (typeof value.fileName !== "string" || !value.fileName.trim() || value.fileName.length > 500) {
    return "File name is required (max 500 characters).";
  }
  if (typeof value.fileSize !== "number" || !Number.isFinite(value.fileSize) || value.fileSize <= 0) {
    return "Invalid file size.";
  }
  if (value.fileSize > MAX_FILE_SIZE) {
    return "File size must be under 150MB.";
  }
  return null;
}

export function isPdfUpload(file: { type: string; size: number }): string | null {
  if (file.type !== PDF_CONTENT_TYPE) return "Only PDF files are accepted.";
  if (file.size <= 0) return "The selected file is empty.";
  if (file.size > MAX_FILE_SIZE) return "File size must be under 150MB.";
  return null;
}

export function isApprovedSubmissionKey(key: unknown): key is string {
  return typeof key === "string" && /^submissions\/\d{4}-\d{2}-\d{2}\/[0-9a-f-]{36}\.pdf$/.test(key);
}

export function validateStoredObject(
  object: { exists: boolean; size: number; contentType?: string },
  declaredSize: number
): string | null {
  if (!object.exists) return "Uploaded file not found.";
  if (object.size <= 0) return "Uploaded file is empty.";
  if (object.size > MAX_FILE_SIZE) return "Uploaded file exceeds the 150MB limit.";
  if (object.size !== declaredSize) return "Uploaded file size does not match the declared file size.";
  if (object.contentType !== PDF_CONTENT_TYPE) return "Uploaded file is not a valid PDF.";
  return null;
}
