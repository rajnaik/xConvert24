# CrossCoupling — Add "Suggest a Feature" Link to All Converters/Tools

When asked to run "CrossCoupling", add a "💡 Suggest a new feature for this tool →" link to every converter/tool page. The link should point to `/suggest?title=TOOL_NAME` where TOOL_NAME is the display title of the converter, URL-encoded.

## How It Works

Each tool/converter page gets a link at the bottom (after the last content section, before `</Layout>` closing the page). The link takes the user to the `/suggest` page with the tool's name pre-filled in the "What would you like us to add?" field.

The `/suggest` page already reads `?title=` from the URL and prefills the input field (implemented in suggest.astro script).

## Link Template

```html
<!-- Suggest a feature -->
<div class="mt-6 text-center">
  <a href="/suggest?title=ENCODED_TOOL_NAME" class="inline-flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 hover:underline font-medium">
    <span aria-hidden="true">💡</span> Suggest a new feature for this tool →
  </a>
</div>
```

## Tools List & Status

| # | File | Tool Name (for link) | Status |
|---|------|---------------------|--------|
| 1 | tools/scrabble.astro | Free Scrabble Word Finder | ✅ Done |
| 2 | tools/age.astro | Age Calculator | ✅ Done |
| 3 | tools/alarm.astro | Alarm Clock | ✅ Done |
| 4 | tools/aspect-ratio.astro | Aspect Ratio Calculator | ✅ Done |
| 5 | tools/audio-converter.astro | Audio Converter | ✅ Done |
| 6 | tools/audio-formats.astro | Audio Formats Guide | ✅ Done |
| 7 | tools/bmi.astro | BMI Calculator | ✅ Done |
| 8 | tools/calculator.astro | Scientific Calculator | ✅ Done |
| 9 | tools/clock.astro | World Clock | ✅ Done |
| 10 | tools/color.astro | Color Picker | ✅ Done |
| 11 | tools/contagion.astro | Contagion Tracker | ✅ Done |
| 12 | tools/crypto-bubbles.astro | Crypto Bubbles | ✅ Done |
| 13 | tools/crypto-coins.astro | Top 100 Crypto | ✅ Done |
| 14 | tools/date-diff.astro | Date Difference Calculator | ✅ Done |
| 15 | tools/discount.astro | Discount Calculator | ✅ Done |
| 16 | tools/distance-map.astro | Map Tools | ✅ Done |
| 17 | tools/epoch.astro | Epoch Converter | ✅ Done |
| 18 | tools/guitar-tuner.astro | Guitar Tuner | ✅ Done |
| 19 | tools/image-converter.astro | Image Converter | ✅ Done |
| 20 | tools/image-editor.astro | Image Editor | ✅ Done |
| 21 | tools/loan.astro | Loan Calculator | ✅ Done |
| 22 | tools/morse.astro | Morse Code Translator | ✅ Done |
| 23 | tools/my-ip.astro | Show My IP Address | ✅ Done |
| 24 | tools/password.astro | Password Generator | ✅ Done |
| 25 | tools/reminder.astro | Reminder | ✅ Done |
| 26 | tools/ruler.astro | Online Ruler | ✅ Done |
| 27 | tools/stopwatch.astro | Stopwatch | ✅ Done |
| 28 | tools/tip.astro | Tip Calculator | ✅ Done |
| 29 | tools/video-converter.astro | Video Converter | ✅ Done |
| 30 | tools/video-formats.astro | Video Formats Guide | ✅ Done |

## Converters List & Status

| # | File | Converter Name (for link) | Status |
|---|------|--------------------------|--------|
| 1 | convert/angle.astro | Angle Converter | ✅ Done |
| 2 | convert/area.astro | Area Converter | ✅ Done |
| 3 | convert/base.astro | Number Base Converter | ✅ Done |
| 4 | convert/body-weight-percentage.astro | Body Weight Percentage Calculator | ✅ Done |
| 5 | convert/clothing-size.astro | Clothing Size Converter | ✅ Done |
| 6 | convert/cooking.astro | Cooking Converter | ✅ Done |
| 7 | convert/currency.astro | Currency Converter | ✅ Done |
| 8 | convert/cycling-speed.astro | Cycling Speed Calculator | ✅ Done |
| 9 | convert/data.astro | Data Storage Converter | ✅ Done |
| 10 | convert/energy.astro | Energy Converter | ✅ Done |
| 11 | convert/frequency.astro | Frequency Converter | ✅ Done |
| 12 | convert/fuel.astro | Fuel Economy Converter | ✅ Done |
| 13 | convert/length.astro | Length Converter | ✅ Done |
| 14 | convert/oven-temperature.astro | Oven Temperature Converter | ✅ Done |
| 15 | convert/power.astro | Power Converter | ✅ Done |
| 16 | convert/precious-metals.astro | Precious Metals Converter | ✅ Done |
| 17 | convert/pressure.astro | Pressure Converter | ✅ Done |
| 18 | convert/roman.astro | Roman Numeral Converter | ✅ Done |
| 19 | convert/running-pace.astro | Running Pace Calculator | ✅ Done |
| 20 | convert/shoe-size.astro | Shoe Size Converter | ✅ Done |
| 21 | convert/speed.astro | Speed Converter | ✅ Done |
| 22 | convert/temperature.astro | Temperature Converter | ✅ Done |
| 23 | convert/time.astro | Time Converter | ✅ Done |
| 24 | convert/volume.astro | Volume Converter | ✅ Done |
| 25 | convert/weight.astro | Weight Converter | ✅ Done |

## Rules

1. Insert the link BEFORE `</Layout>` at the bottom of each page.
2. Use the short/friendly tool/converter name (not the full SEO title with em-dashes).
3. URL-encode the title using `+` for spaces.
4. Do NOT duplicate the link if it already exists on a page.
5. The `/suggest` page handles the prefill — no changes needed to suggest.astro per tool.

## Agent Attribution

This is a **kiro** command for AuditLog purposes.
