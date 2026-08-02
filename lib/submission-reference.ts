import { randomBytes } from "crypto";

const REFERENCE_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

export function generateSubmissionReference(now = new Date()): string {
  const date = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, "0")}${String(now.getUTCDate()).padStart(2, "0")}`;
  const bytes = randomBytes(6);
  const suffix = Array.from(bytes, (value) => REFERENCE_ALPHABET[value % REFERENCE_ALPHABET.length]).join("");
  return `A6-${date}-${suffix}`;
}
