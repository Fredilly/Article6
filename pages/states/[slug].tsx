import React from 'react';
import { useRouter } from 'next/router';
import { getStateBySlug } from '../../data/states';

const STATUS_STYLES: Record<string, string> = {
  'In Discussion': 'bg-amber-500',
  'Pending Agreement': 'bg-blue-500',
  'Early Engagement': 'bg-slate-500',
};

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

  const statusClass = STATUS_STYLES[state.status] || 'bg-gray-500';

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-1">{state.title}</h1>
        <p className="text-gray-600 mb-2">{state.epithet}</p>
        <span className={`inline-block px-2 py-1 rounded text-white text-sm ${statusClass}`}>
          {state.status}
        </span>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-2">What we&apos;ve done so far</h2>
        <ul className="list-disc ml-5 space-y-1">
          {state.timeline.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-2">Documents shared</h2>
        <div className="flex flex-wrap gap-2">
          {state.docs.map((doc) => (
            <a
              key={doc.href}
              href={doc.href}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1 border rounded-full text-sm"
            >
              {doc.label}
            </a>
          ))}
        </div>
      </div>

      {state.images && state.images.length > 0 && (
        <div className="max-w-5xl mx-auto mt-12">
          <h2 className="text-xl font-semibold mb-4">Gallery</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {state.images.map((src) => (
              <img
                key={src}
                src={src}
                alt="Dinner with Niger State delegation, Abuja"
                className="w-full object-cover rounded-xl border border-gray-200"
              />
            ))}
          </div>
        </div>
      )}

      <div className="flex space-x-4">
        <a
          href="https://wa.me/2349066876272"
          className="px-4 py-2 bg-green-500 text-white rounded"
          target="_blank"
          rel="noopener noreferrer"
        >
          WhatsApp
        </a>
        <a
          href="mailto:contact@article6.org"
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Email
        </a>
      </div>
    </div>
  );
};

export default StateDetailPage;

