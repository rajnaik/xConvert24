---
inclusion: manual
---

# PRETTIFY — Blog Content Beautification Process

When the user says **"PRETTIFY"**, iterate through all blog posts one by one and enhance the content section layout for visual appeal and readability.

---

## Design Principles

- **Orange and black/red theme** for iconography and accent elements
- Small chunks of information displayed in **tiles** (rounded cards with subtle borders)
- Data that fits naturally in rows → use a **styled table** (amber header, alternating rows)
- Lists → **bullet lists with a tiny green arrow** (▶ or custom SVG) as the bullet character
- Section headings → elegant CSS with a subtle left border accent (amber/orange) and slightly larger font
- Keep the dark mode variants consistent (dark:bg-gray-800 tiles, dark:border-gray-700)

---

## Content Formatting Rules

### Tiles (Info Cards)
Use for standalone facts, formulas, or key callouts:
```html
<div class="not-prose grid gap-3 sm:grid-cols-2 my-6">
  <div class="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
    <p class="text-sm font-semibold text-amber-600 dark:text-amber-400 mb-1">Label</p>
    <p class="text-gray-700 dark:text-gray-300 text-sm">Content here</p>
  </div>
</div>
```

### Pretty Tables
Use for comparison data, timelines, denominations:
```html
<div class="not-prose overflow-x-auto my-6">
  <table class="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
    <thead class="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300">
      <tr><th class="px-4 py-2 text-left">Column</th></tr>
    </thead>
    <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
      <tr class="bg-white dark:bg-gray-900"><td class="px-4 py-2">Data</td></tr>
      <tr class="bg-gray-50 dark:bg-gray-800/50"><td class="px-4 py-2">Data</td></tr>
    </tbody>
  </table>
</div>
```

### Green Arrow Bullet Lists
Replace standard `<ul>` lists with styled versions:
```html
<ul class="not-prose space-y-2 my-6">
  <li class="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
    <span class="text-green-500 mt-0.5 shrink-0">▶</span>
    <span>List item content here</span>
  </li>
</ul>
```

### Elegant Section Headings
Replace bare `<h2>` with a thin, light-orange heading:
```html
<h2 class="text-xl font-light text-amber-600 dark:text-amber-400 mt-10 mb-1">Section Title</h2>
```

### Orange/Black/Red Iconography
- Use `text-amber-600` / `text-orange-500` for icons and accents
- Use `text-red-500` sparingly for warnings or critical info
- Dark backgrounds for icon containers: `bg-gray-900` with amber icon text

---

## Process

1. Open the first blog post (`src/pages/blog/*.astro`) in order
2. Read the content section (between the date line and the "Try It Now" amber box)
3. Identify which content chunks should become:
   - Tiles (key facts, formulas, standalone metrics)
   - Tables (comparisons, timelines, multi-column data)
   - Green arrow lists (any `<ul>` or `<li>` content)
   - Accented headings (all `<h2>` tags)
4. Apply the transformations preserving the original text meaning
5. Ensure dark mode classes are included on every element
6. Move to the next blog post and repeat
7. After all blogs are done, run a build to verify

---

## Important Notes

- Do NOT change the factual content — only the presentation
- Keep the prose class on the article wrapper for base typography
- Use `not-prose` on custom-styled sections to escape Tailwind Typography defaults
- Preserve all internal links (cross-links between blog posts)
- The "Try It Now" amber box at the bottom should remain unchanged
- The NEW badge, breadcrumb, and BlogCrossLinks component stay untouched
- Work through blogs alphabetically or in index order — confirm with user if they want a specific order
