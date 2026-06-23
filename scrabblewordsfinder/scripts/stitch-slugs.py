#!/usr/bin/env python3
"""
stitch-slugs.py — Generate slug links for each blog in the StitchBlogs table.

Reads the StitchBlogs table (local D1), extracts the title/description from each
blog's .astro file, and prints the slug → URL mapping.

Output: JSON array of {slug, url, title, description} for use by the injection script.
"""

import os
import re
import json
import sys

BLOG_DIR = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "..", "src", "pages", "blog"
)

OUTPUT_FILE = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "..", "tmp-stitch-slugs.json"
)


def extract_meta(slug: str) -> dict:
    """Extract title and description from the .astro blog file."""
    filepath = os.path.join(BLOG_DIR, f"{slug}.astro")
    if not os.path.exists(filepath):
        return {"slug": slug, "url": f"/blog/{slug}/", "title": "", "description": "", "error": "file not found"}

    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # Extract title from BlogLayout title prop
    title_match = re.search(r'title="([^"]+)"', content)
    title = title_match.group(1) if title_match else slug.replace("-", " ").title()

    # Extract description from BlogLayout description prop
    desc_match = re.search(r'description="([^"]+)"', content)
    description = desc_match.group(1) if desc_match else ""

    return {
        "slug": slug,
        "url": f"/blog/{slug}/",
        "title": title,
        "description": description,
    }


def main():
    # Read slugs from StitchBlogs via the local wrangler DB export
    # We pass them in as args or read from a known file
    slugs_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "tmp-stitch-names.txt")

    if os.path.exists(slugs_file):
        with open(slugs_file, "r") as f:
            slugs = [line.strip() for line in f if line.strip()]
    elif len(sys.argv) > 1:
        slugs = sys.argv[1:]
    else:
        print("ERROR: No slugs provided. Create tmp-stitch-names.txt or pass slugs as arguments.", file=sys.stderr)
        return 1

    print(f"Processing {len(slugs)} slugs...")
    results = []

    for slug in slugs:
        meta = extract_meta(slug)
        results.append(meta)
        status = "✓" if not meta.get("error") else f"✗ ({meta['error']})"
        print(f"  {status} {slug} → {meta['title'][:60]}")

    # Write output JSON for the injection script
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)

    print(f"\nGenerated {len(results)} slug links → {OUTPUT_FILE}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
