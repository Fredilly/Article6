export const SCOOP_LEARNING_PATH = "/internal/sales/visual-commerce/learning";

export type LearningReaderConfig = Record<string, string | undefined>;

export function isLearningReaderAuthorization(
  authorization: string | undefined | null,
  env: LearningReaderConfig,
): boolean {
  const username = env.INTERNAL_SCOOP_READER_USERNAME;
  const password = env.INTERNAL_SCOOP_READER_PASSWORD;
  // Keep the reader identity distinct from every broader role.
  if (!username || !password || username === env.INTERNAL_UPLOAD_USERNAME ||
      username === env.INTERNAL_SALES_AGENT_USERNAME || !authorization?.startsWith("Basic ")) return false;
  try {
    const decoded = atob(authorization.slice(6));
    const separator = decoded.indexOf(":");
    return separator >= 0 && decoded.slice(0, separator) === username &&
      decoded.slice(separator + 1) === password;
  } catch {
    return false;
  }
}

export function isLearningReaderActive(env: LearningReaderConfig, now = Date.now()): boolean {
  const expiresAt = Date.parse(env.INTERNAL_SCOOP_READER_EXPIRES_AT || "");
  return Number.isFinite(expiresAt) && expiresAt > now;
}

export function isLearningReaderRequestAllowed(pathname: string, method: string): boolean {
  // Exact match also rejects sibling routes, nested paths and export endpoints.
  return pathname === SCOOP_LEARNING_PATH && (method === "GET" || method === "HEAD");
}
