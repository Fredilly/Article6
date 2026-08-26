import React, { FormEvent } from 'react';

interface ContactFormProps extends React.FormHTMLAttributes<HTMLFormElement> {}

const inputClasses =
  'w-full border-0 border-b border-black/20 bg-transparent px-0 py-3 text-base text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-black';

export default function ContactForm({ className = '', ...props }: ContactFormProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);
    const name = String(form.get('name') || '').trim();
    const email = String(form.get('email') || '').trim();
    const organisation = String(form.get('organisation') || '').trim();
    const work = String(form.get('work') || '').trim();
    const message = String(form.get('message') || '').trim();

    const subject = work ? `Article6 enquiry — ${work}` : 'Article6 enquiry';
    const body = [
      `Name: ${name}`,
      `Work email: ${email}`,
      organisation ? `Organisation: ${organisation}` : '',
      work ? `What they are working on: ${work}` : '',
      '',
      message,
    ]
      .filter((line) => line !== '')
      .join('\n');

    window.location.href = `mailto:contact@article6.org?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  return (
    <form className={`space-y-8 ${className}`} onSubmit={handleSubmit} {...props}>
      <div>
        <label htmlFor="name" className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">
          Name
        </label>
        <input id="name" name="name" type="text" required className={inputClasses} autoComplete="name" />
      </div>

      <div>
        <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">
          Work email
        </label>
        <input id="email" name="email" type="email" required className={inputClasses} autoComplete="email" />
      </div>

      <div>
        <label htmlFor="organisation" className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">
          Organisation
        </label>
        <input id="organisation" name="organisation" type="text" className={inputClasses} autoComplete="organization" />
      </div>

      <div>
        <label htmlFor="work" className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">
          What are you working on?
        </label>
        <input id="work" name="work" type="text" required className={inputClasses} />
      </div>

      <div>
        <label htmlFor="message" className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">
          Message
        </label>
        <textarea id="message" name="message" rows={5} required className={`${inputClasses} resize-y`} />
      </div>

      <button
        type="submit"
        className="inline-flex items-center gap-4 border-b border-black pb-2 text-xs font-semibold uppercase tracking-[0.12em] text-neutral-900 transition-opacity hover:opacity-60"
      >
        Send enquiry <span aria-hidden="true">→</span>
      </button>
    </form>
  );
}
