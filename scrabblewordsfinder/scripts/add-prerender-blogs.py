#!/usr/bin/env python3
"""Add export const prerender = true; to all blog .astro files."""
import os
import glob

blog_dir = os.path.join(os.path.dirname(__file__), '..', 'src', 'pages', 'blog')
files = glob.glob(os.path.join(blog_dir, '*.astro'))
count = 0

for f in files:
    with open(f, 'r') as fh:
        content = fh.read()
    if 'prerender' not in content:
        # Replace first '---\n' with '---\nexport const prerender = true;\n'
        content = content.replace('---\n', '---\nexport const prerender = true;\n', 1)
        with open(f, 'w') as fh:
            fh.write(content)
        count += 1

print(f'Patched {count} blog files with prerender = true')
