#!/usr/bin/env python3
"""
blog-sprint.py — Apply all blog update features in one pass.

Features applied:
  1. AuthorInfo component (import + <AuthorInfo /> before </article>)
  2. dateModified in Article schema (stagger across Jun 5 - Jul 8)
  3. Author → Person schema (Organization → Person "Raj Naik")
  4. BlogCrossLinks (add if missing)
  5. 6 icon links (Solver, Quiz, Anagram, Rack, WOTD, 60s)

Usage:
    python3 tools/blog-sprint.py --dry-run       # Preview changes
    python3 tools/blog-sprint.py --backup        # Create backup first, then apply
    python3 tools/blog-sprint.py                 # Apply without backup
    python3 tools/blog-sprint.py --limit 50      # Test on first 50 files

The backup creates a tar.gz of src/pages/blog/ before modifying.
"""

import argparse
import os
import re
import sys
import tarfile
import glob
from datetime import datetime, timedelta

PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BLOG_DIR = os.path.join(PROJECT_DIR, 'src', 'pages', 'blog')
BACKUP_DIR = os.path.join(PROJECT_DIR, 'backups')

# Date staggering: spread updates across Jun 5 - Jul 8 (33 days)
START_DATE = datetime(2026, 6, 5)
END_DATE = datetime(2026, 7, 8)

# The 6 icon links HTML
ICON_LINKS = (
    '<a href="/" class="inline-flex items-center gap-1 text-blue-400 hover:underline">'
    '<span aria-hidden="true">\U0001f50d</span> Solver</a>\n'
    '        <a href="/activities/#quiz" class="inline-flex items-center gap-1 text-blue-400 hover:underline">'
    '<span aria-hidden="true">\U0001f3af</span> Quiz</a>\n'
    '        <a href="/activities/#anagram" class="inline-flex items-center gap-1 text-blue-400 hover:underline">'
    '<span aria-hidden="true">\U0001f500</span> Anagram</a>\n'
    '        <a href="/activities/#rack" class="inline-flex items-center gap-1 text-blue-400 hover:underline">'
    '<span aria-hidden="true">\U0001f3b2</span> Rack</a>\n'
    '        <a href="/activities/#wotd" class="inline-flex items-center gap-1 text-blue-400 hover:underline">'
    '<span aria-hidden="true">\U0001f4d6</span> WOTD</a>\n'
    '        <a href="/sixty-seconds/" class="inline-flex items-center gap-1 text-blue-400 hover:underline">'
    '<span aria-hidden="true">\u23f1\ufe0f</span> 60s</a>'
)

# Old single Word Finder link pattern (to replace with 6 icons)
OLD_WORD_FINDER_PATTERN = re.compile(
    r'<a href="/" class="inline-flex items-center gap-1 text-blue-400 hover:underline">\s*'
    r'<span aria-hidden="true">\U0001f524</span>\s*Word Finder</a>',
    re.DOTALL
)


def create_backup():
    """Create a tar.gz backup of the blog directory."""
    os.makedirs(BACKUP_DIR, exist_ok=True)
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_path = os.path.join(BACKUP_DIR, f'blog-backup-{timestamp}.tar.gz')
    print(f"  Creating backup: {backup_path}")
    with tarfile.open(backup_path, 'w:gz') as tar:
        tar.add(BLOG_DIR, arcname='blog')
    size_mb = os.path.getsize(backup_path) / (1024 * 1024)
    print(f"  Backup complete: {size_mb:.1f} MB")
    return backup_path


def get_staggered_date(index, total):
    """Generate a staggered date based on file index."""
    days_range = (END_DATE - START_DATE).days
    # Use modulo + variation to spread dates naturally
    day_offset = int((index / total) * days_range)
    # Add some jitter (based on index) to avoid perfectly even distribution
    jitter = (index * 7) % 3 - 1  # -1, 0, or 1 day jitter
    target = START_DATE + timedelta(days=day_offset + jitter)
    target = max(START_DATE, min(END_DATE, target))
    return target.strftime('%Y-%m-%d')


def get_display_date(index, total):
    """Generate a human-readable date for AuthorInfo."""
    date = get_staggered_date(index, total)
    dt = datetime.strptime(date, '%Y-%m-%d')
    return dt.strftime('%B %-d, %Y')  # "June 5, 2026"


def apply_feature_1_author_info(content, display_date):
    """Add AuthorInfo import and component if missing."""
    if 'AuthorInfo' in content:
        return content, False

    # Add import
    if "import BlogCrossLinks" in content:
        content = content.replace(
            "import BlogCrossLinks from '../../components/BlogCrossLinks.astro';",
            "import BlogCrossLinks from '../../components/BlogCrossLinks.astro';\nimport AuthorInfo from '../../components/AuthorInfo.astro';"
        )
    elif "import '../../styles/global.css';" in content:
        content = content.replace(
            "import '../../styles/global.css';",
            "import '../../styles/global.css';\nimport AuthorInfo from '../../components/AuthorInfo.astro';"
        )
    else:
        return content, False

    # Insert component before last </article> or </BlogLayout>
    # Try </article> first
    last_article = content.rfind('</article>')
    if last_article != -1:
        insert = f'\n      <AuthorInfo updated="{display_date}" />\n\n    '
        content = content[:last_article] + insert + content[last_article:]
    else:
        last_layout = content.rfind('</BlogLayout>')
        if last_layout != -1:
            insert = f'\n  <AuthorInfo updated="{display_date}" />\n'
            content = content[:last_layout] + insert + content[last_layout:]
        else:
            return content, False

    return content, True


def apply_feature_2_date_modified(content, iso_date):
    """Add or update dateModified in Article schema."""
    if '"dateModified"' in content:
        # Update existing dateModified
        content = re.sub(
            r'"dateModified"\s*:\s*"[^"]*"',
            f'"dateModified": "{iso_date}"',
            content
        )
        return content, True

    # Add dateModified after datePublished
    match = re.search(r'"datePublished"\s*:\s*"([^"]*)"', content)
    if match:
        old = match.group(0)
        new = f'{old},\n    "dateModified": "{iso_date}"'
        content = content.replace(old, new, 1)
        return content, True

    return content, False


def apply_feature_3_author_person(content):
    """Change author from Organization to Person."""
    old_author = '"author": { "@type": "Organization", "name": "ScrabbleWordsFinder.com", "url": "https://www.scrabblewordsfinder.com" }'
    new_author = '"author": { "@type": "Person", "name": "Raj Naik", "url": "https://www.scrabblewordsfinder.com/about/" }'

    if old_author in content:
        content = content.replace(old_author, new_author)
        return content, True

    # Try variant without url
    old2 = '"author": { "@type": "Organization", "name": "ScrabbleWordsFinder.com" }'
    if old2 in content:
        content = content.replace(old2, new_author)
        return content, True

    return content, False


def apply_feature_4_cross_links(content, slug):
    """Add BlogCrossLinks import and component if missing."""
    if 'BlogCrossLinks' in content:
        return content, False

    # Add import
    content = content.replace(
        "import '../../styles/global.css';",
        "import '../../styles/global.css';\nimport BlogCrossLinks from '../../components/BlogCrossLinks.astro';"
    )

    # Add component after </nav>
    nav_close = '</nav>'
    idx = content.find(nav_close)
    if idx != -1:
        insert_pos = idx + len(nav_close)
        # Use slug as title (convert kebab-case to Title Case)
        title = slug.replace('-', ' ').title()
        component = f'\n      <BlogCrossLinks title="{title}" />'
        content = content[:insert_pos] + component + content[insert_pos:]
        return content, True

    return content, False


def apply_feature_5_icon_links(content):
    """Replace single Word Finder link with 6 icon links, or skip if already has them."""
    # Already has the 6 icons?
    if '\U0001f50d</span> Solver' in content:
        return content, False

    # Replace old single Word Finder link
    new_content = OLD_WORD_FINDER_PATTERN.sub(ICON_LINKS, content, count=1)
    if new_content != content:
        return new_content, True

    return content, False


def main():
    parser = argparse.ArgumentParser(description='Blog Sprint — apply all features to all blogs')
    parser.add_argument('--dry-run', action='store_true', help='Preview without modifying files')
    parser.add_argument('--backup', action='store_true', help='Create tar.gz backup before applying')
    parser.add_argument('--limit', type=int, default=0, help='Limit number of files to process')
    args = parser.parse_args()

    print(f"\n{'='*60}")
    print(f"  BLOG SPRINT — Bulk Feature Update")
    print(f"  Directory: {BLOG_DIR}")
    print(f"  Mode: {'DRY RUN' if args.dry_run else 'LIVE'}")
    print(f"{'='*60}\n")

    # Get all blog files (excluding index, category pages, dynamic routes)
    blog_files = sorted(glob.glob(os.path.join(BLOG_DIR, '*.astro')))
    blog_files = [f for f in blog_files if not os.path.basename(f).startswith('index')]

    print(f"  Blog files found: {len(blog_files)}")

    if args.limit:
        blog_files = blog_files[:args.limit]
        print(f"  Limited to: {args.limit}")

    if args.backup and not args.dry_run:
        create_backup()

    # Counters
    stats = {
        'author_info': 0,
        'date_modified': 0,
        'author_person': 0,
        'cross_links': 0,
        'icon_links': 0,
        'files_modified': 0,
    }

    total = len(blog_files)

    for i, filepath in enumerate(blog_files):
        slug = os.path.basename(filepath).replace('.astro', '')

        with open(filepath, 'r', encoding='utf-8') as f:
            original = f.read()

        content = original
        modified = False

        # Feature 1: AuthorInfo
        display_date = get_display_date(i, total)
        content, changed = apply_feature_1_author_info(content, display_date)
        if changed:
            stats['author_info'] += 1
            modified = True

        # Feature 2: dateModified
        iso_date = get_staggered_date(i, total)
        content, changed = apply_feature_2_date_modified(content, iso_date)
        if changed:
            stats['date_modified'] += 1
            modified = True

        # Feature 3: Author → Person
        content, changed = apply_feature_3_author_person(content)
        if changed:
            stats['author_person'] += 1
            modified = True

        # Feature 4: BlogCrossLinks
        content, changed = apply_feature_4_cross_links(content, slug)
        if changed:
            stats['cross_links'] += 1
            modified = True

        # Feature 5: Icon links
        content, changed = apply_feature_5_icon_links(content)
        if changed:
            stats['icon_links'] += 1
            modified = True

        if modified:
            stats['files_modified'] += 1
            if not args.dry_run:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)

        if (i + 1) % 100 == 0:
            print(f"  Processed {i+1}/{total} files...")

    # Summary
    print(f"\n{'='*60}")
    print(f"  COMPLETE {'(DRY RUN)' if args.dry_run else ''}")
    print(f"  Files processed: {total}")
    print(f"  Files modified: {stats['files_modified']}")
    print(f"  ─────────────────────────────────")
    print(f"  AuthorInfo added: {stats['author_info']}")
    print(f"  dateModified set: {stats['date_modified']}")
    print(f"  Author → Person: {stats['author_person']}")
    print(f"  BlogCrossLinks added: {stats['cross_links']}")
    print(f"  Icon links added: {stats['icon_links']}")
    print(f"{'='*60}")

    if args.dry_run:
        print(f"\n  This was a dry run. No files were modified.")
        print(f"  Run without --dry-run to apply changes.")


if __name__ == '__main__':
    main()
