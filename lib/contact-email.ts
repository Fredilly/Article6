import type { ContactEnquiryInput } from './contact-intake';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function sendContactEnquiryNotification(input: ContactEnquiryInput): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('[contact] RESEND_API_KEY is not configured.');
    return false;
  }

  const subjectWork = input.work.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120);
  const subject = `Website enquiry — ${subjectWork || input.organisation}`;
  const text = [
    'New Article6 website enquiry',
    '',
    `Name: ${input.name}`,
    `Email: ${input.email}`,
    `Organisation: ${input.organisation}`,
    `Working on: ${input.work}`,
    '',
    input.message,
  ].join('\n');

  const html = `<!doctype html><html><body style="margin:0;background:#f5f3ed;font-family:Arial,Helvetica,sans-serif;color:#171717;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding:32px 16px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e5e2db;"><tr><td style="padding:28px;"><p style="margin:0 0 24px;font-size:12px;line-height:18px;color:#777169;letter-spacing:1.5px;">ARTICLE6 · WEBSITE ENQUIRY</p><p style="margin:0 0 8px;font-size:15px;line-height:23px;color:#171717;"><strong>${escapeHtml(input.name)}</strong> · ${escapeHtml(input.organisation)}</p><p style="margin:0 0 24px;font-size:15px;line-height:23px;color:#5c5750;">${escapeHtml(input.email)}</p><p style="margin:0 0 8px;font-size:13px;line-height:20px;color:#777169;">WORKING ON</p><p style="margin:0 0 24px;font-size:17px;line-height:26px;color:#171717;">${escapeHtml(input.work)}</p><p style="margin:0;font-size:15px;line-height:25px;color:#37332f;white-space:pre-wrap;">${escapeHtml(input.message)}</p></td></tr></table></td></tr></table></body></html>`;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Article6 <contact@article6.org>',
        to: ['contact@article6.org'],
        reply_to: input.email,
        subject,
        text,
        html,
        tags: [{ name: 'source', value: 'article6-contact-form' }],
      }),
    });

    if (!response.ok) {
      console.error('[contact] Resend notification failed', {
        status: response.status,
        body: await response.text(),
      });
      return false;
    }

    return true;
  } catch (error) {
    console.error('[contact] Resend notification failed', error);
    return false;
  }
}
