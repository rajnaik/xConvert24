---
inclusion: manual
---

# Hack Process — Pipeline Convertor Processing

**IMPORTANT: When the user says HackN metadesc, delegate the entire process to a sub-agent (`general-task-execution`) so the main conversation remains free for planning.**

When the user says **HackN** (e.g., Hack5, Hack3, Hack9), run the following process on the first N records from `ConvertorsInPipeline` where `status = 1` (unprocessed):

## Steps (per record)

1. **Fetch** the first N unprocessed rows: `SELECT * FROM ConvertorsInPipeline WHERE status = 1 ORDER BY id LIMIT N`
2. **Compare** each pipeline convertor name against:
   - The `Convertors` table (existing developed convertors)
   - The actual page files in `src/pages/convert/*.astro`
3. **If DUPE** (the convertor is already covered by an existing page):
   - `UPDATE ConvertorsInPipeline SET comment = 'Dupe', status = 10 WHERE id = ?`
4. **If NEW** (no match found):
   - Identify which category it belongs to
   - Create a new `.astro` page at `src/pages/convert/<slug>.astro` following the existing converter page pattern
   - Add an orange "NEW" badge/icon to the page (inline SVG or span with orange styling)
   - After successful page creation, update: `UPDATE ConvertorsInPipeline SET status = 1, comment = 'Page created' WHERE id = ?`
   - Also add the new convertor to the `Convertors` table if appropriate
5. **Move to next record** and repeat until all N are processed.

## Matching Rules

A pipeline item is a **dupe** if:
- Its conversion type is already handled by an existing page (e.g., "Miles to Kilometres" is covered by the Length converter)
- The category maps directly to an existing convertor name (Weight, Length, Temperature, Area, Volume, Speed, etc.)

A pipeline item is **new** if:
- No existing converter page handles that specific conversion type
- It represents a genuinely new tool/calculator (e.g., BMI Calculator, Token Calculator, Mortgage Calculator)

## Existing Convertors (for reference)

Weight, Length, Temperature, Area, Volume, Speed, Data Storage, Energy, Pressure, Power, Fuel Economy, Angle, Frequency, Time, Cooking, Number Base, Roman Numerals, Currency, Shoe Size, Clothing Size

## Database Commands

```bash
# Query unprocessed pipeline items
npx wrangler d1 execute xconvert24-bugs --remote --command "SELECT * FROM ConvertorsInPipeline WHERE status = 1 ORDER BY id LIMIT N;" --json

# Mark as dupe
npx wrangler d1 execute xconvert24-bugs --remote --command "UPDATE ConvertorsInPipeline SET comment = 'Dupe', status = 10 WHERE id = X;"

# Mark as created
npx wrangler d1 execute xconvert24-bugs --remote --command "UPDATE ConvertorsInPipeline SET comment = 'Page created', status = 1 WHERE id = X;"
```

## Orange NEW Icon

Use this inline in the page header next to the title:
```html
<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 ml-2">NEW</span>
```
