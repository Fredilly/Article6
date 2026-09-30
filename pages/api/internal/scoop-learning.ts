import type { NextApiRequest, NextApiResponse } from "next";
import { hasInternalUploadSession } from "../../../lib/internal-auth";
import { reviewScoopLearning, type ScoopLearningReviewAction } from "../../../lib/scoop-learning";

function value(body: NextApiRequest["body"], key: string, max = 500): string {
  const candidate = body?.[key];
  return typeof candidate === "string" ? candidate.trim().slice(0, max) : "";
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!(await hasInternalUploadSession(req))) return res.status(401).json({ error: "Internal session required." });
  if (req.method !== "POST") return res.status(405).setHeader("Allow", "POST").json({ error: "Method not allowed." });

  const eventId = value(req.body, "event_id", 160);
  const resultId = value(req.body, "result_id", 180);
  const action = value(req.body, "action", 40) as ScoopLearningReviewAction;
  if (!eventId || !resultId || !["dismiss", "hard_negative", "verify_product"].includes(action)) {
    return res.status(400).json({ error: "Invalid review action." });
  }

  try {
    const product = action === "verify_product"
      ? {
          destination: value(req.body, "destination", 1200),
          id: value(req.body, "product_id", 160),
          model: value(req.body, "product_id", 160),
          title: value(req.body, "title", 300),
          brand: value(req.body, "brand", 120),
        }
      : undefined;

    if (action === "verify_product" && (!product?.destination || !product.id)) {
      return res.redirect(303, "/internal/sales/visual-commerce/learning?error=Verified%20product%20needs%20a%20product%20URL%20and%20SKU%2Fmodel.");
    }

    await reviewScoopLearning({
      event_id: eventId,
      result_id: resultId,
      action,
      note: value(req.body, "note", 300),
      ...(product ? { product } : {}),
    });

    return res.redirect(303, "/internal/sales/visual-commerce/learning?reviewed=" + encodeURIComponent(action));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not review Scoop learning item.";
    return res.redirect(303, "/internal/sales/visual-commerce/learning?error=" + encodeURIComponent(message.slice(0, 240)));
  }
}