import type { NextApiRequest, NextApiResponse } from "next";
import { isLearningReaderActive, isLearningReaderAuthorization } from "../../../lib/scoop-reader-auth";
import { getScoopLearningReport } from "../../../lib/scoop-learning";
import { aggregateScoopLearningReport } from "../../../lib/scoop-learning-reader";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "private, no-store");

  if (req.method !== "GET" && req.method !== "HEAD") {
    return res.status(405).setHeader("Allow", "GET, HEAD").json({ error: "Method not allowed." });
  }

  if (!isLearningReaderAuthorization(req.headers.authorization, process.env)) {
    res.setHeader("WWW-Authenticate", 'Basic realm="Scoop learning reader", charset="UTF-8"');
    return res.status(401).json({ error: "Reader credentials required." });
  }

  if (!isLearningReaderActive(process.env)) {
    return res.status(403).json({ error: "Learning reviewer access has expired." });
  }

  try {
    const report = aggregateScoopLearningReport(await getScoopLearningReport());
    if (req.method === "HEAD") return res.status(200).end();
    return res.status(200).json(report);
  } catch {
    return res.status(502).json({ error: "Could not load Scoop learning data." });
  }
}
