import Head from 'next/head';
import ParentHome from '../components/ParentHome';

export default function HomePage() {
  return (
    <>
      <Head>
        <title>Article6 — Specialist review for high-consequence documents</title>
        <meta
          name="description"
          content="Article6 builds specialist review services for high-consequence documents and expensive, rules-heavy decisions."
        />
      </Head>
      <ParentHome />
    </>
  );
}
