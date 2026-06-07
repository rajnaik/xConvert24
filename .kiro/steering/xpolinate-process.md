---
inclusion: manual
---

# xPolinate Process (formerly "crosslinks")

When the user says **xPolinate**, run the following process to cross-pollinate new blogs and converters with bidirectional links.

## What CrossLinks Does

CrossLinks is **bidirectional** — it creates links in BOTH directions:
1. **Blog → Converter**: Converter icon badges appear on blog pages (e.g., 💱 Currency badge on a crypto blog)
2. **Converter → Blog**: Related blog links appear on converter pages (e.g., "📝 Bitcoin vs Gold" link on the Currency converter)

## Three Places to Update

### 1. BlogCrossLinks (Blog → Converter icons)

File: `src/components/BlogCrossLinks.astro`

Add entries to the `crossLinks` object:
```typescript
const crossLinks: Record<string, string[]> = {
  'new-blog-slug': ['Currency', 'Weight'],  // converter category names
};
```

### 2. ConverterBlogLinks (Converter → Blog links)

File: `src/components/ConverterBlogLinks.astro`

Add entries to the `converterBlogs` object:
```typescript
const converterBlogs: Record<string, { title: string; href: string }[]> = {
  '/convert/currency': [
    // ... existing entries ...
    { title: 'New Blog Title', href: '/blog/new-blog-slug' },
  ],
};
```

### 3. CrossLinks Database Table

Insert into the DB to keep the source of truth in sync:
```sql
INSERT OR IGNORE INTO CrossLinks (blogid, ConvID) VALUES ('blog-slug', ConvID);
```

ConvID reference (from Convertors table):
| ConvID | Name |
|--------|------|
| 1 | Weight |
| 2 | Length |
| 3 | Temperature |
| 4 | Area |
| 5 | Volume |
| 6 | Speed |
| 7 | Data Storage |
| 8 | Energy |
| 9 | Pressure |
| 10 | Power |
| 11 | Fuel Economy |
| 12 | Angle |
| 13 | Frequency |
| 14 | Time |
| 15 | Cooking |
| 16 | Number Base |
| 17 | Roman Numerals |
| 18 | Currency |
| 19 | Shoe Size |
| 20 | Clothing Size |
| 21 | Precious Metals |
| 22 | Body Weight Percentage |
| 23 | Oven Temperature |

## Steps

1. **Identify new blogs** that don't yet have crosslink entries (check the static map in `BlogCrossLinks.astro`)
2. **Determine relevant converters** for each blog based on its topic
3. **Update the static map** in `src/components/BlogCrossLinks.astro` — add the slug with an array of converter category names
4. **Insert into CrossLinks DB** on live: `npx wrangler d1 execute xconvert24-bugs --remote --command "INSERT OR IGNORE INTO CrossLinks (blogid, ConvID) VALUES ('slug', ID);" --json`

## Matching Guidelines

- A blog about Bitcoin/crypto → Currency (18)
- A blog comparing crypto to gold → Currency (18) + Weight (1)
- A blog about cooking measurements → Cooking (15) + Volume (5)
- A blog about running/speed → Speed (6)
- A blog about temperature in any context → Temperature (3)
- A blog about data/storage → Data Storage (7)
- A blog about time/dates → Time (14)
- A blog can link to multiple converters (max 3 recommended for visual clarity)

## When to Run

- After every **CHOP** (blog pipeline processing)
- After manually creating new blog posts
- Periodically to audit and fill gaps in existing blogs
