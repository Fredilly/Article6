import Head from 'next/head';
import ParentHome from '../components/ParentHome';

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': 'https://www.article6.org/#organization',
  name: 'Article6',
  url: 'https://www.article6.org/',
  email: 'contact@article6.org',
  description:
    'Article6 builds specialist review services for high-consequence documents and expensive, rules-heavy decisions.',
};

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': 'https://www.article6.org/#website',
  url: 'https://www.article6.org/',
  name: 'Article6',
  publisher: {
    '@id': 'https://www.article6.org/#organization',
  },
};

const webpageSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  '@id': 'https://www.article6.org/#webpage',
  url: 'https://www.article6.org/',
  name: 'Article6 — Specialist review for high-consequence documents',
  description:
    'Article6 builds specialist review services for high-consequence documents and expensive, rules-heavy decisions.',
  isPartOf: {
    '@id': 'https://www.article6.org/#website',
  },
  about: {
    '@id': 'https://www.article6.org/#organization',
  },
};

export default function HomePage() {
  return (
    <>
      <Head>
        <title>Article6 — Specialist review for high-consequence documents</title>
        <meta
          name="description"
          content="Article6 builds specialist review services for high-consequence documents and expensive, rules-heavy decisions."
        />
        <link rel="canonical" href="https://www.article6.org/" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Article6" />
        <meta property="og:title" content="Article6 — Specialist review for high-consequence documents" />
        <meta
          property="og:description"
          content="Independent specialist review for high-consequence documents, complex requirements, and evidence-heavy decisions."
        />
        <meta property="og:url" content="https://www.article6.org/" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Article6 — Specialist review for high-consequence documents" />
        <meta
          name="twitter:description"
          content="Independent specialist review for high-consequence documents, complex requirements, and evidence-heavy decisions."
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webpageSchema) }}
        />
      </Head>
      <ParentHome />
    </>
  );
}
