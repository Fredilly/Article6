import type { NextApiRequest, NextApiResponse } from "next";
import { recordEmailTrackingEvent } from "../../../../lib/email-tracking";

const TRANSPARENT_GIF = Buffer.from("R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==", "base64");

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Content-Type", "image/gif");
  res.setHeader("Content-Length", String(TRANSPARENT_GIF.length));
  res.setHeader("Cache-Control", "private, no-store, no-cache, must-revalidate, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive");

  if (req.method !== "GET" && req.method !== "HEAD") {
    res.status(200).send(TRANSPARENT_GIF);
    return;
  }

  const token = typeof req.query.token === "string" ? req.query.token : "";
  if (req.method === "GET") {
    try {
      await recordEmailTrackingEvent(token, "OPEN", req.headers["user-agent"]);
    } catch (error) {
      console.error("Email open tracking failed", error instanceof Error ? error.message : "unknown error");
    }
  }
  res.status(200).send(TRANSPARENT_GIF);
}
