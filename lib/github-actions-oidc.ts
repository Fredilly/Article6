import { createPublicKey, verify } from "crypto";

const ISSUER = "https://token.actions.githubusercontent.com";
const AUDIENCE = "article6-crm-automation";
const EXPECTED_REPOSITORY = "Fredilly/Article6";
const EXPECTED_ACTOR = "Fredilly";
const EXPECTED_REF = "refs/heads/main";
const EXPECTED_WORKFLOW_REF = "Fredilly/Article6/.github/workflows/crm-automation.yml@refs/heads/main";

interface JwtHeader {
  alg?: string;
  kid?: string;
}

interface GitHubJwk extends JsonWebKey {
  kid?: string;
}

export interface GitHubActionsClaims {
  iss?: string;
  aud?: string | string[];
  exp?: number;
  nbf?: number;
  iat?: number;
  repository?: string;
  repository_owner?: string;
  actor?: string;
  event_name?: string;
  ref?: string;
  workflow_ref?: string;
}

function decodeJson<T>(value: string): T {
  return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as T;
}

export function validateGitHubActionsClaims(claims: GitHubActionsClaims, nowSeconds = Math.floor(Date.now() / 1000)): void {
  const audiences = Array.isArray(claims.aud) ? claims.aud : claims.aud ? [claims.aud] : [];
  if (claims.iss !== ISSUER) throw new Error("Invalid GitHub OIDC issuer.");
  if (!audiences.includes(AUDIENCE)) throw new Error("Invalid GitHub OIDC audience.");
  if (!claims.exp || claims.exp <= nowSeconds) throw new Error("Expired GitHub OIDC token.");
  if (claims.nbf && claims.nbf > nowSeconds + 60) throw new Error("GitHub OIDC token is not active yet.");
  if (claims.iat && claims.iat > nowSeconds + 60) throw new Error("GitHub OIDC token issue time is invalid.");
  if (claims.repository !== EXPECTED_REPOSITORY || claims.repository_owner !== "Fredilly") throw new Error("GitHub OIDC repository is not allowed.");
  if (claims.actor !== EXPECTED_ACTOR) throw new Error("GitHub OIDC actor is not allowed.");
  if (claims.event_name !== "issues") throw new Error("GitHub OIDC event is not allowed.");
  if (claims.ref !== EXPECTED_REF) throw new Error("GitHub OIDC ref is not allowed.");
  if (claims.workflow_ref !== EXPECTED_WORKFLOW_REF) throw new Error("GitHub OIDC workflow is not allowed.");
}

let jwksCache: { expiresAt: number; keys: GitHubJwk[] } | undefined;

async function getJwks(): Promise<GitHubJwk[]> {
  const now = Date.now();
  if (jwksCache && jwksCache.expiresAt > now) return jwksCache.keys;
  const response = await fetch(`${ISSUER}/.well-known/jwks`, { cache: "no-store" });
  if (!response.ok) throw new Error("Unable to fetch GitHub OIDC signing keys.");
  const body = (await response.json()) as { keys?: GitHubJwk[] };
  if (!Array.isArray(body.keys)) throw new Error("Invalid GitHub OIDC signing-key response.");
  jwksCache = { expiresAt: now + 60 * 60 * 1000, keys: body.keys };
  return body.keys;
}

export async function verifyGitHubActionsOidc(token: string): Promise<GitHubActionsClaims> {
  const [encodedHeader, encodedPayload, encodedSignature] = token.split(".");
  if (!encodedHeader || !encodedPayload || !encodedSignature) throw new Error("Malformed GitHub OIDC token.");

  const header = decodeJson<JwtHeader>(encodedHeader);
  const claims = decodeJson<GitHubActionsClaims>(encodedPayload);
  if (header.alg !== "RS256" || !header.kid) throw new Error("Unsupported GitHub OIDC token algorithm.");

  const keys = await getJwks();
  const jwk = keys.find((candidate) => candidate.kid === header.kid);
  if (!jwk) throw new Error("Unknown GitHub OIDC signing key.");

  const key = createPublicKey({ key: jwk, format: "jwk" });
  const valid = verify(
    "RSA-SHA256",
    Buffer.from(`${encodedHeader}.${encodedPayload}`),
    key,
    Buffer.from(encodedSignature, "base64url"),
  );
  if (!valid) throw new Error("Invalid GitHub OIDC token signature.");

  validateGitHubActionsClaims(claims);
  return claims;
}
