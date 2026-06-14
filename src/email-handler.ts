/**
 * Inbound Email Handler for xConvert24.com
 *
 * Handles emails routed by Cloudflare Email Routing (contact@, support@, info@xconvert24.com)
 * and forwards them to the destination stored in the SWF_NOTIFY_EMAIL secret.
 *
 * This is a named export so it can be wired into the Worker entry point (_worker.ts).
 */

/**
 * Cloudflare EmailMessage type for inbound email handling.
 * Defined locally since @cloudflare/workers-types is not a direct dependency.
 */
export interface EmailMessage {
  readonly from: string;
  readonly to: string;
  readonly headers: Headers;
  readonly raw: ReadableStream;
  readonly rawSize: number;
  setReject(reason: string): void;
  forward(rcptTo: string, headers?: Headers): Promise<void>;
  reply(message: EmailMessage): Promise<void>;
}

export interface Env {
  SWF_NOTIFY_EMAIL: string;
  BUGS_DB: D1Database;
  EMAIL: any;
}

/**
 * Handles inbound emails routed by Cloudflare Email Routing.
 * Forwards the message to the destination address stored in the SWF_NOTIFY_EMAIL secret.
 *
 * Guarantees:
 * - Never throws an unhandled exception regardless of secret state or network issues
 * - Logs errors for missing config or forward failures
 * - Discards messages gracefully when destination is not configured
 */
export async function emailHandler(
  message: EmailMessage,
  env: Env,
  ctx: ExecutionContext
): Promise<void> {
  // Step 1: Read destination secret
  const destination = env.SWF_NOTIFY_EMAIL;
  if (!destination || !destination.trim()) {
    console.error('[email] SWF_NOTIFY_EMAIL not configured — discarding message');
    return;
  }

  // Step 2: Forward the message preserving original content
  try {
    await message.forward(destination);
  } catch (err: any) {
    console.error(`[email] Forward failed for ${message.from}: ${err.message || err}`);
    // Don't rethrow — continue processing subsequent messages
  }
}
