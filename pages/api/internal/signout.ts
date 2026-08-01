import type { NextApiRequest, NextApiResponse } from "next";
import { getExpiredInternalSessionCookie, INTERNAL_SIGNOUT_REDIRECT } from "../../../lib/internal-auth";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  res.setHeader("Set-Cookie", getExpiredInternalSessionCookie());
  return res.redirect(303, INTERNAL_SIGNOUT_REDIRECT);
}
