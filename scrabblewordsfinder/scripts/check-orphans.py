#!/usr/bin/env python3
"""check-orphans.py — Find blog pages with zero inbound links from any other page."""

import os

BLOG_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "src", "pages", "blog")
SRC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "src")

def main():
    files = [f for f in os.listdir(BLOG_DIR) if f.endswith(".astro")]
    slugs = [f.replace(".astro", "") for f in files]

    # Build inbound link map
    inbound = {slug: set() for slug in slugs}

    # Check all blog files for cross-references
    for f in files:
        path = os.path.join(BLOG_DIR, f)
        with open(path, "r", encoding="utf-8") as fh:
            content = fh.read()
        source_slug = f.replace(".astro", "")
        for slug in slugs:
            if slug == source_slug:
                continue
            if f"/blog/{slug}" in content:
                inbound[slug].add(f)

    # Check non-blog src files (layouts, components, other pages)
    for root, dirs, fnames in os.walk(SRC_DIR):
        if "/blog" in root:
            continue
        for fname in fnames:
            if not (fname.endswith(".astro") or fname.endswith(".ts")):
                continue
            fpath = os.path.join(root, fname)
            try:
                with open(fpath, "r", encoding="utf-8") as fh:
                    content = fh.read()
            except:
                continue
            for slug in slugs:
                if f"/blog/{slug}" in content:
                    inbound[slug].add(fpath)

    orphans = [s for s in sorted(slugs) if len(inbound[s]) == 0]

    print(f"Total blog pages: {len(slugs)}")
    print(f"Orphaned (zero inbound links): {len(orphans)}")
    print()
    if orphans:
        for s in orphans:
            print(f"  /blog/{s}/")
    else:
        print("  None — all pages have at least one inbound link!")
    print()

    # Also show pages with only 1 inbound link (weak links)
    weak = [s for s in sorted(slugs) if len(inbound[s]) == 1]
    print(f"Weakly linked (only 1 inbound): {len(weak)}")
    if weak and len(weak) <= 50:
        for s in weak:
            source = list(inbound[s])[0]
            print(f"  /blog/{s}/  ← linked from: {source}")


if __name__ == "__main__":
    main()
