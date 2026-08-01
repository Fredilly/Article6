import type { NextApiRequest } from "next";

export const INTERNAL_SESSION_COOKIE = "article6_internal_upload";
export const INTERNAL_SIGNOUT_REDIRECT = "/internal/submissions/new";
const SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;

export function getExpiredInternalSessionCookie(secure = process.env.NODE_ENV === "production"): string {
  return `${INTERNAL_SESSION_COOKIE}=; Max-Age=0; Path=/; HttpOnly; SameSite=Strict${secure ? "; Secure" : ""}`;
}

function encode(value: string): Uint8Array {
  return new TextEncoder().encode(value);
}

function toBase64Url(bytes: ArrayBuffer): string {
  let binary = "";
  new Uint8Array(bytes).forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function signature(payload: string, secret: string): Promise<string> {
  const key = await globalThis.crypto.subtle.importKey(
    "raw", encode(secret) as BufferSource, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  return toBase64Url(await globalThis.crypto.subtle.sign("HMAC", key, encode(payload) as BufferSource));
}

export async function createInternalSessionToken(username: string, secret: string, now = Date.now()): Promise<string> {
  const timestamp = String(now);
  return `${timestamp}.${await signature(`${username}.${timestamp}`, secret)}`;
}

export async function isValidInternalSessionToken(token: string | undefined, username: string, secret: string, now = Date.now()): Promise<boolean> {
  if (!token || !username || !secret) return false;
  const [timestamp, providedSignature] = token.split(".");
  const issuedAt = Number(timestamp);
  if (!timestamp || !providedSignature || !Number.isFinite(issuedAt) || now - issuedAt > SESSION_MAX_AGE_SECONDS * 1000 || issuedAt > now + 60_000) return false;
  const expected = await signature(`${username}.${timestamp}`, secret);
  return expected === providedSignature;
}

export async function hasInternalUploadSession(req: NextApiRequest): Promise<boolean> {
  const cookieHeader = req.headers.cookie || "";
  const token = cookieHeader.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${INTERNAL_SESSION_COOKIE}=`))?.split("=").slice(1).join("=");
  return isValidInternalSessionToken(token, process.env.INTERNAL_UPLOAD_USERNAME || "", process.env.INTERNAL_UPLOAD_PASSWORD || "");
}
