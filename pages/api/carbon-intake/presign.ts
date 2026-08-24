import { randomUUID } from "crypto";
import type { NextApiRequest, NextApiResponse } from "next";
import { generatePresignedUploadUrl } from "../../../lib/r2";
import { carbonDocumentDescriptor, validateCarbonIntake, type CarbonIntakeMetadata } from "../../../lib/carbon-intake";

function generatePackageReference(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `A6C-${date}-${randomUUID().slice(0, 8).toUpperCase()}`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = req.body as Partial<CarbonIntakeMetadata>;
  const validationError = validateCarbonIntake(body);
  if (validationError) return res.status(400).json({ error: validationError });

  try {
    const packageReference = generatePackageReference();
    const uploads = await Promise.all(
      body.files!.map(async (file) => {
        const descriptor = carbonDocumentDescriptor(file.fileName)!;
        const prepared = await generatePresignedUploadUrl({
          contentType: descriptor.contentType,
          extension: descriptor.extension,
        });
        return {
          fileName: file.fileName,
          fileSize: file.fileSize,
          role: file.role,
          contentType: descriptor.contentType,
          uploadUrl: prepared.uploadUrl,
          uploadReference: prepared.uploadReference,
          submissionReference: prepared.submissionReference,
        };
      })
    );

    return res.status(200).json({ packageReference, uploads, expiresIn: 600 });
  } catch (error) {
    console.error("[carbon-intake presign]", error instanceof Error ? error.message : String(error));
    return res.status(500).json({ error: "Failed to prepare project document uploads. Please try again." });
  }
}
