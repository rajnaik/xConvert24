/**
 * Shared email utility library for xConvert24.com
 *
 * Provides formatting, validation, and sending helpers used by
 * the Contact and Suggest API endpoints.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface EmailPayload {
  category: 'contact' | 'suggest';
  name: string;
  email: string;
  subject: string;
  message: string;
  ipAddress: string;
}

export interface SendResult {
  success: boolean;
  error?: string;
}

export interface ContactFormBody {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface SuggestFormBody {
  name?: string;
  email?: string;
  message: string;
}

export interface SuccessResponse {
  ok: true;
}

export interface ErrorResponse {
  error: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

export const SUBJECT_MAP: Record<string, string> = {
  general: 'General Question',
  bug: 'Bug Report',
  feature: 'Feature Suggestion',
  privacy: 'Privacy / Data',
  other: 'Other',
};

// ─── Helper Functions ────────────────────────────────────────────────────────

/**
 * Map a raw subject category key to its display name.
 * Returns null for unknown categories.
 */
export function mapSubjectCategory(raw: string): string | null {
  return SUBJECT_MAP[raw] ?? null;
}

/**
 * Sanitize a name value: trim, truncate to maxLength, default to "Anonymous".
 */
export function sanitizeName(name: string | undefined | null, maxLength: number = 50): string {
  const trimmed = (name || '').trim();
  if (!trimmed) return 'Anonymous';
  return trimmed.slice(0, maxLength);
}

/**
 * Format the email subject line based on category.
 * - Contact: [xConvert Contact] <Mapped Subject> from <Name>
 * - Suggest: [xConvert Suggestion] from <Name>
 */
export function formatEmailSubject(payload: EmailPayload): string {
  const name = sanitizeName(payload.name, 50);
  if (payload.category === 'contact') {
    const mapped = mapSubjectCategory(payload.subject) || 'Message';
    return `[xConvert Contact] ${mapped} from ${name}`;
  }
  return `[xConvert Suggestion] from ${name}`;
}

/**
 * Format a structured email body with From, Reply-to, Subject, Message,
 * separator, footer, and IP address.
 */
export function formatEmailBody(payload: EmailPayload): string {
  const lines: string[] = [
    `From: ${payload.name || 'Anonymous'}`,
  ];
  if (payload.email) {
    lines.push(`Reply-to: ${payload.email}`);
  }
  if (payload.category === 'contact') {
    lines.push(`Subject: ${mapSubjectCategory(payload.subject) || payload.subject}`);
  }
  lines.push('', payload.message, '', '---');
  lines.push(`Sent via xconvert24.com ${payload.category} form`);
  lines.push(`IP: ${payload.ipAddress || 'unknown'}`);
  return lines.join('\n');
}

/**
 * Send a notification email via the EMAIL binding.
 * Wraps EMAIL.send() in try/catch — never throws.
 */
export async function sendNotificationEmail(
  emailBinding: any,
  destination: string,
  payload: EmailPayload
): Promise<SendResult> {
  try {
    const subject = formatEmailSubject(payload);
    const body = formatEmailBody(payload);
    await emailBinding.send({
      from: 'noreply@xconvert24.com',
      to: destination,
      subject,
      text: body,
    });
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Email send failed' };
  }
}

/**
 * Validate a contact form request body.
 * Returns sanitized data on success, or an error message on failure.
 */
export function validateContactBody(
  body: any
): { valid: true; data: ContactFormBody } | { valid: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Invalid request body' };
  }

  const name = (body.name || '').trim();
  const email = (body.email || '').trim();
  const subject = (body.subject || '').trim();
  const message = (body.message || '').trim();

  if (!name) return { valid: false, error: 'name is required' };
  if (name.length > 100) return { valid: false, error: 'name must be 100 characters or less' };

  if (!email) return { valid: false, error: 'email is required' };
  if (email.length > 254) return { valid: false, error: 'email must be 254 characters or less' };

  if (!subject) return { valid: false, error: 'subject is required' };
  if (!SUBJECT_MAP[subject]) return { valid: false, error: 'Invalid subject category' };

  if (!message) return { valid: false, error: 'message is required' };
  if (message.length > 5000) return { valid: false, error: 'message must be 5000 characters or less' };

  return { valid: true, data: { name, email, subject, message } };
}

/**
 * Validate a suggest form request body.
 * Returns sanitized data on success, or an error message on failure.
 */
export function validateSuggestBody(
  body: any
): { valid: true; data: SuggestFormBody } | { valid: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Invalid request body' };
  }

  const message = (body.message || '').trim();
  if (!message) return { valid: false, error: 'message is required' };
  if (message.length > 5000) return { valid: false, error: 'message must be 5000 characters or less' };

  const name = body.name ? String(body.name).trim().slice(0, 200) : undefined;
  const email = body.email ? String(body.email).trim().slice(0, 254) : undefined;

  return { valid: true, data: { message, name, email } };
}

/**
 * Create a consistent JSON response with the given data and status code.
 */
export function jsonResponse(data: SuccessResponse | ErrorResponse | Record<string, any>, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
