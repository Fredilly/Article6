import type { NextApiRequest, NextApiResponse } from 'next';
import { timingSafeEqual } from 'crypto';
import { sendScoopAlphaInviteEmail, validScoopInviteUrl } from '../../lib/scoop-alpha-email';

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
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Scoop-Admin-Token');
}

function sameSecret(a: string, b: string): boolean {
  const aa = Buffer.from(a);
  const bb = Buffer.from(b);
  return aa.length === bb.length && timingSafeEqual(aa, bb);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  setCors(req, res);

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const expectedToken = process.env.SCOOP_ALPHA_ADMIN_TOKEN || '';
  const suppliedToken = clean(req.headers['x-scoop-admin-token'], 500);
  if (!expectedToken || !suppliedToken || !sameSecret(suppliedToken, expectedToken)) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  const name = clean(req.body?.name, 120);
  const email = clean(req.body?.email, 254).toLowerCase();
  const inviteUrl = clean(req.body?.invite_url, 2000);

  if (!name || !EMAIL_RE.test(email) || !validScoopInviteUrl(inviteUrl)) {
    return res.status(400).json({ error: 'Valid name, email, and Scoop invite URL are required.' });
  }

  try {
    await sendScoopAlphaInviteEmail({ name, email, inviteUrl });
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('[scoop-alpha-email] Send failed', error);
    return res.status(502).json({ error: error instanceof Error ? error.message : 'Invite created, but the email could not be sent.' });
  }
}
