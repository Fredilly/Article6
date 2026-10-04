# Scoop learning reviewer

A separate HTTP Basic Auth identity can read only GET/HEAD requests to
`/internal/sales/visual-commerce/learning`. It receives no admin session cookie.
Mutation/download APIs reject reader credentials even if an old admin cookie is present.
The dashboard hides write controls and sales navigation, omits raw corrections,
session/evidence keys and query text, and sends private, no-store responses.

Configure server-only deployment variables:
- INTERNAL_SCOOP_READER_USERNAME: unique from admin and sales-agent names
- INTERNAL_SCOOP_READER_PASSWORD: randomly generated secret
- INTERNAL_SCOOP_READER_EXPIRES_AT: mandatory ISO timestamp, e.g. a 30-day expiry

Unset credentials, malformed expiry, expired access, and colliding usernames fail closed.
Revoke by removing the password or expiring the timestamp, then redeploy.
Rotate by replacing the password and redeploying. Vercel environment changes do not
change already deployed instances; verify production and remove old deployment access
when revoking. Never put these variables in NEXT_PUBLIC variables, source control, URLs,
or chat messages. Enter credentials directly into the browser authentication prompt.

Read-only does not prevent copying already visible content. Product details and
visible text are still present; raw frame data is not supplied by this dashboard.
This is an application credential, not a new SSO or magic-link account.
