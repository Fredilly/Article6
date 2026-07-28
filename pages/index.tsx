import Head from 'next/head';
import VerificationReadinessHome from '../components/VerificationReadinessHome';

export default function HomePage() {
  return (
    <>
      <Head>
        <title>Article6 — Pre-Validation Evidence Readiness</title>
        <meta
          name="description"
          content="Find evidence gaps before your validator does. Article6 reviews your VM0007 v1.8 project documentation against methodology requirements."
        />
      </Head>
      <VerificationReadinessHome />
    </>
  );
}
