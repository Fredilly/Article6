import type { NextApiRequest, NextApiResponse } from "next";
import { getBucketName, resolveUploadReference, verifyObjectExists } from "../../../lib/r2";
import { sendSubmissionNotification } from "../../../lib/email";
import { commitCarbonIntake } from "../../../lib/carbon-intake-store";
import { carbonDocumentDescriptor, validateCarbonIntake, validateVerifiedCarbonObject, type CarbonIntakeMetadata } from "../../../lib/carbon-intake";

interface ConfirmCarbonFile {
  fileName: string;
  fileSize: number;
  role: "PDD" | "SUPPORTING";
  uploadReference: string;
}

interface ConfirmCarbonBody extends Omit<CarbonIntakeMetadata, "files"> {
  packageReference: string;
  files: ConfirmCarbonFile[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = req.body as Partial<ConfirmCarbonBody>;
  if (typeof body.packageReference !== "string" || !/^A6C-\d{8}-[0-9A-F]{8}$/.test(body.packageReference)) {
    return res.status(400).json({ error: "Invalid carbon package reference." });
  }

  const metadataFiles = Array.isArray(body.files)
    ? body.files.map((file) => ({ fileName: file.fileName, fileSize: file.fileSize, role: file.role }))
    : [];
  const validationError = validateCarbonIntake({ ...body, files: metadataFiles });
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

      const descriptor = carbonDocumentDescriptor(file.fileName)!;
      if (!resolved.key.endsWith(`.${descriptor.extension}`)) return res.status(400).json({ error: `Uploaded file type does not match ${file.fileName}.` });

      const stored = await verifyObjectExists(resolved.key);
      const storedError = validateVerifiedCarbonObject(stored, { fileName: file.fileName, fileSize: file.fileSize, role: file.role });
      if (storedError) return res.status(400).json({ error: storedError });

      verifiedFiles.push({
        key: resolved.key,
        submissionReference: resolved.submissionReference,
        fileName: file.fileName,
        fileSize: stored.size,
        contentType: stored.contentType!,
        role: file.role,
      });
    }

    const result = await commitCarbonIntake({
      packageReference: body.packageReference,
      contactName: body.contactName!.trim(),
      workEmail: body.workEmail!.trim(),
      organization: body.organization!.trim(),
      projectName: body.projectName!.trim(),
      methodology: body.methodology!.trim(),
      note: body.note?.trim() || undefined,
      bucket: getBucketName(),
      files: verifiedFiles,
    });

    if (result.created) {
      const pdd = verifiedFiles.find((file) => file.role === "PDD")!;
      const supportingCount = verifiedFiles.length - 1;
      await sendSubmissionNotification({
        contactName: body.contactName!.trim(),
        workEmail: body.workEmail!.trim().toLowerCase(),
        organization: body.organization!.trim(),
        projectName: body.projectName!.trim(),
        methodology: body.methodology!.trim(),
        submissionSource: "website",
        note: [body.note?.trim(), supportingCount ? `${supportingCount} supporting document${supportingCount === 1 ? "" : "s"} included in package ${body.packageReference}.` : `Package ${body.packageReference}.`].filter(Boolean).join("\n\n"),
        fileName: pdd.fileName,
        submissionId: result.pddSubmissionId,
        submissionReference: result.pddSubmissionReference,
        fileSize: pdd.fileSize,
        timestamp: new Date().toISOString(),
      });
    }

    return res.status(200).json({
      success: true,
      packageReference: body.packageReference,
      submissionId: result.pddSubmissionReference,
      created: result.created,
      message: "Your project document package has been received for scope review.",
    });
  } catch (error) {
    console.error("[carbon-intake confirm]", error instanceof Error ? error.message : String(error));
    return res.status(500).json({ error: "Failed to confirm the project document package. Please try again." });
  }
}
