import type { NextApiRequest, NextApiResponse } from 'next';
import {
  SCOOP_WAITLIST_PERSONAS,
  SCOOP_WAITLIST_PLATFORMS,
  storeScoopWaitlist,
  storeScoopWaitlistFeedback,
  type ScoopWaitlistInput,
  type ScoopWaitlistPersona,
  type ScoopWaitlistPlatform,
} from '../../lib/scoop-waitlist';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clean(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function setCors(req: NextApiRequest, res: NextApiResponse) {
  const origin = clean(req.headers.origin, 300);
  const allowed =
    origin === 'https://scoop.article6.org' ||
    origin.endsWith('.workers.dev') ||
    origin === 'http://localhost:3000';

  if (allowed) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  setCors(req, res);

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const honeypot = clean(req.body?.companyWebsite, 200);
  if (honeypot) return res.status(200).json({ ok: true });

  if (req.body?.feedbackOnly === true) {
    const email = clean(req.body?.email, 254).toLowerCase();
    const triggerForTrying = clean(req.body?.triggerForTrying, 1200);

    if (!EMAIL_RE.test(email) || !triggerForTrying) {
      return res.status(400).json({ error: 'A valid email and response are required.' });
    }

    try {
      await storeScoopWaitlistFeedback({
        email,
        triggerForTrying,
        source: clean(req.body?.source, 80) || 'scoop_site',
        sourcePage: clean(req.body?.sourcePage, 120) || 'homepage',
        campaign: clean(req.body?.campaign, 120) || 'founding_100',
      });
      return res.status(200).json({ ok: true });
    } catch (error) {
      console.error('[scoop-waitlist] Failed to store Founding 100 follow-up', error);
      return res.status(500).json({ error: 'We could not save your response. Please try again.' });
    }
  }

  const persona = clean(req.body?.persona, 40).toUpperCase() as ScoopWaitlistPersona;
  const platformRaw = clean(req.body?.platform, 40).toUpperCase();
  const platform = platformRaw ? (platformRaw as ScoopWaitlistPlatform) : undefined;
  const input: ScoopWaitlistInput = {
    name: clean(req.body?.name, 120),
    email: clean(req.body?.email, 254).toLowerCase(),
    persona,
    handle: clean(req.body?.handle, 200),
    organization: clean(req.body?.organization, 180),
    platform,
    source: clean(req.body?.source, 80) || 'scoop_site',
    sourcePage: clean(req.body?.sourcePage, 120) || 'homepage',
    campaign: clean(req.body?.campaign, 120) || 'alpha_waitlist',
  };

  if (!input.name || !input.email || !SCOOP_WAITLIST_PERSONAS.includes(persona)) {
    return res.status(400).json({ error: 'Please complete your name, email, and role.' });
  }

  if ((persona === 'CREATOR' || persona === 'BRAND_RETAILER') && platform && !SCOOP_WAITLIST_PLATFORMS.includes(platform)) {
    return res.status(400).json({ error: 'Choose a valid platform.' });
  }

  if (!EMAIL_RE.test(input.email)) {
    return res.status(400).json({ error: 'Enter a valid email address.' });
  }

  try {
    await storeScoopWaitlist(input);
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('[scoop-waitlist] Failed to store waitlist signup', error);
    return res.status(500).json({ error: 'We could not add you to the waitlist. Please try again.' });
  }
}
