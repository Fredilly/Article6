import React from 'react';
import { useRouter } from 'next/router';
import { getStateBySlug } from '../../data/states';

const StateDetailPage: React.FC = () => {
  const router = useRouter();
  const { slug } = router.query;
  const state = typeof slug === 'string' ? getStateBySlug(slug) : undefined;

  if (!state) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-2">State Not Found</h1>
        <p className="text-gray-600">Details for this state are not available.</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-2">{state.title}</h1>
      <p className="text-gray-600">{state.epithet}</p>
    </div>
  );
};

export default StateDetailPage;
