import type { NextApiRequest, NextApiResponse } from 'next';
import { timingSafeEqual } from 'crypto';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clean(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
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

function validInviteUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' &&
      url.hostname === 'scoop.article6.org' &&
      url.pathname === '/alpha' &&
      Boolean(url.searchParams.get('code'));
  } catch {
    return false;
  }
}

function buildText(name: string, inviteUrl: string): string {
  return [
    `Hi ${name},`,
    '',
    'You’re in the Scoop founding alpha.',
    '',
    'See something you want in a video. Click it. Scoop finds where to buy it.',
    '',
    `Install Scoop: ${inviteUrl}`,
    '',
    'Try 3–5 real Scoops on YouTube and use thumbs up/down on the results.',
    'Bad results are useful right now. They help us improve Scoop before wider release.',
    '',
    'Fred',
    'Founder, Scoop',
    '',
    'See it. Scoop it.',
  ].join('\n');
}

function buildHtml(name: string, inviteUrl: string): string {
  const safeName = escapeHtml(name);
  const safeUrl = escapeHtml(inviteUrl);
  return `<!doctype html>
<html>
  <body style="margin:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;color:#111318;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="padding:32px 16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:20px;">
            <tr>
              <td style="padding:36px;">
                <div style="font-size:24px;font-weight:800;color:#1769FF;">Scoop</div>
                <div style="margin-top:34px;font-size:12px;font-weight:800;letter-spacing:.14em;color:#1769FF;">FOUNDING ALPHA</div>
                <h1 style="font-size:42px;line-height:1;margin:12px 0 18px;">You’re in.</h1>
                <p style="font-size:17px;line-height:1.6;">Hi ${safeName}, you’re one of the first people getting access to Scoop.</p>
                <p style="font-size:17px;line-height:1.6;font-weight:700;">See something you want in a video. Click it. Scoop finds where to buy it.</p>
                <p style="margin:24px 0;">
                  <a href="${safeUrl}" style="display:inline-block;padding:14px 22px;border-radius:999px;background:#1769FF;color:#fff;font-weight:800;text-decoration:none;">Install Scoop →</a>
                </p>
                <p style="font-size:15px;line-height:1.7;color:#4b5563;">Works with Chrome and Brave. Your invite is personal and activates up to two browser installs.</p>
                <hr style="border:0;border-top:1px solid #e5e7eb;margin:28px 0;">
                <p style="font-size:15px;line-height:1.7;">Try 3–5 real Scoops on YouTube and use thumbs up/down on the results. Bad results are useful right now.</p>
                <p style="margin-top:28px;font-size:15px;line-height:1.7;">Fred<br>Founder, Scoop</p>
                <div style="margin-top:28px;font-weight:800;color:#1769FF;">See it. Scoop it.</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
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

  const apiKey = process.env.RESEND_API_KEY || '';
  if (!apiKey) return res.status(503).json({ error: 'Email is not configured.' });

  const name = clean(req.body?.name, 120);
  const email = clean(req.body?.email, 254).toLowerCase();
  const inviteUrl = clean(req.body?.invite_url, 2000);

  if (!name || !EMAIL_RE.test(email) || !validInviteUrl(inviteUrl)) {
    return res.status(400).json({ error: 'Valid name, email, and Scoop invite URL are required.' });
  }

  const fromAddress = process.env.SCOOP_ALPHA_FROM_EMAIL || 'contact@article6.org';
  const replyTo = process.env.SCOOP_ALPHA_REPLY_TO || 'contact@article6.org';

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `Scoop <${fromAddress}>`,
        to: [email],
        reply_to: replyTo,
        subject: 'You’re in — Scoop founding alpha',
        text: buildText(name, inviteUrl),
        html: buildHtml(name, inviteUrl),
        tags: [{ name: 'source', value: 'scoop-alpha-invite' }],
      }),
    });

    const responseText = await response.text();
    if (!response.ok) {
      console.error('[scoop-alpha-email] Resend failed', { status: response.status, body: responseText });
      return res.status(502).json({ error: 'Invite created, but the email could not be sent.' });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('[scoop-alpha-email] Send failed', error);
    return res.status(502).json({ error: 'Invite created, but the email could not be sent.' });
  }
}
