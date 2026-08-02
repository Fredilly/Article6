import React, { useState, useRef } from 'react';
import { isPdfUpload, MAX_FILE_SIZE, type SubmissionSource } from '../../lib/submissions';
import { useInternalReset } from '../InternalResetContext';

const inputClasses =
  'w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-forest-500 transition';

type UploadPhase = 'idle' | 'uploading' | 'success' | 'error';

interface FormFields {
  fullName: string;
  workEmail: string;
  organization: string;
  projectName: string;
  methodology: string;
  note: string;
  externalContact: string;
  submissionSource: Exclude<SubmissionSource, 'website'>;
}

interface PddUploadFormProps {
  mode?: 'public' | 'internal';
}

const PddUploadForm: React.FC<PddUploadFormProps> = ({ mode = 'public' }) => {
  const isInternal = mode === 'internal';
  const { resetInternalPage } = useInternalReset();
  const [phase, setPhase] = useState<UploadPhase>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [submissionId, setSubmissionId] = useState<string>('');
  const [formData, setFormData] = useState<FormFields>({
    fullName: '',
    workEmail: '',
    organization: '',
    projectName: '',
    methodology: '',
    note: '',
    externalContact: '',
    submissionSource: 'internal',
  });
  const [fileName, setFileName] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleChange = (field: keyof FormFields, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
    } else {
      setFile(null);
      setFileName('');
    }
  };

  const validateForm = (): string | null => {
    const { fullName, workEmail, organization, projectName, methodology } = formData;
    if (!fullName.trim()) return 'Full name is required.';
    if (!isInternal && !workEmail.trim()) return 'Work email is required.';
    if (workEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(workEmail.trim())) return 'Please enter a valid email address.';
    if (!organization.trim()) return 'Organization is required.';
    if (!projectName.trim()) return 'Project name is required.';
    if (!methodology.trim()) return 'Methodology is required.';
    if (!file) return 'Please select a PDF file.';
    return isPdfUpload(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setPhase('error');
      setErrorMessage(validationError);
      return;
    }

    setPhase('uploading');
    setErrorMessage('');

    try {
      console.info('[PddUploadForm] Step 1: Requesting presigned URL', {
        fileName: file!.name,
        fileSize: file!.size,
        contentType: 'application/pdf',
      });

      const presignRes = await fetch('/api/upload/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file!.name,
          contentType: 'application/pdf',
          fileSize: file!.size,
          contactName: formData.fullName.trim(),
          workEmail: formData.workEmail.trim() || undefined,
          organization: formData.organization.trim(),
          projectName: formData.projectName.trim(),
          methodology: formData.methodology.trim(),
          submissionSource: isInternal ? formData.submissionSource : 'website',
          externalContact: isInternal ? formData.externalContact.trim() || undefined : undefined,
          note: formData.note.trim(),
        }),
      });

      const presignBody = await presignRes.json();

      console.info('[PddUploadForm] Step 1 response', {
        status: presignRes.status,
        ok: presignRes.ok,
        hasUploadUrl: !!(presignBody as { uploadUrl?: string }).uploadUrl,
        hasUploadReference: !!(presignBody as { uploadReference?: string }).uploadReference,
        error: presignBody.error,
      });

      if (!presignRes.ok) {
        throw new Error(presignBody.error || 'Failed to prepare upload.');
      }

      const { uploadUrl, uploadReference } = presignBody as { uploadUrl: string; uploadReference: string };

      console.info('[PddUploadForm] Step 2: Uploading file to R2', {
        hasUploadReference: !!uploadReference,
        urlHost: new URL(uploadUrl).hostname,
        urlParams: new URL(uploadUrl).search.slice(0, 100) + '...',
        fileSize: file!.size,
        fileType: file!.type,
      });

      let uploadRes: Response;
      try {
        uploadRes = await fetch(uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/pdf' },
          body: file,
        });
      } catch (r2Err) {
        const isCORS = r2Err instanceof TypeError && (
          r2Err.message.includes('Failed to fetch') ||
          r2Err.message.includes('NetworkError') ||
          r2Err.message.includes('Load failed') ||
          r2Err.message.includes('not allowed by Access-Control')
        );
        console.error('[PddUploadForm] R2 PUT fetch() threw', {
          errorConstructor: r2Err instanceof Error ? r2Err.constructor.name : typeof r2Err,
          message: r2Err instanceof Error ? r2Err.message : String(r2Err),
          name: r2Err instanceof Error ? r2Err.name : 'N/A',
          stack: r2Err instanceof Error ? (r2Err.stack || '').split('\n').slice(0, 5).join('\n') : 'N/A',
          likelyCORS: isCORS,
          urlHost: new URL(uploadUrl).hostname,
          urlScheme: new URL(uploadUrl).protocol,
          fileSize: file!.size,
        });
        throw new Error(
          isCORS
            ? 'Upload was blocked by the browser. The storage bucket may need CORS configured to allow requests from this page.'
            : 'File upload failed due to a network error. Please check your connection and try again.'
        );
      }

      console.info('[PddUploadForm] Step 2 R2 PUT response', {
        status: uploadRes.status,
        ok: uploadRes.ok,
        statusText: uploadRes.statusText,
      });

      if (!uploadRes.ok) {
        const r2ErrorText = await uploadRes.text().catch(() => '');
        console.error('[PddUploadForm] R2 PUT failed', { status: uploadRes.status, body: r2ErrorText });
        throw new Error(`File upload failed: R2 returned HTTP ${uploadRes.status}${uploadRes.statusText ? ` (${uploadRes.statusText})` : ''}. Please try again.`);
      }

      console.info('[PddUploadForm] Step 3: Confirming submission');

      const confirmRes = await fetch('/api/upload/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uploadReference,
          fileName: file!.name,
          fileSize: file!.size,
          contactName: formData.fullName.trim(),
          workEmail: formData.workEmail.trim() || undefined,
          organization: formData.organization.trim(),
          projectName: formData.projectName.trim(),
          methodology: formData.methodology.trim(),
          submissionSource: isInternal ? formData.submissionSource : 'website',
          externalContact: isInternal ? formData.externalContact.trim() || undefined : undefined,
          note: formData.note.trim(),
        }),
      });

      const confirmBody = await confirmRes.json();

      console.info('[PddUploadForm] Step 3 confirm response', {
        status: confirmRes.status,
        ok: confirmRes.ok,
        success: confirmBody.success,
        submissionReference: confirmBody.submissionId,
        message: confirmBody.message,
        error: confirmBody.error,
      });

      if (!confirmRes.ok) {
        throw new Error(confirmBody.error || 'Failed to confirm submission.');
      }

      setSubmissionId(confirmBody.submissionId);
      setPhase('success');
      console.info('[PddUploadForm] Upload flow complete', { submissionReference: confirmBody.submissionId });
    } catch (err) {
      console.error('[PddUploadForm] Upload flow error', err);
      setPhase('error');
      setErrorMessage(err instanceof Error ? err.message : 'An unexpected error occurred.');
    }
  };

  const resetForm = () => {
    setPhase('idle');
    setErrorMessage('');
    setFormData({ fullName: '', workEmail: '', organization: '', projectName: '', methodology: '', note: '', externalContact: '', submissionSource: 'internal' });
    setFile(null);
    setFileName('');
    setSubmissionId('');
    if (fileRef.current) fileRef.current.value = '';
  };

  if (phase === 'success') {
    return (
      <div className="rounded-lg border border-forest-200 bg-forest-50 p-6 md:p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-forest-100">
          <svg className="h-6 w-6 text-forest-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h3 className="mt-4 text-lg font-semibold text-forest-800">Submission received</h3>
        <p className="mt-2 text-sm text-gray-600 max-w-md mx-auto">
          {isInternal
            ? 'The internal submission has been recorded for scope review.'
            : 'Your PDD has been submitted for scope review. We will review your project documentation and respond within two business days.'}
        </p>
        {submissionId && (
          <p className="mt-3 text-xs text-gray-400">
            Reference: <code className="text-gray-500">{submissionId}</code>
          </p>
        )}
        <button
          type="button"
          onClick={isInternal ? resetInternalPage : resetForm}
          className="mt-6 text-sm font-medium text-forest-700 hover:text-forest-800 transition-colors"
        >
          Submit another PDD
        </button>
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div className="rounded-md border border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <svg className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-red-800">Submission failed</h4>
              <p className="mt-1 text-sm text-red-700">{errorMessage}</p>
            </div>
          </div>
        </div>

        {renderForm()}
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {renderForm()}
    </form>
  );

  function renderForm() {
    return (
      <>
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
              value={formData.fullName}
              onChange={(e) => handleChange('fullName', e.target.value)}
              disabled={phase === 'uploading'}
            />
          </div>
          <div>
            <label htmlFor="pdd-workEmail" className="mb-1 block text-sm font-medium text-gray-700">
              Work email {!isInternal && <span className="text-forest-600">*</span>}
            </label>
            <input
              id="pdd-workEmail"
              name="workEmail"
              type="email"
              required={!isInternal}
              placeholder="you@organization.com"
              className={inputClasses}
              value={formData.workEmail}
              onChange={(e) => handleChange('workEmail', e.target.value)}
              disabled={phase === 'uploading'}
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
              value={formData.organization}
              onChange={(e) => handleChange('organization', e.target.value)}
              disabled={phase === 'uploading'}
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
              value={formData.projectName}
              onChange={(e) => handleChange('projectName', e.target.value)}
              disabled={phase === 'uploading'}
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
            value={formData.methodology}
            onChange={(e) => handleChange('methodology', e.target.value)}
            disabled={phase === 'uploading'}
          />
        </div>

        {isInternal && (
          <>
            <div>
              <label htmlFor="pdd-submissionSource" className="mb-1 block text-sm font-medium text-gray-700">Submission source <span className="text-forest-600">*</span></label>
              <select id="pdd-submissionSource" className={inputClasses} value={formData.submissionSource} onChange={(e) => handleChange('submissionSource', e.target.value as FormFields['submissionSource'])} disabled={phase === 'uploading'}>
                <option value="whatsapp">WhatsApp</option>
                <option value="email">Email</option>
                <option value="internal">Internal</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label htmlFor="pdd-externalContact" className="mb-1 block text-sm font-medium text-gray-700">External contact</label>
              <input id="pdd-externalContact" type="text" placeholder="Phone, WhatsApp ID, or source note" className={inputClasses} value={formData.externalContact} onChange={(e) => handleChange('externalContact', e.target.value)} disabled={phase === 'uploading'} />
            </div>
          </>
        )}

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
              disabled={phase === 'uploading'}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={phase === 'uploading'}
              className="w-full flex items-center justify-between rounded-md border border-dashed border-gray-300 bg-gray-50 px-4 py-4 text-sm text-gray-600 hover:border-forest-400 hover:bg-forest-50/50 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
            Accepted file type: PDF. Maximum size: {MAX_FILE_SIZE / (1024 * 1024)}MB. {isInternal && fileName && file && `Selected: ${fileName} (${(file.size / (1024 * 1024)).toFixed(2)} MB)`}
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
            value={formData.note}
            onChange={(e) => handleChange('note', e.target.value)}
            disabled={phase === 'uploading'}
          />
        </div>

        <button
          type="submit"
          disabled={phase === 'uploading'}
          className="w-full rounded-md bg-forest-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-forest-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {phase === 'uploading' ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Uploading and submitting...
            </span>
          ) : (
            isInternal ? 'Record Internal PDD Submission' : 'Submit PDD for Scope Review'
          )}
        </button>

        {phase === 'uploading' && (
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200" role="progressbar" aria-label="Upload in progress">
            <div className="h-full w-1/2 animate-pulse rounded-full bg-forest-600" />
          </div>
        )}

        <p className="text-xs text-gray-400 leading-relaxed">
          Submitting a PDD does not begin a paid engagement. We will first review the scope
          and confirm the next steps.
        </p>
      </>
    );
  }
};

export default PddUploadForm;
