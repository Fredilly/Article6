const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
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

export function validScoopInviteUrl(value: string): boolean {
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

export type ScoopAlphaEmailResult = {
  id: string;
  status: string;
};

const FAILURE_STATUSES = new Set(['suppressed', 'bounced', 'failed']);

async function readResendStatus(apiKey: string, id: string): Promise<string> {
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt) await new Promise((resolve) => setTimeout(resolve, 500));
    const response = await fetch(`https://api.resend.com/emails/${encodeURIComponent(id)}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!response.ok) continue;
    const payload = await response.json().catch(() => ({})) as { last_event?: string; status?: string };
    const status = String(payload.last_event || payload.status || '').trim().toLowerCase();
    if (status) return status;
  }
  return 'sent';
}

export async function sendScoopAlphaInviteEmail(input: { name: string; email: string; inviteUrl: string }): Promise<ScoopAlphaEmailResult> {
  const name = input.name.trim().slice(0, 120);
  const email = input.email.trim().toLowerCase().slice(0, 254);
  const inviteUrl = input.inviteUrl.trim().slice(0, 2000);

  if (!name || !EMAIL_RE.test(email) || !validScoopInviteUrl(inviteUrl)) {
    throw new Error('Valid name, email, and Scoop invite URL are required.');
  }

  const apiKey = process.env.RESEND_API_KEY || '';
  if (!apiKey) throw new Error('Email is not configured.');

  const fromAddress = process.env.SCOOP_ALPHA_FROM_EMAIL || 'contact@article6.org';
  const replyTo = process.env.SCOOP_ALPHA_REPLY_TO || 'contact@article6.org';

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

  if (!response.ok) {
    const responseText = await response.text();
    console.error('[scoop-alpha-email] Resend failed', { status: response.status, body: responseText });
    throw new Error('Invite created, but the email could not be sent.');
  }

  const payload = await response.json().catch(() => ({})) as { id?: string };
  const id = typeof payload.id === 'string' ? payload.id : '';
  if (!id) throw new Error('Invite created, but Resend did not return an email id.');

  const status = await readResendStatus(apiKey, id);
  if (FAILURE_STATUSES.has(status)) {
    return { id, status };
  }
  return { id, status };
}
