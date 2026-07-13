#!/usr/bin/env python3
"""
Process Bounced Emails — extract failed recipients from bounce notification .eml/.zip files
and mark them as bounced in the campaign_leads D1 database.

What it does:
  1. Scans all bounced*.zip files in ~/Desktop/kiro/emails/
  2. Extracts X-Failed-Recipients headers from .eml files inside
  3. Deduplicates the bounced email addresses
  4. Generates UPDATE statements: SET bounced = 1, email_variant_sent = 'office'
  5. Optionally applies to local or remote DB

Usage:
  python3 tools/process-bounced-emails.py                  # Dry run (default)
  python3 tools/process-bounced-emails.py --apply-local    # Apply to local dev DB
  python3 tools/process-bounced-emails.py --apply-remote   # Apply to live DB

Source: ~/Desktop/kiro/emails/bounced*.zip
Target table: campaign_leads (column: bounced)
"""

import subprocess
import sys
import os
import zipfile
import re
import tempfile

# Config
EMAILS_DIR = os.path.expanduser('~/Desktop/kiro/emails')
SWF_DIR = os.path.expanduser('~/Code/xConvert.com/scrabblewordsfinder')
FAILED_RECIPIENT_RE = re.compile(r'X-Failed-Recipients:\s*(.+)', re.IGNORECASE)


def find_bounce_zips():
    """Find all bounced email zip files."""
    zips = []
    if not os.path.isdir(EMAILS_DIR):
        print(f"  Error: Directory not found: {EMAILS_DIR}")
        return zips
    for f in sorted(os.listdir(EMAILS_DIR)):
        if f.startswith('bounced') and f.endswith('.zip'):
            zips.append(os.path.join(EMAILS_DIR, f))
    return zips


def extract_bounced_emails(zip_files):
    """Extract X-Failed-Recipients from all .eml files in all zip archives."""
    bounced = set()

    for zip_path in zip_files:
        zip_name = os.path.basename(zip_path)
        zip_count = 0
        try:
            with zipfile.ZipFile(zip_path, 'r') as zf:
                for name in zf.namelist():
                    # Read all files (both .eml and noname files may contain bounce headers)
                    try:
                        content = zf.read(name).decode('utf-8', errors='ignore')
                        for match in FAILED_RECIPIENT_RE.finditer(content):
                            email = match.group(1).strip().lower()
                            if email and '@' in email:
                                bounced.add(email)
                                zip_count += 1
                    except Exception:
                        pass
            print(f"  📦 {zip_name}: {zip_count} bounced addresses found")
        except zipfile.BadZipFile:
            print(f"  ⚠️  {zip_name}: Bad zip file, skipped")

    return bounced


def generate_sql(bounced_emails):
    """Generate UPDATE SQL statements to mark emails as bounced.
    
    Also sets email_variant_sent = 'office' since all bounces came back
    for the office@ variant that was sent.
    """
    statements = []
    for email in sorted(bounced_emails):
        safe_email = email.replace("'", "''")
        statements.append(
            f"UPDATE campaign_leads SET bounced = 1, email_variant_sent = 'office' "
            f"WHERE LOWER(email) LIKE '%{safe_email}%';"
        )
    return statements


def apply_to_db(statements, remote=False):
    """Apply SQL statements to D1 database."""
    sql_file = '/tmp/campaign_bounced_updates.sql'
    with open(sql_file, 'w') as f:
        f.write('\n'.join(statements))

    cmd = ['npx', 'wrangler', 'd1', 'execute', 'DB']
    if remote:
        cmd.append('--remote')
    else:
        cmd.append('--local')
    cmd.extend(['--file', sql_file])

    print(f"\n  Running: {' '.join(cmd)}")
    print(f"  SQL file: {sql_file} ({len(statements)} statements)")

    result = subprocess.run(
        cmd, cwd=SWF_DIR, capture_output=True, text=True,
        input='Y\n'  # Auto-confirm large file prompt
    )

    if result.returncode == 0:
        print("  ✅ Applied successfully!")
        if result.stdout:
            for line in result.stdout.split('\n'):
                if 'rows_written' in line or 'rows_read' in line:
                    print(f"  {line.strip()}")
    else:
        print(f"  ❌ Error: {result.stderr[-500:]}")


def main():
    mode = '--dry-run'
    if len(sys.argv) > 1:
        mode = sys.argv[1]

    print("=" * 60)
    print("📮 Process Bounced Emails — Mark Failed Recipients")
    print("=" * 60)
    print(f"\n  Source dir: {EMAILS_DIR}")
    print(f"  Target:    campaign_leads.bounced = 1")
    print(f"  Mode:      {mode}")
    print()

    # Step 1: Find zip files
    print("Step 1: Finding bounced email archives...")
    zip_files = find_bounce_zips()
    if not zip_files:
        print("  ⚠️  No bounced*.zip files found. Nothing to process.")
        return
    print(f"  Found {len(zip_files)} zip files\n")

    # Step 2: Extract bounced emails
    print("Step 2: Extracting X-Failed-Recipients from .eml files...")
    bounced_emails = extract_bounced_emails(zip_files)

    if not bounced_emails:
        print("\n  ⚠️  No bounced emails found. Nothing to update.")
        return

    print(f"\n  Total unique bounced emails: {len(bounced_emails)}")

    # Step 3: Generate SQL
    print("\nStep 3: Generating SQL...")
    statements = generate_sql(bounced_emails)
    print(f"  Generated {len(statements)} UPDATE statements")

    # Step 4: Show sample
    print("\nSample (first 5):")
    for s in statements[:5]:
        print(f"  {s}")
    if len(statements) > 5:
        print(f"  ... and {len(statements) - 5} more")

    # Step 5: Apply based on mode
    if mode == '--dry-run':
        print("\n" + "=" * 60)
        print("🔍 DRY RUN — No changes applied.")
        print("=" * 60)
        print("\nTo apply:")
        print(f"  python3 tools/process-bounced-emails.py --apply-local   # Local dev DB")
        print(f"  python3 tools/process-bounced-emails.py --apply-remote  # Live DB")
    elif mode == '--apply-local':
        print("\n  Applying to LOCAL dev database...")
        apply_to_db(statements, remote=False)
    elif mode == '--apply-remote':
        print("\n  Applying to REMOTE (live) database...")
        apply_to_db(statements, remote=True)
    else:
        print(f"\n  ❌ Unknown mode: {mode}")
        print("  Use: --dry-run, --apply-local, or --apply-remote")


if __name__ == '__main__':
    main()
