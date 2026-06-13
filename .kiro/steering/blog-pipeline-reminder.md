---
inclusion: manual
---

# Blog Pipeline — Incomplete Work

## Cross-Linking Rule (MANDATORY)

After creating ANY new blog post (CHOP, Blog Burst, or manual), you MUST:

1. Open `scrabblewordsfinder/src/components/BlogRelatedLinks.astro`
2. Add the new post's slug to the `crossLinks` map with 3 related slugs
3. Add the new post's slug + title to the `titles` map
4. Add the new post's slug to 2-3 OTHER posts' crossLinks arrays (so they link back)

This is the ONLY place cross-linking lives. Never hardcode "Related Articles" in blog posts — use `<BlogRelatedLinks slug="..." />` instead.

**Date noted:** June 7, 2026  
**Reminder:** Complete remaining blog content by June 9-10, 2026

## Status

- **120 total blogs** in the `BlogsInPipeline` table (live DB: xconvert24-bugs)
- **96 blogs have full content** (ready to publish)
- **24 blogs still need content** (BlogIDs 91-119 approximately — Health & Lifestyle section)

## Remaining Topics (need content written)

BlogIDs 91-119 in the Health & Lifestyle category:
- Sleep Optimization Guide, Recovery After Exercise, Building Healthy Habits
- Nutrition Basics, Protein Requirements Explained, Understanding Metabolism
- Weight Training Basics, Cardio vs Strength Training, Step Count Goals
- Longevity Habits, Healthy Lifestyle Checklist, Stress Management Techniques
- Desk Exercise Guide, Fitness Goal Planning, Home Workout Guide
- Running Distance Calculator Guide, Cycling Fitness Guide, Hydration Calculator Guide
- Health Tracking Metrics, Body Composition Explained, Fitness Apps Compared
- Daily Wellness Habits, Mental Performance Tips, Building Consistency
- Energy Management, Exercise for Beginners, Sustainable Fitness
- Lifestyle Change Strategies, Health Measurement Tools

## How to resume

Run this to check progress:
```bash
npx wrangler d1 execute xconvert24-bugs --remote --command "SELECT BlogID, BlogName FROM BlogsInPipeline WHERE BlogBody IS NULL OR BlogBody = ''"
```

Then ask Kiro to "continue writing blog content for the remaining BlogsInPipeline entries" — it will delegate to sub-agents.

## Content format

Each blog covers: History, Importance, Known People Involved, Challenges, Future Prospects.
Written in HTML (h2, h3, p tags), 800-1200 words each.
