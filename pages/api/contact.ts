import type { NextApiRequest, NextApiResponse } from 'next';
import { storeContactEnquiry, type ContactEnquiryInput } from '../../lib/contact-intake';
import { sendContactEnquiryNotification } from '../../lib/contact-email';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clean(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const honeypot = clean(req.body?.companyWebsite, 200);
  if (honeypot) return res.status(200).json({ ok: true });

  const input: ContactEnquiryInput = {
    name: clean(req.body?.name, 120),
    email: clean(req.body?.email, 254).toLowerCase(),
    organisation: clean(req.body?.organisation, 180),
    work: clean(req.body?.work, 240),
    message: clean(req.body?.message, 5000),
  };

  if (!input.name || !input.email || !input.organisation || !input.work || !input.message) {
    return res.status(400).json({ error: 'Please complete all fields.' });
  }

  if (!EMAIL_RE.test(input.email)) {
    return res.status(400).json({ error: 'Enter a valid work email.' });
  }

  try {
    const crm = await storeContactEnquiry(input);
    const notified = await sendContactEnquiryNotification(input);

    if (!notified) {
      console.error('[contact] Enquiry stored in CRM but email notification was not delivered.', {
        interactionId: crm.interactionId,
      });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('[contact] Failed to store website enquiry', error);
    return res.status(500).json({ error: 'We could not submit your enquiry. Please try again or email contact@article6.org.' });
  }
}
