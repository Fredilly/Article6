This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Internal PDD submissions

`/internal/submissions/new` is not linked from the public site. It is protected by server-side HTTP Basic Auth using `INTERNAL_UPLOAD_USERNAME` and `INTERNAL_UPLOAD_PASSWORD`. After successful authentication, middleware issues an eight-hour, HttpOnly, SameSite cookie; the upload APIs require that cookie for non-website submissions. These variables must remain server-only and must not use `NEXT_PUBLIC_*` names.

The workflow keeps PDF bytes out of Next.js: the browser requests a short-lived presigned PUT URL, uploads directly to the configured private R2 bucket, and calls the confirmation API. Confirmation verifies the private object’s key, existence, size, and content type, persists the submission record in PostgreSQL, and then sends the internal notification. The app does not return a permanent R2 object URL. Apply `migrations/001_create_submissions.sql` to the configured database; the app also safely initializes this table on first use.

The Basic Auth credentials are shared operator credentials, not individual user accounts. Rotate them through the deployment environment when needed. Preview and production storage are isolated only when their `R2_BUCKET_NAME` values are configured to different buckets; this repository does not define a separate preview bucket automatically, so verify the configured values before uploading sensitive documents to a preview.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
