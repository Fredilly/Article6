export const TENDER_MAX_FILE_SIZE = 100 * 1024 * 1024;
export const TENDER_MAX_FILES = 10;
export const TENDER_MAX_TOTAL_SIZE = 500 * 1024 * 1024;

export const TENDER_DOCUMENT_TYPES = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
} as const;

export type TenderDocumentExtension = keyof typeof TENDER_DOCUMENT_TYPES;

export interface TenderIntakeFileInput {
  fileName: string;
  fileSize: number;
}

export interface TenderIntakeMetadata {
  contactName: string;
  workEmail: string;
  organization: string;
  tenderTitle: string;
  buyer?: string;
  referenceNumber?: string;
  submissionDeadline?: string;
  deadlineTimezone?: string;
  note?: string;
  files: TenderIntakeFileInput[];
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function tenderDocumentDescriptor(fileName: string): { extension: TenderDocumentExtension; contentType: string } | null {
  const match = fileName.trim().toLowerCase().match(/\.([a-z0-9]+)$/);
  const extension = match?.[1] as TenderDocumentExtension | undefined;
  if (!extension || !(extension in TENDER_DOCUMENT_TYPES)) return null;
  return { extension, contentType: TENDER_DOCUMENT_TYPES[extension] };
}

export function validateTenderIntake(input: Partial<TenderIntakeMetadata>): string | null {
  if (typeof input.contactName !== "string" || !input.contactName.trim() || input.contactName.length > 200) return "Your name is required.";
  if (typeof input.workEmail !== "string" || !EMAIL_PATTERN.test(input.workEmail.trim()) || input.workEmail.length > 320) return "A valid work email is required.";
  if (typeof input.organization !== "string" || !input.organization.trim() || input.organization.length > 200) return "Company is required.";
  if (typeof input.tenderTitle !== "string" || !input.tenderTitle.trim() || input.tenderTitle.length > 300) return "Tender or opportunity title is required.";
  if (input.buyer !== undefined && (typeof input.buyer !== "string" || input.buyer.length > 300)) return "Buyer must be under 300 characters.";
  if (input.referenceNumber !== undefined && (typeof input.referenceNumber !== "string" || input.referenceNumber.length > 200)) return "Tender reference must be under 200 characters.";
  if (input.submissionDeadline !== undefined && input.submissionDeadline !== "" && (typeof input.submissionDeadline !== "string" || Number.isNaN(Date.parse(input.submissionDeadline)))) return "Submission deadline is invalid.";
  if (input.deadlineTimezone !== undefined && (typeof input.deadlineTimezone !== "string" || input.deadlineTimezone.length > 100)) return "Deadline timezone must be under 100 characters.";
  if (input.note !== undefined && (typeof input.note !== "string" || input.note.length > 4000)) return "Context must be under 4000 characters.";
  if (!Array.isArray(input.files) || input.files.length < 1) return "Upload at least one tender document.";
  if (input.files.length > TENDER_MAX_FILES) return `Upload no more than ${TENDER_MAX_FILES} files at a time.`;

  let totalSize = 0;
  for (const file of input.files) {
    if (!file || typeof file.fileName !== "string" || !file.fileName.trim() || file.fileName.length > 500) return "Each uploaded file must have a valid name.";
    if (!tenderDocumentDescriptor(file.fileName)) return "Accepted file types are PDF, DOCX, XLSX and PPTX.";
    if (typeof file.fileSize !== "number" || !Number.isFinite(file.fileSize) || file.fileSize <= 0) return `Invalid file size for ${file.fileName}.`;
    if (file.fileSize > TENDER_MAX_FILE_SIZE) return `${file.fileName} exceeds the 100 MB per-file limit.`;
    totalSize += file.fileSize;
  }
  if (totalSize > TENDER_MAX_TOTAL_SIZE) return "The total upload package must be 500 MB or less.";
  return null;
}

export function validateVerifiedTenderObject(
  object: { exists: boolean; size: number; contentType?: string },
  declared: TenderIntakeFileInput
): string | null {
  const descriptor = tenderDocumentDescriptor(declared.fileName);
  if (!descriptor) return "Unsupported tender document type.";
  if (!object.exists) return `${declared.fileName} was not found after upload.`;
  if (object.size !== declared.fileSize) return `${declared.fileName} did not upload completely.`;
  if (object.size <= 0 || object.size > TENDER_MAX_FILE_SIZE) return `${declared.fileName} has an invalid stored size.`;
  if (object.contentType !== descriptor.contentType) return `${declared.fileName} has an unexpected stored content type.`;
  return null;
}
