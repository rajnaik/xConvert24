import type { APIRoute } from 'astro';

/**
 * POST /api/notify-copy — Send email notification when wallet address is copied
 */
export const POST: APIRoute = async ({ request }) => {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { address, timestamp } = body;

  if (!address) {
    return new Response(JSON.stringify({ error: 'address is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Send email notification using MailChannels (free on Cloudflare Workers)
  try {
    const emailPayload = {
      personalizations: [
        { to: [{ email: 'xconvert24@gmail.com', name: 'xConvert24' }] },
      ],
      from: { email: 'notifications@xconvert24.com', name: 'xConvert24 Notifications' },
      subject: '💜 Someone copied your Solana wallet address!',
      content: [
        {
          type: 'text/plain',
          value: `Someone copied the Solana wallet address on the Support page.\n\nWallet: ${address}\nTime: ${timestamp || new Date().toISOString()}\n\nThis could mean a donation is incoming! 🎉`,
        },
      ],
    };

    await fetch('https://api.mailchannels.net/tx/v1/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(emailPayload),
    });
  } catch {
    // Silently fail — don't block the user experience
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
