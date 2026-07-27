import Head from 'next/head';
import PreviewHero from '../../../components/preview/PreviewHero';
import SectionHeading from '../../../components/preview/SectionHeading';
import PrincipleCard from '../../../components/preview/PrincipleCard';

export default function AboutPage() {
  return (
    <>
      <Head>
        <title>About Article6</title>
        <meta
          name="description"
          content="Article6 develops evidence-readiness tools and assessments for carbon project validation."
        />
      </Head>

      <PreviewHero
        headline="About Article6"
        body="Article6 develops evidence-readiness tools and assessments for carbon project validation."
      />

      {/* Company description */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-24">
        <div className="max-w-3xl mx-auto">
          <p className="text-base md:text-lg text-gray-700 leading-relaxed">
            We help carbon project teams translate methodology requirements into structured evidence
            reviews, identify preparation gaps, and improve documentation readiness before external
            validation.
          </p>
          <p className="mt-4 text-base text-gray-700 leading-relaxed">
            Our current focus is VM0007 v1.8 and REDD+ project documentation.
          </p>
        </div>
      </section>

      {/* Principles */}
      <section className="bg-gray-50 border-y border-gray-200">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
          <SectionHeading heading="Our operating principles" />
          <div className="mt-12 max-w-3xl mx-auto grid grid-cols-1 gap-4">
            <PrincipleCard title="Evidence before claims">
              Conclusions should be supported by identifiable project documentation.
            </PrincipleCard>
            <PrincipleCard title="Human-reviewed outputs">
              Client-facing findings require review rather than automatic acceptance.
            </PrincipleCard>
            <PrincipleCard title="Traceable references">
              Evidence should be connected to its source and location wherever possible.
            </PrincipleCard>
            <PrincipleCard title="Methodology-specific analysis">
              Assessments should reflect the applicable methodology and version.
            </PrincipleCard>
            <PrincipleCard title="Independence from VVB decisions">
              Article6 prepares projects for review but does not replace or influence the VVB&apos;s
              independent decision.
            </PrincipleCard>
          </div>
        </div>
      </section>
    </>
  );
}
