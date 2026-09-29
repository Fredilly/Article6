function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

type ScoopWaitlistConfirmationInput = {
  name: string;
  email: string;
};

export async function sendScoopWaitlistConfirmation(input: ScoopWaitlistConfirmationInput): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('[scoop-waitlist-email] RESEND_API_KEY is not configured.');
    return false;
  }

  const fromAddress = process.env.SCOOP_ALPHA_FROM_EMAIL || 'contact@article6.org';
  const replyTo = process.env.SCOOP_ALPHA_REPLY_TO || 'contact@article6.org';

  const text = [
    `Hi ${input.name},`,
    '',
    'You’re on the Scoop Founding 100 list.',
    '',
    'We’re bringing people into the private alpha in small groups. If your spot opens, we’ll email you a separate personal invite with the install link.',
    '',
    'For now, there’s nothing else you need to do.',
    '',
    'Fred',
    'Founder, Scoop',
    '',
    'See it. Scoop it.',
  ].join('\n');

  const html = `<!doctype html>
<html>
  <body style="margin:0;background:#f3f6fb;font-family:Arial,Helvetica,sans-serif;color:#111318;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr><td style="padding:32px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:22px;">
          <tr><td style="padding:38px;">
            <div style="font-size:26px;font-weight:800;color:#1769FF;">Scoop</div>
            <div style="margin-top:34px;font-size:12px;font-weight:800;letter-spacing:.16em;color:#1769FF;">FOUNDING 100</div>
            <h1 style="margin:12px 0 18px;font-size:44px;line-height:1;letter-spacing:-.03em;">You’re on the list.</h1>
            <p style="font-size:17px;line-height:1.7;">Hi ${escapeHtml(input.name)}, your Founding 100 application is in.</p>
            <p style="font-size:17px;line-height:1.7;">We’re bringing people into the private alpha in small groups. If your spot opens, we’ll send a <strong>separate personal invite</strong> with the install link.</p>
            <div style="margin:26px 0;padding:18px;border-radius:16px;background:#eef4ff;font-size:15px;line-height:1.7;">
              Nothing else to do right now.
            </div>
            <p style="margin-top:28px;font-size:15px;line-height:1.7;">Fred<br>Founder, Scoop</p>
            <div style="margin-top:28px;font-weight:800;color:#1769FF;">See it. Scoop it.</div>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `Scoop <${fromAddress}>`,
        to: [input.email],
        reply_to: replyTo,
        subject: 'You’re on the Scoop Founding 100 list',
        text,
        html,
        tags: [{ name: 'source', value: 'scoop-founding-100-confirmation' }],
      }),
    });

    if (!response.ok) {
      console.error('[scoop-waitlist-email] Resend failed', {
        status: response.status,
        body: await response.text(),
      });
      return false;
    }

    return true;
  } catch (error) {
    console.error('[scoop-waitlist-email] Send failed', error);
    return false;
  }
}
