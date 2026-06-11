# Post-Deploy Email Tests — Live Only

After every deployment to LIVE (not staging), run the email feature tests against the live site to verify contact and suggest forms actually send emails.

## Rule

- Run ONLY after `npm run deploy` (live deployment)
- Do NOT run after staging deploys (email bindings may not work on staging)
- Tag each test with version + datetime in the message body
- Tests are in `tests/email-features.spec.ts`

## Command

```bash
cd /Users/rajeevnaik/Code/xConvert.com/scrabblewordsfinder && SWF_TEST_URL=https://www.scrabblewordsfinder.com npx playwright test tests/email-features.spec.ts --reporter=list
```

## Verification

After tests run, check xconvert24@gmail.com inbox for:
- `[SWF Contact]` email from the contact form test
- `[SWF Suggestion]` email from the suggest form test

If emails arrive → tests pass end-to-end.
If emails don't arrive but API returned 200 → email routing issue (check Cloudflare dashboard).

## Agent Attribution

This is a **kiro** command for AuditLog purposes.
