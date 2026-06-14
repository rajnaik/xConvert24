# Requirements Document

## Introduction

This feature integrates Cloudflare Email Service into xConvert24.com, enabling both inbound email handling (receiving emails via Cloudflare Email Routing and forwarding to a destination address) and outbound email sending (using the `SEND_EMAIL` binding to send transactional emails programmatically from the Worker). All form submissions (contact, suggest) are persisted to the `emails` D1 table before any email send attempt. Destination addresses are stored as Worker secrets and never hardcoded.

## Glossary

- **Email_Worker**: The Cloudflare Worker email handler that processes inbound emails via the `email()` export and sends outbound emails via the `SEND_EMAIL` binding
- **SEND_EMAIL_Binding**: The Cloudflare Worker binding (`SEND_EMAIL`) used to send outbound transactional emails programmatically
- **Email_Routing**: Cloudflare Email Routing rules that direct inbound emails (contact@, support@, info@xconvert24.com) to the Email_Worker
- **Destination_Secret**: The Worker secret (`SWF_NOTIFY_EMAIL`) storing the forwarding destination email address
- **Emails_Table**: The D1 database table (`emails`) that stores all email submissions persistently
- **Contact_API**: The `/api/contact` endpoint that processes contact form submissions
- **Suggest_API**: The `/api/suggest` endpoint that processes feature suggestion form submissions
- **Inbound_Email**: An email received by the Email_Worker via Cloudflare Email Routing
- **Outbound_Email**: An email sent programmatically by the Worker using the SEND_EMAIL_Binding

## Requirements

### Requirement 1: Inbound Email Forwarding

**User Story:** As a site owner, I want inbound emails sent to xconvert24.com addresses to be forwarded to my notification email, so that I receive messages from users without exposing my personal email address.

#### Acceptance Criteria

1. WHEN an Inbound_Email is received by the Email_Worker, THE Email_Worker SHALL forward the Inbound_Email to the address stored in Destination_Secret, preserving the original sender address, subject line, and message body (including any plain-text and HTML parts)
2. IF an Inbound_Email is received and Destination_Secret is not configured or is empty, THEN THE Email_Worker SHALL log an error message indicating the missing destination configuration, discard the Inbound_Email, and continue processing subsequent messages without crashing
3. IF an Inbound_Email forwarding attempt fails due to a network error or rejection by the destination mail server, THEN THE Email_Worker SHALL log the failure reason and continue processing subsequent messages without throwing an unhandled exception
4. THE Email_Routing SHALL route emails sent to contact@xconvert24.com, support@xconvert24.com, and info@xconvert24.com to the Email_Worker
5. IF an Inbound_Email is received for an address at xconvert24.com that is not listed in the Email_Routing rules, THEN THE Email_Worker SHALL reject the message without forwarding it

### Requirement 2: Outbound Email Sending via SEND_EMAIL Binding

**User Story:** As a site owner, I want the Worker to send transactional notification emails when form submissions occur, so that I am immediately alerted to new contact and suggestion messages.

#### Acceptance Criteria

1. WHEN the Contact_API receives a valid form submission and the Emails_Table save succeeds, THE Contact_API SHALL send an Outbound_Email to Destination_Secret using the SEND_EMAIL_Binding within 10 seconds of the save completing
2. WHEN the Suggest_API receives a valid form submission and the Emails_Table save succeeds, THE Suggest_API SHALL send an Outbound_Email to Destination_Secret using the SEND_EMAIL_Binding within 10 seconds of the save completing
3. THE Outbound_Email SHALL use `noreply@xconvert24.com` as the sender address
4. IF the SEND_EMAIL_Binding is unavailable or the send throws an error, THEN THE Contact_API SHALL return a 200 status response to the user provided the Emails_Table save succeeded
5. IF the SEND_EMAIL_Binding is unavailable or the send throws an error, THEN THE Suggest_API SHALL return a 200 status response to the user provided the Emails_Table save succeeded
6. IF the SEND_EMAIL_Binding send does not complete within 30 seconds, THEN THE Contact_API SHALL treat the send as failed and proceed with the success response to the user

### Requirement 3: Database Persistence Before Email Send

**User Story:** As a site owner, I want all form submissions saved to the database before attempting email delivery, so that no submissions are lost if email sending fails.

#### Acceptance Criteria

1. WHEN the Contact_API receives a valid form submission, THE Contact_API SHALL insert a record into the Emails_Table before invoking the Outbound_Email send operation
2. WHEN the Suggest_API receives a valid form submission, THE Suggest_API SHALL insert a record into the Emails_Table before invoking the Outbound_Email send operation
3. THE Emails_Table record SHALL include the fields: category (set to "contact" or "suggest"), name (max 200 characters), email (max 254 characters), subject (max 200 characters), message (max 5000 characters), ip_address (max 45 characters), and created_at (ISO 8601 UTC timestamp defaulting to current time)
4. THE Contact_API SHALL capture the client IP address from the `cf-connecting-ip` request header for the ip_address field, storing "unknown" if the header is absent
5. IF the Emails_Table insert fails, THEN THE Contact_API SHALL return a JSON error response with HTTP status 500 and SHALL NOT attempt to send an Outbound_Email
6. IF the Emails_Table insert fails, THEN THE Suggest_API SHALL return a JSON error response with HTTP status 500 and SHALL NOT attempt to send an Outbound_Email
7. IF the Outbound_Email send fails after a successful Emails_Table insert, THEN THE Contact_API SHALL still return a success response with HTTP status 200 to the client
8. IF the Outbound_Email send fails after a successful Emails_Table insert, THEN THE Suggest_API SHALL still return a success response with HTTP status 200 to the client

### Requirement 4: Email Subject and Body Formatting

**User Story:** As a site owner, I want notification emails to follow a consistent format with clear subject lines and structured body content, so that I can quickly identify and triage incoming messages.

#### Acceptance Criteria

1. WHEN the Contact_API sends an Outbound_Email, THE Contact_API SHALL format the subject as `[xConvert Contact] <Mapped_Subject_Category> from <Name>`, where Name is the sender's name truncated to a maximum of 50 characters
2. WHEN the Suggest_API sends an Outbound_Email, THE Suggest_API SHALL format the subject as `[xConvert Suggestion] from <Name>`, where Name is the sender's name truncated to a maximum of 50 characters
3. THE Outbound_Email body SHALL present fields in the following order: sender name, reply-to email address, subject category, message content, a separator line, a site identification footer stating the originating site domain and form type, and the client IP address
4. THE Contact_API SHALL map subject category values using the defined mapping: general to "General Question", bug to "Bug Report", feature to "Feature Suggestion", privacy to "Privacy / Data", other to "Other"
5. IF the Contact_API receives a subject category value that does not match any entry in the defined mapping, THEN THE Contact_API SHALL reject the request and return an error response indicating an invalid subject category
6. IF the Name field is empty or contains only whitespace, THEN THE system SHALL substitute the literal string "Anonymous" in the subject line in place of the name value

### Requirement 5: Destination Email Security

**User Story:** As a site owner, I want the destination email address stored securely as a Worker secret, so that my personal email is never exposed in source code, configuration files, or client-facing responses.

#### Acceptance Criteria

1. THE Email_Worker SHALL read the destination email address exclusively from the Destination_Secret Worker secret
2. THE Email_Worker SHALL NOT include the destination email address in any HTTP response body, HTTP response header, HTML output, error message, or client-accessible resource
3. THE Destination_Secret SHALL be configured independently for each environment (dev, staging, live) using `wrangler secret put`
4. IF the Destination_Secret is not configured or is empty at runtime, THEN THE Email_Worker SHALL return an error response indicating that the email service is unavailable without revealing the secret name or its expected value

### Requirement 6: Wrangler Configuration for Email Bindings

**User Story:** As a developer, I want the SEND_EMAIL binding and email routing configured in all wrangler config files, so that the email integration works consistently across dev, staging, and live environments.

#### Acceptance Criteria

1. THE wrangler.jsonc (live) SHALL declare a `send_email` array containing an entry with `"name": "EMAIL"` to provide the SEND_EMAIL_Binding to the Worker
2. THE wrangler.staging.jsonc SHALL declare a `send_email` array containing an entry with `"name": "EMAIL"` identical in structure to the live configuration
3. THE wrangler.dev.jsonc SHALL declare a `send_email` array containing an entry with `"name": "EMAIL"` identical in structure to the live configuration
4. WHEN the Worker defines an `email()` export for inbound email handling, THE wrangler.jsonc (live) SHALL include an `email_routing` section with a `"has"` matcher specifying component `"envelope"`, type `"to"`, and listing the routed addresses (contact@xconvert24.com, support@xconvert24.com, info@xconvert24.com)
5. IF the `send_email` binding is missing or uses a `name` value other than `"EMAIL"` in any wrangler config file, THEN THE Worker deployment SHALL fail to access the SEND_EMAIL_Binding at runtime

### Requirement 7: Contact Form API Endpoint

**User Story:** As a site user, I want to submit a contact form and receive confirmation that my message was received, so that I know my inquiry will be addressed.

#### Acceptance Criteria

1. THE Contact_API SHALL accept POST requests with JSON body containing name (maximum 100 characters), email (maximum 254 characters), subject (maximum 200 characters), and message (maximum 5000 characters) fields
2. IF the name or email or subject field is empty or missing, THEN THE Contact_API SHALL return a 400 error response with an error message indicating which required fields are missing or empty
3. IF the message field is empty or missing, THEN THE Contact_API SHALL return a 400 error response with an error message indicating the message field is required
4. IF the request body is not valid JSON, THEN THE Contact_API SHALL return a 400 error response
5. WHEN the submission is saved successfully to the Emails_Table, THE Contact_API SHALL return a 200 success response regardless of email delivery outcome
6. THE Contact_API SHALL store "contact" as the category value in the Emails_Table record
7. IF the database save to Emails_Table fails, THEN THE Contact_API SHALL return a 500 error response and SHALL NOT attempt email delivery

### Requirement 8: Suggest Form API Endpoint

**User Story:** As a site user, I want to submit a feature suggestion and receive confirmation that it was recorded, so that I know my idea has been captured.

#### Acceptance Criteria

1. THE Suggest_API SHALL accept POST requests with a JSON body containing name (optional, max 200 characters), email (optional, max 254 characters), and message (required, max 5000 characters) fields
2. IF the message field is empty, missing, or contains only whitespace, THEN THE Suggest_API SHALL return a 400 error response with a JSON body containing an error field indicating the message is required
3. IF the request body is not valid JSON, THEN THE Suggest_API SHALL return a 400 error response with a JSON body containing an error field indicating invalid JSON
4. WHEN the submission is saved successfully to the Emails_Table, THE Suggest_API SHALL return a 200 success response with a JSON body containing an ok field set to true, regardless of email delivery outcome
5. THE Suggest_API SHALL store "suggest" as the category value in the Emails_Table record
6. IF the database is unavailable or the write operation fails, THEN THE Suggest_API SHALL return a 500 error response with a JSON body containing an error field indicating the failure

### Requirement 9: Error Handling and Graceful Degradation

**User Story:** As a site owner, I want the email system to degrade gracefully when components are unavailable, so that users always get a response and no data is lost.

#### Acceptance Criteria

1. WHEN the SEND_EMAIL_Binding throws an error during send, THE Contact_API SHALL catch the error and update the corresponding Emails_Table record's comment field with the error message within the same request lifecycle
2. WHEN the SEND_EMAIL_Binding throws an error during send, THE Suggest_API SHALL catch the error and update the corresponding Emails_Table record's comment field with the error message within the same request lifecycle
3. WHEN an Outbound_Email send fails, THE Contact_API SHALL return a 200 success response to the user if the Emails_Table save succeeded
4. WHEN an Outbound_Email send fails, THE Suggest_API SHALL return a 200 success response to the user if the Emails_Table save succeeded
5. IF the Emails_Table database connection fails on insert, THEN THE Contact_API SHALL return a 503 error response with a JSON body containing an error field stating "Service temporarily unavailable"
6. IF the Emails_Table database connection fails on insert, THEN THE Suggest_API SHALL return a 503 error response with a JSON body containing an error field stating "Service temporarily unavailable"
