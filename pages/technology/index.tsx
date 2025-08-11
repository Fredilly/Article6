import React from 'react';
import Link from 'next/link';
import DashboardImage from '../../components/DashboardImage';
import WaitlistCTA from '../../components/WaitlistCTA';

const TechnologyPage = () => {
  return (
    <div className="container mx-auto px-6 py-12 space-y-24">
      {/* Hero Section */}
      <section className="text-center max-w-3xl mx-auto space-y-6">
        <h1 className="text-3xl md:text-5xl font-bold">
          MRV-AI — Measurement, Reporting & Verification at National Scale
        </h1>
        <p className="text-lg md:text-xl text-gray-700">
          Transparent, audit-ready carbon data for forestry, rice, and EWD initiatives — built for Nigerian states.
        </p>
        <Link
          href="/contact"
          className="inline-block rounded-xl px-6 py-3 bg-black text-white"
        >
          Join the Waitlist
        </Link>
      </section>

      {/* Government-facing Copy */}
      <section className="max-w-4xl mx-auto text-gray-700 text-center md:text-left">
        <p>
          MRV-AI is a service that continuously monitors your environmental programs, from forestry conservation to rice AWD adoption, delivering audit-ready evidence for carbon credit issuance and development reporting.
          With remote sensing, AI reasoning, and on-ground verification where needed, we cut reporting times from months to days — and keep every dataset ready for international validation.
        </p>
      </section>

      {/* Service Pillars Grid */}
      <section className="grid gap-8 md:grid-cols-3">
        <div className="rounded-2xl border p-6">
          <h3 className="text-lg font-semibold mb-2">Forestry MRV</h3>
          <p className="text-sm text-gray-700">
            Track forest cover, biomass change, and illegal encroachment using satellite NDVI and change detection. Integrate ranger patrol logs and IoT sensors for high-risk zones.
          </p>
        </div>
        <div className="rounded-2xl border p-6">
          <h3 className="text-lg font-semibold mb-2">Rice MRV (AWD)</h3>
          <p className="text-sm text-gray-700">
            Measure water use and field emissions reductions with satellite flood mapping and optional water-level IoT devices. Link farmer adoption rates to measurable carbon savings.
          </p>
        </div>
        <div className="rounded-2xl border p-6">
          <h3 className="text-lg font-semibold mb-2">EWD MRV</h3>
          <p className="text-sm text-gray-700">
            Monitor energy access, water resource projects, and development indicators. Track progress on solar installations, boreholes, and irrigation schemes.
          </p>
        </div>
      </section>

      {/* Dashboard Mockup Section */}
      <section className="grid md:grid-cols-2 gap-12 items-center">
        <div>
          <h2 className="text-2xl font-semibold mb-4">Operational Dashboard</h2>
          <ul className="list-disc pl-5 space-y-2 text-gray-700">
            <li>State-level &amp; LGA drill-down</li>
            <li>Project KPIs with live map overlays</li>
            <li>Carbon credit potential in tonnes</li>
            <li>Evidence packs for FERA/LOS stages</li>
          </ul>
        </div>
        <DashboardImage
          src={'Article' + 'six/technology/dashboard_mock.png?tr=w-1200'}
          alt="Dashboard with metrics and map overlays"
        />
      </section>

      {/* Additional Dashboard Images */}
      <section className="grid md:grid-cols-3 gap-6">
        <DashboardImage
          src={'Article' + 'six/technology/dashboard_mock_1.png?tr=w-1200'}
          alt="Dashboard view 1"
        />
        <DashboardImage
          src={'Article' + 'six/technology/dashboard_mock_2.png?tr=w-1200'}
          alt="Dashboard view 2"
        />
        <DashboardImage
          src={'Article' + 'six/technology/dashboard_mock_3.png?tr=w-1200'}
          alt="Dashboard view 3"
        />
      </section>

      {/* Waitlist CTA Section */}
      <WaitlistCTA />
    </div>
  );
};

export default TechnologyPage;
