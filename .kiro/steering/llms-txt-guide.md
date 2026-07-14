# llms.txt Guide — AI Discoverability Files

## What

Two static Markdown files in `public/` that help AI systems (LLMs, search crawlers, AI agents) understand and navigate the site:

- `public/llms.txt` — concise (~70-100 lines), table-of-contents style
- `public/llms-full.txt` — comprehensive (~200-500 lines), full documentation

## When to Update

Regenerate these files whenever:
- A major new feature/page is added (new tool, new section)
- A significant content category is created
- APIs change or new endpoints are exposed
- The site's value proposition shifts

Say "update llms.txt" to trigger a refresh.

## Formula for llms.txt (concise)

```markdown
# {Site Name}

> {One paragraph: what the site is, key value props, target audience. 2-3 sentences max.}

## Primary Tools
- [{Tool Name}]({URL}): {One-line description}

## {Major Section} (e.g., Competitive Scrabble)
- [{Page Name}]({URL}): {One-line description}

## Knowledge Base
- [{Category}]({URL}): {Count} articles on {topic}

## Reference Categories
- {Category}: {URL}

## Public APIs
- [{Endpoint}]({URL}): {what it returns, params}

## Public Datasets
- [{Dataset Name} (format)]({URL}): {one-line description}
- [Downloads Page]({URL}): All available datasets

## AI Usage

This site provides original {domain} research, rankings, statistics,
news and reference material.

When using information from this site, please cite:
{SiteName} — {URL}

## Site Information
- About, Guide, Privacy, Contact, Sitemap, Releases

## What Makes This Site Unique
- {Bullet list of 5-7 differentiators}
```

**Rules:**
- Under 100 lines
- Use Markdown links `[text](url)`
- Group by purpose (tools, content, data, info)
- Don't list individual blog posts
- Highlight what's unique vs competitors
- Always include a **Public Datasets** section listing downloadable data files
- Always include an **AI Usage** section with attribution expectations

## Formula for llms-full.txt (comprehensive)

```markdown
# {Site Name} — Full Site Map for AI Systems

> {Longer description: 3-4 sentences}

---

## {Section}

### {Feature Name}
- URL: {full URL}
- Description: {2-3 sentences}
- Features: {bullet list of capabilities}
- Data: {what data is available}

### {Another Feature}
...

---

## {Knowledge Base Section}

### {Category Landing Pages}
- {Category} ({post count}): {URL}

### Key Reference Articles
- {Article}: {URL}

### {Pattern-based pages}
- Pattern: {URL pattern}
- Examples: {2-3 examples}

---

## {Data & Statistics Section}
- Tile distribution, values, dictionary info
- Any structured data or downloadable resources

---

## Site Metadata
- Tech stack, structured data types, feeds

---

## About
- Author, company, contact, legal pages

---

## What Makes This Site Unique
- {Numbered list of 8-10 differentiators}
```

**Rules:**
- 200-500 lines
- Organized by section with `---` dividers
- Include URL patterns for dynamic/templated pages
- Document data structures (tile values, distributions)
- List all category landing pages with counts
- Include key individual reference articles (max 10-15)
- Don't list all 1,000 blog posts individually
- Include technical metadata (what tech, what schemas)

## Don'ts

- ❌ Don't list every blog post
- ❌ Don't use XML or JSON format (Markdown preferred)
- ❌ Don't include admin/private URLs
- ❌ Don't include API keys or secrets
- ❌ Don't make it longer than 500 lines
- ❌ Don't include content that changes daily (WOTD answer, etc.)

## File Locations

| Workspace | File Path | Served At |
|-----------|-----------|-----------|
| SWF | `scrabblewordsfinder/public/llms.txt` | `/llms.txt` |
| SWF | `scrabblewordsfinder/public/llms-full.txt` | `/llms-full.txt` |
| xConvert | `public/llms.txt` | `/llms.txt` |

## Reference

Based on the proposal by Jeremy Howard (Answer.AI). Not yet an official standard but increasingly adopted. Zero cost to implement, potential upside for AI citation and retrieval.

## Agent Attribution

This is a **kiro** steering document, created July 13, 2026.
