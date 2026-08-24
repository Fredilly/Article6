export const CARBON_MAX_FILE_SIZE = 150 * 1024 * 1024;
export const CARBON_MAX_FILES = 10;
export const CARBON_MAX_TOTAL_SIZE = 750 * 1024 * 1024;

export const CARBON_DOCUMENT_TYPES = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
} as const;

export type CarbonDocumentExtension = keyof typeof CARBON_DOCUMENT_TYPES;

export interface CarbonIntakeFileInput {
  fileName: string;
  fileSize: number;
  role: "PDD" | "SUPPORTING";
}

export interface CarbonIntakeMetadata {
  contactName: string;
  workEmail: string;
  organization: string;
  projectName: string;
  methodology: string;
  note?: string;
  files: CarbonIntakeFileInput[];
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function carbonDocumentDescriptor(fileName: string): { extension: CarbonDocumentExtension; contentType: string } | null {
  const match = fileName.trim().toLowerCase().match(/\.([a-z0-9]+)$/);
  const extension = match?.[1] as CarbonDocumentExtension | undefined;
  if (!extension || !(extension in CARBON_DOCUMENT_TYPES)) return null;
  return { extension, contentType: CARBON_DOCUMENT_TYPES[extension] };
}

export function validateCarbonIntake(input: Partial<CarbonIntakeMetadata>): string | null {
  if (typeof input.contactName !== "string" || !input.contactName.trim() || input.contactName.length > 200) return "Full name is required.";
  if (typeof input.workEmail !== "string" || !EMAIL_PATTERN.test(input.workEmail.trim()) || input.workEmail.length > 320) return "A valid work email is required.";
  if (typeof input.organization !== "string" || !input.organization.trim() || input.organization.length > 200) return "Organization is required.";
  if (typeof input.projectName !== "string" || !input.projectName.trim() || input.projectName.length > 300) return "Project name is required.";
  if (typeof input.methodology !== "string" || !input.methodology.trim() || input.methodology.length > 200) return "Methodology and version are required.";
  if (input.note !== undefined && (typeof input.note !== "string" || input.note.length > 4000)) return "Context must be under 4000 characters.";
  if (!Array.isArray(input.files) || input.files.length < 1) return "Upload the project PDD.";
  if (input.files.length > CARBON_MAX_FILES) return `Upload no more than ${CARBON_MAX_FILES} files at a time.`;

  const pdds = input.files.filter((file) => file?.role === "PDD");
  if (pdds.length !== 1) return "Exactly one PDD is required.";
  if (carbonDocumentDescriptor(pdds[0].fileName)?.extension !== "pdf") return "The PDD must be a PDF file.";

  let totalSize = 0;
  for (const file of input.files) {
    if (!file || (file.role !== "PDD" && file.role !== "SUPPORTING")) return "Each file must be identified as the PDD or a supporting document.";
    if (typeof file.fileName !== "string" || !file.fileName.trim() || file.fileName.length > 500) return "Each uploaded file must have a valid name.";
    if (!carbonDocumentDescriptor(file.fileName)) return "Accepted file types are PDF, DOCX, XLSX and PPTX.";
    if (typeof file.fileSize !== "number" || !Number.isFinite(file.fileSize) || file.fileSize <= 0) return `Invalid file size for ${file.fileName}.`;
    if (file.fileSize > CARBON_MAX_FILE_SIZE) return `${file.fileName} exceeds the 150 MB per-file limit.`;
    totalSize += file.fileSize;
  }
  if (totalSize > CARBON_MAX_TOTAL_SIZE) return "The total project document package must be 750 MB or less.";
  return null;
}

export function validateVerifiedCarbonObject(
  object: { exists: boolean; size: number; contentType?: string },
  declared: CarbonIntakeFileInput
): string | null {
  const descriptor = carbonDocumentDescriptor(declared.fileName);
  if (!descriptor) return "Unsupported carbon project document type.";
  if (!object.exists) return `${declared.fileName} was not found after upload.`;
  if (object.size !== declared.fileSize) return `${declared.fileName} did not upload completely.`;
  if (object.size <= 0 || object.size > CARBON_MAX_FILE_SIZE) return `${declared.fileName} has an invalid stored size.`;
  if (object.contentType !== descriptor.contentType) return `${declared.fileName} has an unexpected stored content type.`;
  return null;
}
