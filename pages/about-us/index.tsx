import Image from "next/image";
import Link from "next/link";
import GlassCard from "@/components/ui/GlassCard";
import SectionTitle from "@/components/ui/SectionTitle";
import { ik } from "@/components/ui/ik";

const IMGS = {
  hero: "https://ik.imagekit.io/tzublgy5d/Article6/About%20us/HeroAboutUs.png?",
  match: "https://ik.imagekit.io/tzublgy5d/Article6/About%20us/Technology%20matching.png?",
  mrv: "https://ik.imagekit.io/tzublgy5d/Article6/About%20us/mrrv%20as%20a%20service.png?",
  enable: "https://ik.imagekit.io/tzublgy5d/Article6/About%20us/project%20enablement.png?",
};

export default function AboutUs() {
  return (
    <main className="relative">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src={ik(IMGS.hero, 'tr=w-2400,q-80,fo-auto')}
            alt="Aerial Earth view with subtle grid overlay"
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-white/0" />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 md:px-6 lg:px-8 py-20 md:py-28">
          <div className="max-w-3xl">
            <GlassCard className="p-6 md:p-8 bg-white/15">
              <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-white">
                From commitment to verified impact.
              </h1>
              <p className="mt-4 text-white/90">
                Article6 matches nation states with the right technologies and delivery teams to run climate programs
                that are measurable, auditable, and built to last.
              </p>
              <div className="mt-6">
                <Link
                  href="/contact"
                  className="inline-flex items-center rounded-2xl bg-black text-white px-5 py-3 shadow hover:opacity-90"
                >
                  Join the Waitlist
                </Link>
              </div>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* WHAT WE DO */}
      <section className="mx-auto max-w-6xl px-4 md:px-6 lg:px-8 py-12 md:py-16">
        <SectionTitle
          title="What we do"
          subtitle="We integrate proven climate technologies and delivery partners into one working stack."
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Technology matching */}
          <GlassCard className="overflow-hidden">
            <div className="aspect-video relative">
              <Image src={ik(IMGS.match)} alt="Global technology network visualization" fill className="object-cover" />
            </div>
            <div className="p-5">
              <h3 className="font-medium text-lg">Technology matching</h3>
              <p className="mt-2 text-sm text-gray-700">
                We source and vet remote sensing, MRV platforms, open‑source tools, and field systems—and assemble them into one stack.
              </p>
            </div>
          </GlassCard>

          {/* MRV‑AI as a service */}
          <GlassCard className="overflow-hidden">
            <div className="aspect-video relative">
              <Image src={ik(IMGS.mrv)} alt="Real landscapes with subtle data overlays" fill className="object-cover" />
            </div>
            <div className="p-5">
              <h3 className="font-medium text-lg">MRV‑AI as a service</h3>
              <p className="mt-2 text-sm text-gray-700">
                Continuous measurement, reporting, and verification for forestry, rice (AWD), ERW, and EWD—ready for external review.
              </p>
            </div>
          </GlassCard>

          {/* Program enablement */}
          <GlassCard className="overflow-hidden">
            <div className="aspect-video relative">
              <Image src={ik(IMGS.enable)} alt="On‑site teams delivering climate projects" fill className="object-cover" />
            </div>
            <div className="p-5">
              <h3 className="font-medium text-lg">Program enablement</h3>
              <p className="mt-2 text-sm text-gray-700">
                We line up implementation partners, playbooks, and training to execute at state and national scale.
              </p>
            </div>
          </GlassCard>
        </div>
      </section>

      {/* WHY IT MATTERS */}
      <section className="mx-auto max-w-6xl px-4 md:px-6 lg:px-8 py-12 md:py-16">
        <SectionTitle title="Why it matters" />
        <GlassCard className="p-6 md:p-8">
          <p className="text-gray-800">
            Ambitious plans fail without evidence. Article6 closes the gap between policy and proof—so governments can
            unlock climate finance, report with confidence, and show progress the public can trust.
          </p>
        </GlassCard>
      </section>

      {/* HOW WE WORK */}
      <section className="mx-auto max-w-6xl px-4 md:px-6 lg:px-8 py-12 md:py-16">
        <SectionTitle title="How we work" subtitle="A clear, auditable path from assessment to verification." />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { t: "Assess", d: "Map objectives, data readiness, and timelines." },
            { t: "Match", d: "Select the right tech and delivery partners, no vendor bias." },
            { t: "Deliver", d: "Stand up the stack, train teams, integrate workflows." },
            { t: "Verify", d: "Produce audit‑ready MRV and maintain continuous reporting." },
          ].map((s, i) => (
            <GlassCard key={i} className="p-5 h-full">
              <div className="text-sm uppercase tracking-wide text-gray-500">
                {String(i + 1).padStart(2, "0")}
              </div>
              <h4 className="mt-2 font-medium">{s.t}</h4>
              <p className="mt-1 text-sm text-gray-700">{s.d}</p>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* VALUES */}
      <section className="mx-auto max-w-6xl px-4 md:px-6 lg:px-8 py-12 md:py-16">
        <SectionTitle title="How we build" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { t: "Open and interoperable", d: "We prefer open standards and open‑source components so states keep control of their data." },
            { t: "Local capacity first", d: "We design for handover and run‑by‑locals, not black boxes." },
            { t: "Security by design", d: "Access controls, audit logs, and region options where required." },
            { t: "Evidence over hype", d: "Clear methods, transparent assumptions, and citations where it counts." },
          ].map((v, i) => (
            <GlassCard key={i} className="p-5">
              <h4 className="font-medium">{v.t}</h4>
              <p className="mt-1 text-sm text-gray-700">{v.d}</p>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 md:px-6 lg:px-8 pb-16">
        <GlassCard className="p-8 text-center bg-white/20">
          <h3 className="text-xl md:text-2xl font-semibold">Join the waitlist</h3>
          <p className="mt-2 text-sm text-gray-800">
            We’re onboarding a limited number of state programs. If you’re ready to turn plans into verifiable results, we’re ready to help.
          </p>
          <Link href="/contact" className="inline-flex items-center mt-5 rounded-2xl bg-black text-white px-6 py-3 shadow hover:opacity-90">
            Get on the Waitlist
          </Link>
        </GlassCard>
      </section>
    </main>
  );
}
