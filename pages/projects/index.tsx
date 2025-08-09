import React from 'react';
import StateCard, { STATUS_COLORS } from '../../components/StateCard';
import dynamic from 'next/dynamic';
// client-only Nigeria map to avoid SSR router issues
const NigeriaMap = dynamic(() => import('../../components/NigeriaMap'), { ssr: false });

const pipeline = [
  {
    slug: 'niger',
    title: 'Niger State',
    epithet: 'The Power State',
    status: 'In Discussion',
    summary:
      'Introductions completed with Perm Sec and Commissioners; proposal + EOI + MOU shared.\nDrinks with delegation in Abuja to align on scope.',
  },
  {
    slug: 'kwara',
    title: 'Kwara State',
    epithet: 'The State of Harmony',
    status: 'Pending Agreement',
    summary:
      'Introductions made via Ministry of Agric; EOI + Proposal + MOU + LOS shared.\nAwaiting formal invitation / signing window.',
  },
  {
    slug: 'plateau',
    title: 'Plateau State',
    epithet: 'Home of Peace and Tourism',
    status: 'Early Engagement',
    summary:
      'Introductions via Ministry; 4-doc pack shared (EOI, Proposal, MOU, LOS).\nAwaiting review by SA on Carbon Credit and follow-up meeting.',
  },
];

const ProjectsPage: React.FC = () => {
  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
      <h1 className="text-3xl font-bold mb-4">Current Pipeline</h1>
      <p className="mb-6 text-gray-600">
        We’re working with multiple Nigerian states. Each engagement below is shown at its current stage. We update this page as agreements are signed.
      </p>
      <NigeriaMap active={['niger', 'kwara', 'plateau']} />
      <div className="grid md:grid-cols-2 gap-4 mb-8 mt-8">
        {pipeline.map((proj) => (
          <StateCard
            key={proj.slug}
            slug={proj.slug}
            title={proj.title}
            epithet={proj.epithet}
            status={proj.status}
            summary={proj.summary}
          />
        ))}
      </div>
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-2">Status Legend</h3>
        <ul className="space-y-1">
          {Object.entries(STATUS_COLORS).map(([status, color]) => (
            <li key={status} className="flex items-center">
              <span className={`w-3 h-3 rounded-full mr-2 ${color}`}></span>
              {status}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default ProjectsPage;
