import React, { useState } from 'react';

interface FormField {
  id: string;
  label: string;
  type: 'text' | 'email' | 'select' | 'textarea' | 'url';
  required?: boolean;
  options?: { value: string; label: string }[];
  placeholder?: string;
  rows?: number;
}

const formFields: FormField[] = [
  { id: 'fullName', label: 'Full name', type: 'text', required: true, placeholder: 'Your full name' },
  { id: 'organization', label: 'Organization', type: 'text', required: true, placeholder: 'Your organization' },
  { id: 'workEmail', label: 'Work email', type: 'email', required: true, placeholder: 'you@organization.com' },
  { id: 'projectName', label: 'Project name', type: 'text', required: true, placeholder: 'Project name' },
  {
    id: 'methodology',
    label: 'Methodology',
    type: 'select',
    required: true,
    options: [
      { value: '', label: 'Select methodology' },
      { value: 'VM0007', label: 'VM0007' },
      { value: 'other', label: 'Other' },
    ],
  },
  { id: 'methodologyVersion', label: 'Methodology version', type: 'text', required: true, placeholder: 'e.g. v1.8' },
  {
    id: 'projectStage',
    label: 'Current project stage',
    type: 'select',
    required: true,
    options: [
      { value: '', label: 'Select stage' },
      { value: 'design', label: 'Project design' },
      { value: 'documentation', label: 'Documentation preparation' },
      { value: 'pre-validation', label: 'Pre-validation review' },
      { value: 'validation', label: 'Undergoing validation' },
      { value: 'other', label: 'Other' },
    ],
  },
  { id: 'registryId', label: 'Registry or project ID', type: 'text', placeholder: 'If available' },
  { id: 'projectCountry', label: 'Project country', type: 'text', required: true, placeholder: 'Country' },
  { id: 'pddLink', label: 'PDD or project-document link', type: 'url', placeholder: 'Link to document (if available)' },
  { id: 'reviewScope', label: 'What would you like reviewed?', type: 'textarea', required: true, rows: 4, placeholder: 'Briefly describe what you would like assessed' },
];

const inputClasses =
  'w-full rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-forest-500 transition';

const AssessmentRequestForm: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});

  const handleChange = (id: string, value: string) => {
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="rounded-lg border border-forest-200 bg-forest-50 p-8 text-center">
        <h3 className="text-lg font-semibold text-forest-800">Request received (preview mode)</h3>
        <p className="mt-2 text-sm text-gray-600">
          This is a preview form. No data has been transmitted. In production, your request would be
          reviewed and we would respond within two business days.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {formFields.slice(0, 4).map((field) => (
          <div key={field.id} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
            <label htmlFor={field.id} className="mb-1.5 block text-sm font-medium text-gray-700">
              {field.label}
              {field.required && <span className="text-forest-600 ml-0.5">*</span>}
            </label>
            {field.type === 'select' && field.options ? (
              <select
                id={field.id}
                name={field.id}
                required={field.required}
                className={inputClasses}
                value={formData[field.id] || ''}
                onChange={(e) => handleChange(field.id, e.target.value)}
              >
                {field.options.map((o) => (
                  <option key={o.value} value={o.value} disabled={o.value === ''}>
                    {o.label}
                  </option>
                ))}
              </select>
            ) : field.type === 'textarea' ? (
              <textarea
                id={field.id}
                name={field.id}
                rows={field.rows || 4}
                required={field.required}
                placeholder={field.placeholder}
                className={inputClasses}
                value={formData[field.id] || ''}
                onChange={(e) => handleChange(field.id, e.target.value)}
              />
            ) : (
              <input
                id={field.id}
                name={field.id}
                type={field.type}
                required={field.required}
                placeholder={field.placeholder}
                className={inputClasses}
                value={formData[field.id] || ''}
                onChange={(e) => handleChange(field.id, e.target.value)}
              />
            )}
          </div>
        ))}
      </div>

      {formFields.slice(4).map((field) => (
        <div key={field.id}>
          <label htmlFor={field.id} className="mb-1.5 block text-sm font-medium text-gray-700">
            {field.label}
            {field.required && <span className="text-forest-600 ml-0.5">*</span>}
          </label>
          {field.type === 'select' && field.options ? (
            <select
              id={field.id}
              name={field.id}
              required={field.required}
              className={inputClasses}
              value={formData[field.id] || ''}
              onChange={(e) => handleChange(field.id, e.target.value)}
            >
              {field.options.map((o) => (
                <option key={o.value} value={o.value} disabled={o.value === ''}>
                  {o.label}
                </option>
              ))}
            </select>
          ) : field.type === 'textarea' ? (
            <textarea
              id={field.id}
              name={field.id}
              rows={field.rows || 4}
              required={field.required}
              placeholder={field.placeholder}
              className={inputClasses}
              value={formData[field.id] || ''}
              onChange={(e) => handleChange(field.id, e.target.value)}
            />
          ) : (
            <input
              id={field.id}
              name={field.id}
              type={field.type}
              required={field.required}
              placeholder={field.placeholder}
              className={inputClasses}
              value={formData[field.id] || ''}
              onChange={(e) => handleChange(field.id, e.target.value)}
            />
          )}
        </div>
      ))}

      <button
        type="submit"
        className="w-full rounded-md bg-forest-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-forest-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-600"
      >
        Submit Request
      </button>

      <p className="text-xs text-gray-400 text-center">
        Preview form — submissions are not transmitted.
      </p>
    </form>
  );
};

export default AssessmentRequestForm;
