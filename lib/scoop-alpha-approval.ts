type AlphaInvite = {
  invite_url: string;
  token: string;
  expires_at: number;
  max_installs: number;
};

type AdminAuthResponse = {
  admin?: boolean;
  session_token?: string;
  error?: string;
};

function clean(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

export async function createScoopAlphaInvite(inviteId: string): Promise<AlphaInvite> {
  const credential = process.env.SCOOP_ALPHA_ADMIN_TOKEN || '';
  if (!credential) throw new Error('Scoop alpha admin credential is not configured.');

  const authResponse = await fetch('https://api.vcl.article6.org/admin/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential, label: 'Article6 CRM' }),
  });
  const auth = await authResponse.json().catch(() => ({})) as AdminAuthResponse;
  if (!authResponse.ok || !auth.session_token) {
    throw new Error(clean(auth.error, 200) || 'Could not authenticate with the Scoop API.');
  }

  const inviteResponse = await fetch('https://api.vcl.article6.org/alpha/admin/invite', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Scoop-Admin-Session': auth.session_token,
    },
    body: JSON.stringify({ invite_id: inviteId, ttl_days: 7, max_installs: 2 }),
  });
  const invite = await inviteResponse.json().catch(() => ({})) as Partial<AlphaInvite> & { error?: string };
  if (!inviteResponse.ok || !invite.invite_url || !invite.token || !invite.expires_at || !invite.max_installs) {
    throw new Error(clean(invite.error, 200) || 'Could not create the Scoop alpha invite.');
  }

  return invite as AlphaInvite;
}
