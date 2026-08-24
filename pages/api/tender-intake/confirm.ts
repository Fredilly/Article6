import type { NextApiRequest, NextApiResponse } from "next";
import { getBucketName, resolveUploadReference, verifyObjectExists } from "../../../lib/r2";
import { commitTenderIntake } from "../../../lib/tender-intake-store";
import { tenderDocumentDescriptor, validateTenderIntake, validateVerifiedTenderObject, type TenderIntakeMetadata } from "../../../lib/tender-intake";

interface ConfirmTenderFile {
  fileName: string;
  fileSize: number;
  uploadReference: string;
}

interface ConfirmTenderBody extends Omit<TenderIntakeMetadata, "files"> {
  intakeReference: string;
  files: ConfirmTenderFile[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = req.body as Partial<ConfirmTenderBody>;
  if (typeof body.intakeReference !== "string" || !/^A6T-\d{8}-[0-9A-F]{8}$/.test(body.intakeReference)) {
    return res.status(400).json({ error: "Invalid tender intake reference." });
  }

  const metadataFiles = Array.isArray(body.files)
    ? body.files.map((file) => ({ fileName: file.fileName, fileSize: file.fileSize }))
    : [];
  const validationError = validateTenderIntake({ ...body, files: metadataFiles });
  if (validationError) return res.status(400).json({ error: validationError });

  try {
    const seenSubmissionReferences = new Set<string>();
    const verifiedFiles = [];

    for (const file of body.files!) {
      if (!file.uploadReference) return res.status(400).json({ error: `Missing upload reference for ${file.fileName}.` });
      const resolved = resolveUploadReference(file.uploadReference);
      if (!resolved) return res.status(400).json({ error: `Upload reference for ${file.fileName} is invalid or expired.` });
      if (seenSubmissionReferences.has(resolved.submissionReference)) return res.status(400).json({ error: "Duplicate uploaded document reference." });
      seenSubmissionReferences.add(resolved.submissionReference);

      const descriptor = tenderDocumentDescriptor(file.fileName)!;
      if (!resolved.key.endsWith(`.${descriptor.extension}`)) return res.status(400).json({ error: `Uploaded file type does not match ${file.fileName}.` });

      const stored = await verifyObjectExists(resolved.key);
      const storedError = validateVerifiedTenderObject(stored, { fileName: file.fileName, fileSize: file.fileSize });
      if (storedError) return res.status(400).json({ error: storedError });

      verifiedFiles.push({
        key: resolved.key,
        submissionReference: resolved.submissionReference,
        fileName: file.fileName,
        fileSize: stored.size,
        contentType: stored.contentType!,
      });
    }

    const result = await commitTenderIntake({
      intakeReference: body.intakeReference,
      contactName: body.contactName!.trim(),
      workEmail: body.workEmail!.trim(),
      organization: body.organization!.trim(),
      tenderTitle: body.tenderTitle!.trim(),
      buyer: body.buyer?.trim() || undefined,
      referenceNumber: body.referenceNumber?.trim() || undefined,
      submissionDeadline: body.submissionDeadline || undefined,
      deadlineTimezone: body.deadlineTimezone?.trim() || undefined,
      note: body.note?.trim() || undefined,
      bucket: getBucketName(),
      files: verifiedFiles,
    });

    return res.status(200).json({
      success: true,
      intakeReference: body.intakeReference,
      tenderOpportunityId: result.tenderOpportunityId,
      created: result.created,
      message: "Your tender package has been received for independent pre-submission review.",
    });
  } catch (error) {
    console.error("[tender-intake confirm]", error instanceof Error ? error.message : String(error));
    return res.status(500).json({ error: "Failed to confirm the tender package. No CRM intake was created. Please try again." });
  }
}
