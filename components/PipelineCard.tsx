import React from 'react';

export const STATUS_COLORS: Record<string, string> = {
  'In Discussion': 'bg-yellow-500',
  'Pending Agreement': 'bg-orange-500',
  'Early Engagement': 'bg-blue-500',
};

interface PipelineCardProps {
  state: string;
  status: string;
  summary: string;
}

const PipelineCard: React.FC<PipelineCardProps> = ({ state, status, summary }) => {
  const colorClass = STATUS_COLORS[status] || 'bg-gray-400';
  return (
    <div className="border rounded p-4 shadow-sm mb-4">
      <h2 className="text-xl font-semibold mb-1 flex items-center">
        <span className={`w-3 h-3 rounded-full mr-2 ${colorClass}`}></span>
        {state}
      </h2>
      <p className="text-sm italic mb-2">{status}</p>
        <p className="text-gray-700 whitespace-pre-line">{summary}</p>
      </div>
    );
  };

export default PipelineCard;
