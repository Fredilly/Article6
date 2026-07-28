import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const accountId = process.env.R2_ACCOUNT_ID;
  const bucketName = process.env.R2_BUCKET_NAME || "article6-document-submissions";
  const origin = req.headers.origin || req.headers.referer || "https://article6.org";

  if (!accountId) {
    return res.status(500).json({ error: "R2_ACCOUNT_ID not configured" });
  }

  const results: {
    style: string;
    url: string;
    optStatus?: number;
    optHeaders?: Record<string, string>;
    error?: string;
  }[] = [];

  for (const style of ["virtual-hosted", "path"] as const) {
    const host =
      style === "virtual-hosted"
        ? `${bucketName}.${accountId}.r2.cloudflarestorage.com`
        : `${accountId}.r2.cloudflarestorage.com`;

    const path =
      style === "virtual-hosted"
        ? "/submissions/cors-test.txt"
        : `/${bucketName}/submissions/cors-test.txt`;

    const url = `https://${host}${path}`;

    try {
      const optRes = await fetch(url, {
        method: "OPTIONS",
        headers: {
          Origin: origin,
          "Access-Control-Request-Method": "PUT",
        },
      });

      const headers: Record<string, string> = {};
      optRes.headers.forEach((v, k) => {
        if (k.toLowerCase().startsWith("access-control")) {
          headers[k] = v;
        }
      });

      results.push({
        style,
        url: url.slice(0, 120),
        optStatus: optRes.status,
        optHeaders: headers,
      });
    } catch (err) {
      results.push({
        style,
        url: url.slice(0, 120),
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return res.status(200).json({
    testedAt: new Date().toISOString(),
    bucket: bucketName,
    accountId: accountId ? `${accountId.slice(0, 8)}...` : "not set",
    originUsed: origin.slice(0, 100),
    results,
  });
}
