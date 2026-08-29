import test from "node:test";
import assert from "node:assert/strict";
import { validateGitHubActionsClaims, type GitHubActionsClaims } from "../lib/github-actions-oidc";

const now = 1_800_000_000;

function validClaims(overrides: Partial<GitHubActionsClaims> = {}): GitHubActionsClaims {
  return {
    iss: "https://token.actions.githubusercontent.com",
    aud: "article6-crm-automation",
    exp: now + 300,
    nbf: now - 10,
    iat: now - 10,
    repository: "Fredilly/Article6",
    repository_owner: "Fredilly",
    actor: "Fredilly",
    event_name: "issues",
    ref: "refs/heads/main",
    workflow_ref: "Fredilly/Article6/.github/workflows/crm-automation.yml@refs/heads/main",
    ...overrides,
  };
}

test("accepts the dedicated CRM workflow on main", () => {
  assert.doesNotThrow(() => validateGitHubActionsClaims(validClaims(), now));
});

test("rejects a different actor", () => {
  assert.throws(() => validateGitHubActionsClaims(validClaims({ actor: "someone-else" }), now), /actor/i);
});

test("rejects a different workflow", () => {
  assert.throws(
    () => validateGitHubActionsClaims(validClaims({ workflow_ref: "Fredilly/Article6/.github/workflows/other.yml@refs/heads/main" }), now),
    /workflow/i,
  );
});

test("rejects expired tokens", () => {
  assert.throws(() => validateGitHubActionsClaims(validClaims({ exp: now - 1 }), now), /expired/i);
});
