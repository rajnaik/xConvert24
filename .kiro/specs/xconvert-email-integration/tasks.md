# Implementation Plan: xConvert Email Integration

## Overview

Implement Cloudflare Email Service integration for xConvert24.com, enabling inbound email forwarding and outbound transactional email sending from contact/suggest forms. Follows the "save-first, email-best-effort" pattern where all submissions persist to D1 before any email send attempt.

## Tasks

- [x] 1. Configure wrangler email bindings
  - [x] 1.1 Add send_email binding and email_routing to wrangler config files
    - Add `"send_email": [{ "name": "EMAIL" }]` to `wrangler.jsonc` (live), `wrangler.staging.jsonc`, and `wrangler.dev.jsonc`
    - Add `"email_routing"` section with `has` matcher listing contact@, support@, info@xconvert24.com to `wrangler.jsonc` (live) only
    - Verify binding name is exactly `"EMAIL"` in all three files
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 2. Implement shared email utility library
  - [x] 2.1 Create `src/lib/email.ts` with types and helper functions
    - Define `EmailPayload`, `SendResult`, `ContactFormBody`, `SuggestFormBody`, `SuccessResponse`, `ErrorResponse` interfaces
    - Implement `SUBJECT_MAP` constant with all 5 category mappings (general, bug, feature, privacy, other)
    - Implement `mapSubjectCategory(raw: string): string | null`
    - Implement `sanitizeName(name: string | undefined | null, maxLength?: number): string` — trim, truncate, default to "Anonymous"
    - Implement `formatEmailSubject(payload: EmailPayload): string` — format as `[xConvert Contact] <Mapped> from <Name>` or `[xConvert Suggestion] from <Name>`
    - Implement `formatEmailBody(payload: EmailPayload): string` — structured body with From, Reply-to, Subject category, Message, separator, footer, IP
    - Implement `sendNotificationEmail(emailBinding, destination, payload): Promise<SendResult>` — wraps EMAIL.send() in try/catch, uses `noreply@xconvert24.com` as sender
    - Implement `validateContactBody(body: any)` — validates name (required, max 100), email (required, max 254), subject (must be in SUBJECT_MAP), message (required, max 5000)
    - Implement `validateSuggestBody(body: any)` — validates message (required, non-whitespace, max 5000), optional name (max 200), optional email (max 254)
    - Export a `jsonResponse(data, status)` helper for consistent API responses
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 7.1, 7.2, 7.3, 8.1, 8.2_

  - [ ]* 2.2 Write property tests for email utility functions
    - **Property 4: Validation Completeness (Contact)** — for any valid ContactFormBody, formatEmailSubject always starts with `[xConvert Contact]`
    - **Property 5: Validation Completeness (Suggest)** — for any valid SuggestFormBody, formatEmailSubject always starts with `[xConvert Suggestion]`
    - **Property 10: Subject Mapping Strictness** — for any key in SUBJECT_MAP, mapSubjectCategory returns non-null; for any key NOT in SUBJECT_MAP, returns null
    - Test sanitizeName: for any input and maxLength n, result.length <= n and result is never empty
    - Use fast-check as the property test library
    - **Validates: Requirements 4.1, 4.2, 4.4, 4.5, 4.6, 7.1, 8.2**

  - [ ]* 2.3 Write unit tests for email utility functions
    - Test mapSubjectCategory with all 5 valid values and invalid values
    - Test sanitizeName with empty, null, undefined, whitespace, normal, and oversized inputs
    - Test formatEmailSubject for contact and suggest categories with edge cases
    - Test formatEmailBody output structure with and without email field
    - Test validateContactBody with valid inputs, missing fields, oversized fields, invalid subject
    - Test validateSuggestBody with valid inputs, empty message, whitespace-only message
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 7.1, 7.2, 7.3, 8.1, 8.2_

- [x] 3. Implement Contact API endpoint
  - [x] 3.1 Create `src/pages/api/contact.ts` with POST handler
    - Import `env` from `cloudflare:workers` and shared email utilities from `src/lib/email.ts`
    - Parse JSON body with try/catch (return 400 on invalid JSON)
    - Validate input using `validateContactBody()` (return 400 on failure)
    - Access `BUGS_DB` binding from env; return 503 if unavailable
    - Capture client IP from `cf-connecting-ip` header (fallback: "unknown")
    - Map subject using `mapSubjectCategory()` — store mapped value in DB
    - INSERT into `emails` table with category="contact", fields truncated to max lengths, BEFORE email send
    - On DB failure: return 503 `{ error: "Service temporarily unavailable" }` and do NOT attempt email
    - Attempt email send via `sendNotificationEmail()` using `EMAIL` binding and `SWF_NOTIFY_EMAIL` secret
    - On email failure: UPDATE the record's `comment` field with the error message
    - Return 200 `{ ok: true }` if DB save succeeded (regardless of email outcome)
    - Never include `SWF_NOTIFY_EMAIL` value in any response
    - _Requirements: 2.1, 2.3, 2.4, 3.1, 3.3, 3.4, 3.5, 3.7, 5.2, 5.4, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 9.1, 9.3, 9.5_

  - [ ]* 3.2 Write property tests for Contact API
    - **Property 1: Save-Before-Send Invariant** — DB insert always executes before EMAIL.send() is called
    - **Property 2: No Data Loss on Email Failure** — if email send throws, response is still 200 when DB save succeeded
    - **Property 3: No Secret Leakage** — SWF_NOTIFY_EMAIL value never appears in any response body
    - **Property 9: Category Integrity** — category field is always exactly "contact"
    - **Validates: Requirements 3.1, 3.5, 3.7, 5.2, 7.6, 9.1**

- [x] 4. Checkpoint - Verify contact form flow
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement Suggest API endpoint
  - [x] 5.1 Create `src/pages/api/suggest.ts` with POST handler
    - Import `env` from `cloudflare:workers` and shared email utilities from `src/lib/email.ts`
    - Parse JSON body with try/catch (return 400 `{ error: "Invalid JSON" }` on failure)
    - Validate input using `validateSuggestBody()` (return 400 on failure with error field)
    - Access `BUGS_DB` binding from env; return 503 if unavailable
    - Capture client IP from `cf-connecting-ip` header (fallback: "unknown")
    - INSERT into `emails` table with category="suggest", subject="Feature Suggestion", optional name/email truncated, BEFORE email send
    - On DB failure: return 503 `{ error: "Service temporarily unavailable" }`
    - Attempt email send via `sendNotificationEmail()` using `EMAIL` binding and `SWF_NOTIFY_EMAIL` secret
    - On email failure: UPDATE the record's `comment` field with the error message
    - Return 200 `{ ok: true }` if DB save succeeded (regardless of email outcome)
    - _Requirements: 2.2, 2.3, 2.5, 3.2, 3.3, 3.6, 3.8, 5.2, 5.4, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 9.2, 9.4, 9.6_

  - [ ]* 5.2 Write property tests for Suggest API
    - **Property 2: No Data Loss on Email Failure** — if email send throws, response is still 200 when DB save succeeded
    - **Property 5: Validation Completeness (Suggest)** — a 200 response implies message is non-empty and non-whitespace
    - **Property 6: Error Logging** — if email send fails after DB save, the comment field contains the error message
    - **Property 7: Idempotent Error Recovery** — email failure only updates comment field, all other fields unchanged
    - **Property 9: Category Integrity** — category field is always exactly "suggest"
    - **Validates: Requirements 3.2, 3.6, 3.8, 8.2, 8.5, 9.2, 9.4**

- [x] 6. Implement inbound email handler
  - [x] 6.1 Create `src/email-handler.ts` with the email() export logic
    - Import `EmailMessage` type from `@cloudflare/workers-types`
    - Define `Env` interface with `SWF_NOTIFY_EMAIL`, `BUGS_DB`, `EMAIL`
    - Implement `email(message: EmailMessage, env: Env, ctx: ExecutionContext): Promise<void>`
    - Read destination from `env.SWF_NOTIFY_EMAIL`; if missing/empty, log error and return (discard message, don't crash)
    - Call `message.forward(destination)` wrapped in try/catch; log any forward failures
    - Never throw unhandled exceptions regardless of secret state or network issues
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [x] 6.2 Wire email handler into Worker entry point
    - Create or extend `_worker.ts` at project root to export the `email()` handler alongside Astro's fetch handler
    - Import the email handler from `src/email-handler.ts`
    - Ensure Astro-generated Worker entry is not overridden (the `_worker.ts` must re-export Astro's default fetch)
    - Verify the email export signature matches Cloudflare Workers email handler spec
    - _Requirements: 1.1, 1.4_

  - [ ]* 6.3 Write unit tests for inbound email handler
    - **Property 8: Inbound Forwarding Safety** — email() never throws regardless of secret state or network failures
    - Test with missing/empty SWF_NOTIFY_EMAIL — verify message discarded, no exception
    - Test with valid secret — verify message.forward() called with correct destination
    - Test with forward() throwing — verify error logged, no unhandled exception
    - **Validates: Requirements 1.1, 1.2, 1.3**

- [x] 7. Checkpoint - Verify all endpoints and email handler
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Final wiring and build verification
  - [x] 8.1 Verify TypeScript types compile and build passes
    - Run `npm run build` (or `astro build`) to confirm no type errors or missing imports
    - Verify `EMAIL` binding is properly typed or cast via `(env as any).EMAIL`
    - Confirm `_worker.ts` email export doesn't conflict with Astro adapter output
    - Verify all imports between `src/lib/email.ts`, `src/pages/api/contact.ts`, `src/pages/api/suggest.ts`, and `src/email-handler.ts` resolve correctly
    - _Requirements: 6.1, 6.5_

  - [ ]* 8.2 Write integration tests for full form submission flow
    - Test contact form: valid submission → verify 200 response with `{ ok: true }`
    - Test contact form: invalid JSON → verify 400 response
    - Test contact form: missing fields → verify 400 with field-specific error
    - Test contact form: invalid subject category → verify 400 with "Invalid subject category"
    - Test suggest form: valid submission → verify 200 response with `{ ok: true }`
    - Test suggest form: empty message → verify 400 with "message is required"
    - Test suggest form: whitespace-only message → verify 400
    - Test suggest form: invalid JSON → verify 400 with error field
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 8.1, 8.2, 8.3, 8.4_

- [x] 9. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The project uses Astro + Cloudflare Workers adapter; bindings accessed via `import { env } from 'cloudflare:workers'`
- The `emails` table already exists in D1 — no migration needed
- D1 binding: `BUGS_DB`, Email binding: `EMAIL`, Secret: `SWF_NOTIFY_EMAIL`
- Astro generates the Worker entry; the `email()` export needs a `_worker.ts` file at project root

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "2.1"] },
    { "id": 1, "tasks": ["2.2", "2.3"] },
    { "id": 2, "tasks": ["3.1", "5.1", "6.1"] },
    { "id": 3, "tasks": ["3.2", "5.2", "6.2"] },
    { "id": 4, "tasks": ["6.3", "8.1"] },
    { "id": 5, "tasks": ["8.2"] }
  ]
}
```
