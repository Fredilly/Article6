import Head from 'next/head';
import VerificationReadinessHome from '../components/VerificationReadinessHome';

export default function HomePage() {
  return (
    <>
      <Head>
        <title>Article6 — Pre-Validation Evidence Readiness</title>
        <meta
          name="description"
          content="Find evidence gaps before your validator does. Article6 reviews project documentation against applicable methodology requirements to identify missing, unclear, and unsupported evidence before validation begins."
        />
      </Head>
      <VerificationReadinessHome />
    </>
  );
}
