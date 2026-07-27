import React, { useState, useRef } from 'react';

const inputClasses =
  'w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-forest-500 transition';

const PddUploadForm: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [fileName, setFileName] = useState<string>('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleChange = (id: string, value: string) => {
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
    } else {
      setFileName('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="rounded-lg border border-forest-200 bg-forest-50 p-6 md:p-8 text-center">
        <h3 className="text-lg font-semibold text-forest-800">Thank you (preview mode)</h3>
        <p className="mt-2 text-sm text-gray-600 max-w-md mx-auto">
          This is a preview form. No data or files have been transmitted.
          In production, we would review your submission and respond within two business days.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div>
          <label htmlFor="pdd-fullName" className="mb-1 block text-sm font-medium text-gray-700">
            Full name <span className="text-forest-600">*</span>
          </label>
          <input
            id="pdd-fullName"
            name="fullName"
            type="text"
            required
            placeholder="Your full name"
            className={inputClasses}
            value={formData['fullName'] || ''}
            onChange={(e) => handleChange('fullName', e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="pdd-workEmail" className="mb-1 block text-sm font-medium text-gray-700">
            Work email <span className="text-forest-600">*</span>
          </label>
          <input
            id="pdd-workEmail"
            name="workEmail"
            type="email"
            required
            placeholder="you@organization.com"
            className={inputClasses}
            value={formData['workEmail'] || ''}
            onChange={(e) => handleChange('workEmail', e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="pdd-organization" className="mb-1 block text-sm font-medium text-gray-700">
            Organization <span className="text-forest-600">*</span>
          </label>
          <input
            id="pdd-organization"
            name="organization"
            type="text"
            required
            placeholder="Your organization"
            className={inputClasses}
            value={formData['organization'] || ''}
            onChange={(e) => handleChange('organization', e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="pdd-projectName" className="mb-1 block text-sm font-medium text-gray-700">
            Project name <span className="text-forest-600">*</span>
          </label>
          <input
            id="pdd-projectName"
            name="projectName"
            type="text"
            required
            placeholder="Project name"
            className={inputClasses}
            value={formData['projectName'] || ''}
            onChange={(e) => handleChange('projectName', e.target.value)}
          />
        </div>
      </div>

      <div>
        <label htmlFor="pdd-methodology" className="mb-1 block text-sm font-medium text-gray-700">
          Methodology and version <span className="text-forest-600">*</span>
        </label>
        <input
          id="pdd-methodology"
          name="methodology"
          type="text"
          required
          placeholder="e.g. VM0007 v1.8"
          className={inputClasses}
          value={formData['methodology'] || ''}
          onChange={(e) => handleChange('methodology', e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="pdd-file" className="mb-1 block text-sm font-medium text-gray-700">
          PDD upload <span className="text-forest-600">*</span>
        </label>
        <div className="mt-1">
          <input
            ref={fileRef}
            id="pdd-file"
            name="pddFile"
            type="file"
            accept=".pdf"
            required
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="w-full flex items-center justify-between rounded-md border border-dashed border-gray-300 bg-gray-50 px-4 py-4 text-sm text-gray-600 hover:border-forest-400 hover:bg-forest-50/50 transition cursor-pointer"
          >
            <span className={fileName ? 'text-gray-900' : 'text-gray-500'}>
              {fileName || 'Choose a PDF file'}
            </span>
            <span className="text-xs text-gray-400 bg-white border border-gray-200 rounded px-2 py-0.5">
              Browse
            </span>
          </button>
        </div>
        <p className="mt-1.5 text-xs text-gray-400">
          Accepted file type: PDF
        </p>
      </div>

      <div>
        <label htmlFor="pdd-note" className="mb-1 block text-sm font-medium text-gray-700">
          Additional note
        </label>
        <textarea
          id="pdd-note"
          name="note"
          rows={3}
          placeholder="Anything else we should know about your project"
          className={inputClasses}
          value={formData['note'] || ''}
          onChange={(e) => handleChange('note', e.target.value)}
        />
      </div>

      <button
        type="submit"
        className="w-full rounded-md bg-forest-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-forest-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-600"
      >
        Submit PDD for Scope Review
      </button>

      <p className="text-xs text-gray-400 leading-relaxed">
        Submitting a PDD does not begin a paid engagement. We will first review the scope
        and confirm the next steps.
      </p>

      <p className="text-xs text-gray-300 text-center">
        Preview form — submissions and uploads are not transmitted.
      </p>
    </form>
  );
};

export default PddUploadForm;
