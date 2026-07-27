# Preview → Production Swap Plan

This document describes how the preview website under `/preview/verification-readiness`
can replace the current production homepage and public routes. **Do not execute this
plan in the current PR.**

## Rationale

The current production website presents Article6 as a government-oriented carbon-stack
provider. The preview website repositions Article6 as an evidence-readiness assessment
company for carbon project validation, with a focus on VM0007 v1.8 REDD+ projects.

## Route mapping

| Preview route | → | Production route |
|---|---|---|
| `/preview/verification-readiness` (homepage) | → | `/` |
| `/preview/verification-readiness/vm0007` | → | `/vm0007` |
| `/preview/verification-readiness/sample-assessment` | → | `/sample-assessment` |
| `/preview/verification-readiness/how-it-works` | → | `/how-it-works` |
| `/preview/verification-readiness/about` | → | `/about` |
| `/preview/verification-readiness/request-assessment` | → | `/request-assessment` |

## Legacy pages to remove or redirect

| Current route | Disposition |
|---|---|
| `/about-us` | Replace with `/about`. Add 308 redirect: `/about-us` → `/about`. |
| `/technology` | Remove from navigation. Archive or 410. |
| `/country` / `/countries/:path*` | Remove from navigation. Archive or 410. |
| `/projects` | Remove from navigation. Consider 410 as it fetches live Google Sheets data. |
| `/projects/nigeria/states/[slug]` | Archive. Add 410 or 301 to a retained page. |
| `/states/[slug]` | Archive. Add 410 or 301. |
| `/contact` | Replace with `/request-assessment`. Add 308 redirect. |

## Implementation steps

1. **Move preview components**: The components in `components/preview/` are already
   scoped. They can be renamed to remove the "Preview" prefix (e.g., `PreviewHeader` →
   `Header`) if taking over the production layout.

2. **Replace `_app.tsx` routing**: Remove the `isPreview` conditional. All pages will
   use the new layout.

3. **Migrate pages**: Move pages from `pages/preview/verification-readiness/` to the
   appropriate production paths in `pages/`.

4. **Update navigation**: Replace `utils/navigation.ts` links with the new site structure.

5. **Configure redirects**: Add 308 redirects in `next.config.js` for legacy routes.

6. **Remove `noindex`**: Remove the `robots: noindex,nofollow` meta tag from production pages.

7. **Sitemap**: Create a sitemap that includes the new production routes.

8. **Image assets**: Replace placeholder assets (sample PDF, hero imagery) with final approved
   assets.

## App handoff architecture

The intended future flow is:

```
article6.org/request-assessment
  → qualified request review
  → secure document intake (off-site or encrypted email)
  → private app.article6.org workspace
  → evidence review and report generation
  → report delivery
```

Reference environment variable:

```
NEXT_PUBLIC_ASSESSMENT_APP_URL=https://app.article6.org/start
```

This variable is for future use when the app intake route is available. The preview
form defaults to showing a confirmation state rather than submitting.

The following app routes should **not** be linked from the marketing site:

- `/internal`
- `/projects`
- `/methods`
- `/evidence-map`
- `/reports`

These should only be accessible after authentication in the app workspace.

## Reversion

To revert to the current production site, restore the previous commit and redeploy.
The production configuration (DNS, redirects, canonical URLs) should be unchanged
by this swap.
