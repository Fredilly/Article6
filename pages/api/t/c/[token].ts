import type { NextApiRequest, NextApiResponse } from "next";
import { getEmailTrackingDestination, recordEmailTrackingEvent } from "../../../../lib/email-tracking";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "private, no-store, no-cache, must-revalidate, max-age=0");
  res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive");

  if (req.method !== "GET" && req.method !== "HEAD") {
    res.status(405).end();
    return;
  }

  const token = typeof req.query.token === "string" ? req.query.token : "";
  try {
    const destination = await getEmailTrackingDestination(token);
    if (!destination) {
      res.status(404).end();
      return;
    }
    if (req.method === "GET") {
      await recordEmailTrackingEvent(token, "CLICK", req.headers["user-agent"]);
    }
    res.redirect(302, destination);
  } catch (error) {
    console.error("Email click tracking failed", error instanceof Error ? error.message : "unknown error");
    res.status(404).end();
  }
}
