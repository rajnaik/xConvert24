#!/usr/bin/env python3
"""Export StitchBlogs names from wrangler JSON output to tmp-stitch-names.txt"""
import json
import sys

data = json.load(sys.stdin)
names = [r['name'] for r in data[0]['results']]
with open('tmp-stitch-names.txt', 'w') as f:
    f.write('\n'.join(names))
print(f'Wrote {len(names)} names')
