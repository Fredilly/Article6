import React from 'react';
import Link from 'next/link';
import PipelineCard, { STATUS_COLORS } from '../../components/PipelineCard';
import dynamic from "next/dynamic";
const NigeriaMap = dynamic(() => import("../../components/NigeriaMap"), { ssr: false });

const pipeline = [
  {
    slug: 'niger',
    state: 'Niger State — The Power State',
    status: 'In Discussion',
    summary:
      'Introductions completed with Perm Sec and Commissioners; proposal + EOI + MOU shared.\nDinner with delegation in Abuja to align on scope.',
  },
  {
    slug: 'kwara',
    state: 'Kwara State — The State of Harmony',
    status: 'Pending Agreement',
    summary:
      'Introductions made via Ministry of Agric; EOI + Proposal + MOU + LOS shared.\nAwaiting formal invitation / signing window.',
  },
  {
    slug: 'plateau',
    state: 'Plateau State — Home of Peace and Tourism',
    status: 'Early Engagement',
    summary:
      'Introductions via Ministry; 4-doc pack shared (EOI, Proposal, MOU, LOS).\nAwaiting review by SA on Carbon Credit and follow-up meeting.',
  },
];

const ProjectsPage: React.FC = () => {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Current Pipeline</h1>
      <p className="mb-6 text-gray-600">
        We’re working with multiple Nigerian states. Each engagement below is shown at its current stage. We update this page as
        agreements are signed.
      </p>
      <NigeriaMap active={["niger","kwara","plateau"]} />
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        {pipeline.map((proj) => (
          <Link key={proj.slug} href={`/states/${proj.slug}`} className="block">
            <PipelineCard state={proj.state} status={proj.status} summary={proj.summary} />
          </Link>
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
    </div>
  );
};

export default ProjectsPage;
