#!/usr/bin/env python3
"""Generate PWA icon PNGs from favicon SVG."""

import cairosvg

svg_path = '/Users/rajeevnaik/Code/xConvert.com/scrabblewordsfinder/public/favicon.svg'
out_dir = '/Users/rajeevnaik/Code/xConvert.com/scrabblewordsfinder/public/icons'

# Standard icon 192x192
cairosvg.svg2png(url=svg_path, write_to=f'{out_dir}/icon-192.png', output_width=192, output_height=192)
print('Created icon-192.png')

# Standard icon 512x512
cairosvg.svg2png(url=svg_path, write_to=f'{out_dir}/icon-512.png', output_width=512, output_height=512)
print('Created icon-512.png')

# Maskable icon needs padding (safe zone is inner 80%)
# Create a larger SVG with padding for the maskable version
maskable_svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#0a0a0f"/>
  <g transform="translate(102.4, 102.4) scale(9.6)">
    <rect x="1" y="1" width="30" height="30" rx="4" fill="#e8d5c0"/>
    <rect x="1" y="1" width="30" height="30" rx="4" stroke="#c4a882" stroke-width="1.5" fill="none"/>
    <rect x="2" y="2" width="28" height="28" rx="3" stroke="rgba(255,255,255,0.4)" stroke-width="0.5" fill="none"/>
    <text x="16" y="23" font-family="Arial Black, Arial, sans-serif" font-size="20" font-weight="900" fill="#1a1a1a" text-anchor="middle" letter-spacing="-0.5">S</text>
    <text x="26" y="28" font-family="Arial Black, Arial, sans-serif" font-size="7" font-weight="900" fill="#4a3f3f" text-anchor="middle">1</text>
  </g>
</svg>'''

cairosvg.svg2png(bytestring=maskable_svg.encode(), write_to=f'{out_dir}/icon-maskable-512.png', output_width=512, output_height=512)
print('Created icon-maskable-512.png')

print('Done! All PWA icons generated.')
