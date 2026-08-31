import type { NextApiRequest, NextApiResponse } from "next";
import { hasInternalUploadSession } from "../../../lib/internal-auth";
import { createCollateralDownloadUrl, createCollateralUpload, deleteCollateralObject, verifyCollateralObject } from "../../../lib/sales-collateral-storage";
import { deleteSalesCollateral, getSalesCollateral, getSalesCollateralContext, isSalesCollateralDocumentType, listSalesCollateral, recordSalesCollateral, updateSalesCollateral } from "../../../lib/sales-collateral-store";

function s(v: unknown) { return typeof v === "string" ? v.trim() : ""; }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!(await hasInternalUploadSession(req))) return res.status(401).json({ error: "Internal session required." });
  try {
    if (req.method === "GET" && s(req.query.action) === "download") {
      const item = await getSalesCollateral(s(req.query.id));
      if (!item) return res.status(404).json({ error: "Collateral not found." });
      return res.redirect(302, await createCollateralDownloadUrl(item.storagePath, item.fileName, item.fileType));
    }
    if (req.method === "GET") {
      const organizationId = s(req.query.organizationId) || undefined;
      const tenderOpportunityId = s(req.query.tenderOpportunityId) || undefined;
      const contactId = s(req.query.contactId) || undefined;
      const context = await getSalesCollateralContext({ organizationId, tenderOpportunityId });
      const collateral = await listSalesCollateral({ organizationId: context.organizationId, tenderOpportunityId, contactId });
      return res.status(200).json({ collateral, context });
    }
    if (req.method === "POST" && s(req.body?.action) === "presign") {
      const organizationId = s(req.body?.organizationId);
      const fileName = s(req.body?.fileName);
      const contentType = s(req.body?.contentType);
      const fileSize = Number(req.body?.fileSize);
      if (!organizationId || !fileName || !contentType) return res.status(400).json({ error: "Organization, file name and content type are required." });
      return res.status(200).json(await createCollateralUpload({ organizationId, fileName, contentType, fileSize }));
    }
    if (req.method === "POST") {
      const documentType = s(req.body?.documentType);
      if (!isSalesCollateralDocumentType(documentType)) return res.status(400).json({ error: "Invalid document type." });
      const storagePath = s(req.body?.storagePath);
      const verified = await verifyCollateralObject(storagePath);
      const sentAt = s(req.body?.sentAt);
      if (sentAt && Number.isNaN(Date.parse(sentAt))) return res.status(400).json({ error: "Invalid sent date." });
      const result = await recordSalesCollateral({
        organizationId: s(req.body?.organizationId), contactId: s(req.body?.contactId) || undefined,
        tenderOpportunityId: s(req.body?.tenderOpportunityId) || undefined, interactionId: s(req.body?.interactionId) || undefined,
        fileName: s(req.body?.fileName), displayName: s(req.body?.displayName) || s(req.body?.fileName), storagePath,
        fileType: verified.fileType, fileSize: verified.fileSize, documentType, description: s(req.body?.description) || undefined,
        sentAt: sentAt ? new Date(sentAt).toISOString() : undefined,
      });
      return res.status(result.created ? 201 : 200).json(result);
    }
    if (req.method === "PATCH") {
      const documentType = s(req.body?.documentType);
      if (!isSalesCollateralDocumentType(documentType)) return res.status(400).json({ error: "Invalid document type." });
      const item = await updateSalesCollateral({ id: s(req.body?.id), organizationId: s(req.body?.organizationId), contactId: s(req.body?.contactId) || undefined, tenderOpportunityId: s(req.body?.tenderOpportunityId) || undefined, interactionId: s(req.body?.interactionId) || undefined, displayName: s(req.body?.displayName), documentType, description: s(req.body?.description) || undefined, sentAt: s(req.body?.sentAt) || undefined });
      return res.status(200).json({ collateral: item });
    }
    if (req.method === "DELETE") {
      const id = s(req.body?.id); const organizationId = s(req.body?.organizationId);
      const item = await getSalesCollateral(id);
      if (!item || item.organizationId !== organizationId) return res.status(404).json({ error: "Collateral not found." });
      await deleteCollateralObject(item.storagePath);
      await deleteSalesCollateral(id, organizationId);
      return res.status(200).json({ deleted: true });
    }
    return res.status(405).json({ error: "Method not allowed." });
  } catch (error) {
    return res.status(400).json({ error: error instanceof Error ? error.message : "Collateral operation failed." });
  }
}
