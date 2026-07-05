#!/usr/bin/env python3
"""
process-bounced-emails.py — Parse bounced email .zip files and update campaign_leads DB

Reads all .zip files from ~/Desktop/Kiro/emails/, extracts .eml files,
classifies each as BOUNCED or PROSPECTIVE, then generates wrangler SQL
commands to update the campaign_leads table.

Usage:
  cd /Users/rajeevnaik/Code/xConvert.com/scrabblewordsfinder
  python3 tools/process-bounced-emails.py              # dry-run (shows SQL)
  python3 tools/process-bounced-emails.py --apply      # apply to local DB
  python3 tools/process-bounced-emails.py --apply --remote  # apply to live DB
"""

import os
import re
import sys
import subprocess
import tempfile
import shutil

# ─── CONFIG ───────────────────────────────────────────────────────────────────
EMAIL_DIR = os.path.expanduser("~/Desktop/Kiro/emails")
SWF_DIR = os.path.expanduser("~/Code/xConvert.com/scrabblewordsfinder")
POSITIVE_SIGNALS = [
    'thank you for your email',
    'we have received',
    'forwarded',
    'pass this on',
    'pass it on',
    'relevant person',
    'relevant department',
    'relevant member',
    'acknowledge',
    'will forward',
    'been received',
    'passed on',
    'colleague',
    'team will',
]

# ─── EXTRACT ZIPS ────────────────────────────────────────────────────────────
def extract_all_zips(email_dir, output_dir):
    """Extract all .zip files into output_dir using ditto (macOS)."""
    zips = [f for f in os.listdir(email_dir) if f.endswith('.zip')]
    if not zips:
        print(f"No .zip files found in {email_dir}")
        sys.exit(1)
    print(f"Found {len(zips)} zip file(s): {', '.join(zips)}")
    for z in zips:
        path = os.path.join(email_dir, z)
        subprocess.run(['ditto', '-xk', path, output_dir], capture_output=True)
    eml_files = [f for f in os.listdir(output_dir) if f.endswith('.eml')]
    print(f"Extracted {len(eml_files)} .eml files")
    return eml_files

# ─── PARSE EMAILS ────────────────────────────────────────────────────────────
def parse_emails(output_dir):
    """Parse .eml files and classify as bounced or prospective."""
    bounced = []
    prospective = []

    for fname in os.listdir(output_dir):
        if not fname.endswith('.eml'):
            continue
        filepath = os.path.join(output_dir, fname)
        with open(filepath, 'r', errors='ignore') as f:
            content = f.read()

        recipient = None

        # Extract bounce recipient
        fr_match = re.search(r'Final-Recipient:\s*rfc822;\s*(\S+@\S+)', content)
        xfr_match = re.search(r'X-Failed-Recipients:\s*(\S+@\S+)', content)
        if fr_match:
            recipient = fr_match.group(1).strip().lower().rstrip('>')
        elif xfr_match:
            recipient = xfr_match.group(1).strip().lower().rstrip('>')

        # Classify
        is_bounce = False
        is_good = False
        response_text = ''

        if 'Delivery Status Notification (Failure)' in fname or 'Action: failed' in content:
            is_bounce = True
        elif 'Undelivered' in fname or 'undeliverable' in content.lower():
            is_bounce = True
        elif 'Automatic reply' in fname or 'Out of Office' in fname.lower() or 'Auto-reply' in fname:
            lower_content = content.lower()
            if any(sig in lower_content for sig in POSITIVE_SIGNALS):
                is_good = True
                from_match = re.search(r'From:.*?([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})', content)
                if from_match and from_match.group(1).lower() != 'xconvert24@gmail.com':
                    recipient = from_match.group(1).strip().lower()
                # Extract a snippet of the positive response
                for sig in POSITIVE_SIGNALS:
                    idx = lower_content.find(sig)
                    if idx != -1:
                        response_text = content[max(0, idx-20):idx+100].strip().replace('\n', ' ')[:120]
                        break
        else:
            lower_content = content.lower()
            if any(sig in lower_content for sig in POSITIVE_SIGNALS):
                is_good = True
                from_match = re.search(r'From:.*?([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})', content)
                if from_match and from_match.group(1).lower() != 'xconvert24@gmail.com':
                    recipient = from_match.group(1).strip().lower()
                for sig in POSITIVE_SIGNALS:
                    idx = lower_content.find(sig)
                    if idx != -1:
                        response_text = content[max(0, idx-20):idx+100].strip().replace('\n', ' ')[:120]
                        break

        # Skip our own email
        if recipient and recipient == 'xconvert24@gmail.com':
            recipient = None

        if is_bounce and recipient:
            bounced.append(recipient)
        elif is_good and recipient:
            prospective.append((recipient, response_text))

    bounced = sorted(set(bounced))
    prospective_deduped = {}
    for email, resp in prospective:
        if email not in prospective_deduped:
            prospective_deduped[email] = resp
    prospective = [(k, v) for k, v in prospective_deduped.items()]

    return bounced, prospective

# ─── GENERATE SQL ─────────────────────────────────────────────────────────────
def generate_sql(bounced, prospective):
    """Generate SQL UPDATE statements including email_variant_sent."""
    statements = []

    if bounced:
        for email in bounced:
            domain = email.split('@')[1] if '@' in email else ''
            prefix = email.split('@')[0] if '@' in email else 'office'
            if domain:
                statements.append(
                    f"UPDATE campaign_leads SET bounced = 1, email_variant_sent = '{prefix}' WHERE email LIKE '%{domain}%';"
                )

    for email, response in prospective:
        domain = email.split('@')[1] if '@' in email else ''
        prefix = email.split('@')[0] if '@' in email else 'office'
        safe_response = response.replace("'", "''")
        if domain:
            statements.append(
                f"UPDATE campaign_leads SET response = '{safe_response}', email_variant_sent = '{prefix}' WHERE email LIKE '%{domain}%';"
            )

    return statements

# ─── APPLY TO DB ──────────────────────────────────────────────────────────────
def apply_sql(statements, remote=False):
    """Apply SQL statements via wrangler d1 execute."""
    for sql in statements:
        cmd = ['npx', 'wrangler', 'd1', 'execute', 'DB']
        if remote:
            cmd.append('--remote')
        else:
            cmd.append('--local')
        cmd.extend(['--command', sql])
        result = subprocess.run(cmd, cwd=SWF_DIR, capture_output=True, text=True)
        if result.returncode != 0:
            print(f"  ERROR: {result.stderr[:200]}")
        else:
            print(f"  OK: {sql[:80]}...")

# ─── MAIN ─────────────────────────────────────────────────────────────────────
def main():
    apply = '--apply' in sys.argv
    remote = '--remote' in sys.argv

    print("=" * 60)
    print("  Bounced Email Processor — campaign_leads updater")
    print("=" * 60)
    print(f"\n  Source: {EMAIL_DIR}")
    print(f"  Mode: {'APPLY' if apply else 'DRY RUN'} ({'REMOTE/LIVE' if remote else 'LOCAL'})")
    print()

    # Extract
    tmp_dir = tempfile.mkdtemp(prefix='bounced-emails-')
    try:
        eml_files = extract_all_zips(EMAIL_DIR, tmp_dir)
        if not eml_files:
            print("No .eml files found after extraction.")
            return

        # Parse
        bounced, prospective = parse_emails(tmp_dir)

        print(f"\n{'=' * 60}")
        print(f"  RESULTS")
        print(f"{'=' * 60}")
        print(f"\n  BOUNCED: {len(bounced)} addresses")
        for e in bounced[:10]:
            print(f"    ❌ {e}")
        if len(bounced) > 10:
            print(f"    ... and {len(bounced) - 10} more")

        print(f"\n  PROSPECTIVE: {len(prospective)} addresses")
        for e, r in prospective:
            print(f"    ✅ {e}")
            if r:
                print(f"       → {r[:80]}")

        # Generate SQL
        statements = generate_sql(bounced, prospective)

        print(f"\n{'=' * 60}")
        print(f"  SQL STATEMENTS ({len(statements)})")
        print(f"{'=' * 60}\n")
        for s in statements:
            print(f"  {s[:120]}")
            if len(s) > 120:
                print(f"  ...({len(s)} chars)")

        if apply:
            print(f"\n  Applying to {'REMOTE' if remote else 'LOCAL'} DB...")
            apply_sql(statements, remote=remote)
            print("\n  Done!")
        else:
            print(f"\n  DRY RUN — no changes made.")
            print(f"  Run with --apply to update local DB")
            print(f"  Run with --apply --remote to update live DB")

    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)

if __name__ == '__main__':
    main()
