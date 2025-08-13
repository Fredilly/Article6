import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowDownTrayIcon,
  CpuChipIcon,
  UserGroupIcon,
  ClipboardDocumentCheckIcon,
} from '@heroicons/react/24/outline';

const TechnologyPage = () => {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 py-12 md:py-16 flex flex-col items-center gap-10 md:flex-row">
          <div className="md:w-1/2 space-y-6">
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">
              MRV-AI — Real-time Environmental Intelligence for States
            </h1>
            <p className="text-gray-600 max-w-prose">
              Transparent, audit-ready data for Forestry, Rice, and Enhanced Rock Weathering — built for Nigerian states and beyond.
            </p>
            <Link
              href="/contact"
              className="inline-block rounded-xl bg-black px-6 py-3 text-white shadow-sm"
            >
              Join the Waitlist
            </Link>
          </div>
          <div className="relative md:w-1/2 h-64 md:h-80">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-green-200 via-green-300 to-green-400 opacity-40 blur-3xl" />
          </div>
        </div>
      </section>

      {/* Government-facing pitch section */}
      <section className="mx-auto max-w-7xl px-6 py-12 md:py-16">
        <h2 className="text-2xl font-semibold">Built for Decision Makers</h2>
        <p className="mt-4 text-gray-600 max-w-prose">
          MRV-AI continuously measures, reports, and verifies environmental program impact — reducing reporting time from months to days. Designed for government programs where accuracy, credibility, and speed are critical.
        </p>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
            <h3 className="font-semibold">Faster Reporting</h3>
            <p className="mt-2 text-sm text-gray-600">
              Satellite, IoT, and AI reduce turnaround times by 80%.
            </p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
            <h3 className="font-semibold">Credible Evidence</h3>
            <p className="mt-2 text-sm text-gray-600">
              Data ready for carbon credit issuance and development funding.
            </p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
            <h3 className="font-semibold">Seamless Handoff</h3>
            <p className="mt-2 text-sm text-gray-600">
              HubSpot CRM integration for project and stakeholder management.
            </p>
          </div>
        </div>
      </section>

      {/* Technology pillars section */}
      <section className="mx-auto max-w-7xl px-6 py-12 md:py-16">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
            <div className="relative h-48 md:h-60">
              <Image
                src="https://ik.imagekit.io/tzublgy5d/Article6/Technology%20assets/forest.png?tr=w-1200"
                alt="Forestry MRV"
                fill
                className="object-cover"
              />
            </div>
            <div className="p-6">
              <h3 className="text-xl font-semibold">Forestry MRV</h3>
              <p className="mt-2 text-sm text-gray-600">
                Track forest cover, biomass change, and illegal encroachment with satellite NDVI and change detection. Integrate ranger patrol logs and IoT sensors for high-risk zones.
              </p>
            </div>
          </div>
          <div className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
            <div className="relative h-48 md:h-60">
              <Image
                src="https://ik.imagekit.io/tzublgy5d/Article6/Technology%20assets/rice.png?tr=w-1200"
                alt="Rice MRV (AWD)"
                fill
                className="object-cover"
              />
            </div>
            <div className="p-6">
              <h3 className="text-xl font-semibold">Rice MRV (AWD)</h3>
              <p className="mt-2 text-sm text-gray-600">
                Measure water use and emissions reductions with flood mapping and optional water-level IoT devices. Link farmer adoption rates to measurable carbon savings.
              </p>
            </div>
          </div>
          <div className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
            <div className="relative h-48 md:h-60">
              <Image
                src="https://ik.imagekit.io/tzublgy5d/Article6/Technology%20assets/erw.png?tr=w-1200"
                alt="Enhanced Rock Weathering MRV"
                fill
                className="object-cover"
              />
            </div>
            <div className="p-6">
              <h3 className="text-xl font-semibold">Enhanced Rock Weathering MRV</h3>
              <p className="mt-2 text-sm text-gray-600">
                Monitor basalt or silicate rock dust application in agriculture, track coverage, and measure CO₂ removal via soil sampling and remote sensing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works section */}
      <section className="mx-auto max-w-7xl px-6 py-12 md:py-16">
        <h2 className="text-2xl font-semibold">How MRV-AI Works</h2>
        <div className="mt-8 rounded-2xl border border-gray-200 bg-white/60 p-8 shadow-sm backdrop-blur transition-shadow hover:shadow-md">
          <ol className="space-y-6">
            <li className="flex items-start">
              <ArrowDownTrayIcon className="h-6 w-6 flex-shrink-0 text-green-600" />
              <div className="ml-4">
                <h3 className="font-semibold">Ingest Data</h3>
                <p className="text-sm text-gray-600">Satellites, IoT, field reports.</p>
              </div>
            </li>
            <li className="flex items-start">
              <CpuChipIcon className="h-6 w-6 flex-shrink-0 text-green-600" />
              <div className="ml-4">
                <h3 className="font-semibold">AI Analysis</h3>
                <p className="text-sm text-gray-600">Automated change detection & verification.</p>
              </div>
            </li>
            <li className="flex items-start">
              <UserGroupIcon className="h-6 w-6 flex-shrink-0 text-green-600" />
              <div className="ml-4">
                <h3 className="font-semibold">Human Review</h3>
                <p className="text-sm text-gray-600">Analysts validate outputs.</p>
              </div>
            </li>
            <li className="flex items-start">
              <ClipboardDocumentCheckIcon className="h-6 w-6 flex-shrink-0 text-green-600" />
              <div className="ml-4">
                <h3 className="font-semibold">Evidence Pack Delivery</h3>
                <p className="text-sm text-gray-600">Ready for FERA/LOS.</p>
              </div>
            </li>
          </ol>
        </div>
      </section>

      {/* Waitlist CTA section */}
      <section className="px-6 py-12 md:py-16">
        <div className="mx-auto max-w-4xl rounded-2xl bg-gradient-to-br from-green-50 to-green-100 p-10 text-center shadow-sm transition-shadow hover:shadow-md">
          <h2 className="text-2xl font-semibold">Reserve Your Place</h2>
          <p className="mx-auto mt-4 max-w-prose text-gray-600">
            We’re onboarding a limited number of state programs in 2025. Join the waitlist to secure your slot and start unlocking verified environmental revenue streams.
          </p>
          <Link
            href="/contact"
            className="mt-8 inline-block rounded-xl bg-black px-8 py-3 text-white"
          >
            Join the Waitlist
          </Link>
        </div>
      </section>
    </div>
  );
};

export default TechnologyPage;

