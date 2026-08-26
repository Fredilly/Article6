import React, { FormEvent, useState } from 'react';

interface ContactFormProps extends React.FormHTMLAttributes<HTMLFormElement> {}

type SubmitState = 'idle' | 'submitting' | 'success' | 'error';

const inputClasses =
  'w-full border-0 border-b border-black/20 bg-transparent px-0 py-3 text-base text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-black';

export default function ContactForm({ className = '', ...props }: ContactFormProps) {
  const [state, setState] = useState<SubmitState>('idle');
  const [error, setError] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state === 'submitting') return;

    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const payload = Object.fromEntries(form.entries());

    setState('submitting');
    setError('');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(typeof data.error === 'string' ? data.error : 'We could not submit your enquiry.');
      }

      formElement.reset();
      setState('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'We could not submit your enquiry.');
      setState('error');
    }
  }

  return (
    <form className={`space-y-8 ${className}`} onSubmit={handleSubmit} {...props}>
      <div className="absolute left-[-10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
        <label htmlFor="companyWebsite">Website</label>
        <input id="companyWebsite" name="companyWebsite" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div>
        <label htmlFor="name" className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">
          Name
        </label>
        <input id="name" name="name" type="text" required maxLength={120} className={inputClasses} autoComplete="name" />
      </div>

      <div>
        <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">
          Work email
        </label>
        <input id="email" name="email" type="email" required maxLength={254} className={inputClasses} autoComplete="email" />
      </div>

      <div>
        <label htmlFor="organisation" className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">
          Organisation
        </label>
        <input id="organisation" name="organisation" type="text" required maxLength={180} className={inputClasses} autoComplete="organization" />
      </div>

      <div>
        <label htmlFor="work" className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">
          What are you working on?
        </label>
        <input id="work" name="work" type="text" required maxLength={240} className={inputClasses} />
      </div>

      <div>
        <label htmlFor="message" className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">
          Message
        </label>
        <textarea id="message" name="message" rows={5} required maxLength={5000} className={`${inputClasses} resize-y`} />
      </div>

      <div className="min-h-8" aria-live="polite">
        {state === 'success' ? (
          <p className="text-sm leading-6 text-neutral-700">Received. We’ll reply to the email you provided.</p>
        ) : state === 'error' ? (
          <p className="text-sm leading-6 text-red-700">{error}</p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={state === 'submitting'}
        className="inline-flex items-center gap-4 border-b border-black pb-2 text-xs font-semibold uppercase tracking-[0.12em] text-neutral-900 transition-opacity hover:opacity-60 disabled:cursor-wait disabled:opacity-40"
      >
        {state === 'submitting' ? 'Sending…' : 'Send enquiry'} <span aria-hidden="true">→</span>
      </button>
    </form>
  );
}
