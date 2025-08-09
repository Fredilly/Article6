import React from 'react';
import PipelineCard, { STATUS_COLORS } from '../../components/PipelineCard';

const pipeline = [
  { state: 'Niger', status: 'In Discussion', summary: 'Exploring AWD rice farming program' },
  { state: 'Kwara', status: 'Pending Agreement', summary: 'Evaluating forestry + MRV solutions' },
  { state: 'Plateau', status: 'Early Engagement', summary: 'Initial talks on reforestation initiative' },
  { state: 'Open Slot', status: 'Available', summary: 'Partner with us to unlock carbon revenue' },
];

const ProjectsPage: React.FC = () => {
  return (
    <div className="p-8">
      <p className="mb-4 text-gray-600">
        All projects shown are in various stages of development and will be updated as formal agreements are signed.
      </p>
      <h1 className="text-3xl font-bold mb-6">Current Pipeline</h1>
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        {pipeline.map((proj) => (
          <PipelineCard key={proj.state} {...proj} />
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
      <div className="w-full max-w-xl mx-auto">
        <svg viewBox="0 0 700 500" className="w-full h-auto">
          <path
            d="M100 150 L200 120 L350 130 L450 110 L550 150 L580 220 L560 300 L600 360 L520 420 L400 380 L300 420 L180 400 L140 300 L100 250 Z"
            fill="#e5e7eb"
            stroke="#374151"
          />
          <circle cx="300" cy="220" r="10" fill="#F59E0B" />
          <circle cx="240" cy="260" r="10" fill="#F97316" />
          <circle cx="380" cy="240" r="10" fill="#3B82F6" />
        </svg>
      </div>
    </div>
  );
};

export default ProjectsPage;
