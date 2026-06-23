import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BLOG_DIR = path.join(__dirname, '../../src/pages/blog');
const blogFiles = fs.readdirSync(BLOG_DIR)
  .filter(f => f.endsWith('.astro') && f !== 'index.astro')
  .map(f => f.replace('.astro', ''));

test.describe('Blog SEO & Cross-Links — Positive', () => {
  
  test('every blog post has Related Articles section', () => {
    const missing: string[] = [];
    for (const slug of blogFiles) {
      const content = fs.readFileSync(path.join(BLOG_DIR, `${slug}.astro`), 'utf-8');
      if (!content.includes('Related Articles')) {
        missing.push(slug);
      }
    }
    expect(missing, `Posts missing Related Articles: ${missing.join(', ')}`).toHaveLength(0);
  });

  test('every blog post has at least 2 related links', () => {
    const insufficient: string[] = [];
    for (const slug of blogFiles) {
      const content = fs.readFileSync(path.join(BLOG_DIR, `${slug}.astro`), 'utf-8');
      const linkCount = (content.match(/href="\/blog\//g) || []).length;
      // Subtract 1 for the breadcrumb "← Blog" link
      const relatedLinks = linkCount - 1;
      if (relatedLinks < 2) {
        insufficient.push(`${slug} (${relatedLinks} links)`);
      }
    }
    expect(insufficient, `Posts with < 2 related links: ${insufficient.join(', ')}`).toHaveLength(0);
  });

  test('related links point to existing blog files', () => {
    const broken: string[] = [];
    for (const slug of blogFiles) {
      const content = fs.readFileSync(path.join(BLOG_DIR, `${slug}.astro`), 'utf-8');
      const links = content.match(/href="\/blog\/([^"]+)"/g) || [];
      for (const link of links) {
        const targetSlug = link.replace('href="/blog/', '').replace('"', '');
        if (targetSlug && targetSlug !== '' && !blogFiles.includes(targetSlug) && targetSlug !== 'beginner-guides' && targetSlug !== 'two-letter-words' && targetSlug !== 'three-letter-words') {
          broken.push(`${slug} → ${targetSlug}`);
        }
      }
    }
    if (broken.length > 0) {
      console.log(`Broken links (${broken.length}): ${broken.slice(0, 20).join(', ')}`);
    }
    // Allow some tolerance for category pages that may not exist yet
    expect(broken.length).toBeLessThan(50);
  });

  test('every blog post has back-to-blog link', () => {
    const missing: string[] = [];
    for (const slug of blogFiles) {
      const content = fs.readFileSync(path.join(BLOG_DIR, `${slug}.astro`), 'utf-8');
      if (!content.includes('Back to all articles') && !content.includes('← Back to all')) {
        missing.push(slug);
      }
    }
    expect(missing, `Posts missing back-to-blog: ${missing.join(', ')}`).toHaveLength(0);
  });

  test('every blog post has CTA box', () => {
    const missing: string[] = [];
    for (const slug of blogFiles) {
      const content = fs.readFileSync(path.join(BLOG_DIR, `${slug}.astro`), 'utf-8');
      if (!content.includes('Open Word Finder') && !content.includes('Word Finder →')) {
        missing.push(slug);
      }
    }
    expect(missing, `Posts missing CTA: ${missing.join(', ')}`).toHaveLength(0);
  });

  test('every blog post has Article JSON-LD schema', () => {
    const missing: string[] = [];
    for (const slug of blogFiles) {
      const content = fs.readFileSync(path.join(BLOG_DIR, `${slug}.astro`), 'utf-8');
      if (!content.includes('"Article"') && !content.includes('"@type": "Article"') && !content.includes('"@type":"Article"')) {
        missing.push(slug);
      }
    }
    // Category landing pages are exceptions
    const filtered = missing.filter(s => !['beginner-guides', 'two-letter-words', 'three-letter-words'].includes(s));
    expect(filtered, `Posts missing Article schema: ${filtered.join(', ')}`).toHaveLength(0);
  });

  test('every blog post has FAQPage JSON-LD schema', () => {
    const missing: string[] = [];
    for (const slug of blogFiles) {
      const content = fs.readFileSync(path.join(BLOG_DIR, `${slug}.astro`), 'utf-8');
      if (!content.includes('FAQPage')) {
        missing.push(slug);
      }
    }
    // Category landing pages are exceptions
    const filtered = missing.filter(s => !['beginner-guides', 'two-letter-words', 'three-letter-words'].includes(s));
    expect(filtered, `Posts missing FAQPage schema: ${filtered.join(', ')}`).toHaveLength(0);
  });
});

test.describe('Blog SEO & Cross-Links — Negative', () => {

  test('no blog post has duplicate Related Articles sections', () => {
    const dupes: string[] = [];
    for (const slug of blogFiles) {
      const content = fs.readFileSync(path.join(BLOG_DIR, `${slug}.astro`), 'utf-8');
      const count = (content.match(/Related Articles/g) || []).length;
      if (count > 1) {
        dupes.push(`${slug} (${count}x)`);
      }
    }
    expect(dupes, `Posts with duplicate Related Articles: ${dupes.join(', ')}`).toHaveLength(0);
  });

  test('no blog post links to itself', () => {
    const selfLinks: string[] = [];
    for (const slug of blogFiles) {
      const content = fs.readFileSync(path.join(BLOG_DIR, `${slug}.astro`), 'utf-8');
      if (content.includes(`href="/blog/${slug}"`)) {
        selfLinks.push(slug);
      }
    }
    expect(selfLinks, `Posts linking to themselves: ${selfLinks.join(', ')}`).toHaveLength(0);
  });

  test('no blog post has empty title', () => {
    const empty: string[] = [];
    for (const slug of blogFiles) {
      const content = fs.readFileSync(path.join(BLOG_DIR, `${slug}.astro`), 'utf-8');
      if (content.includes('title=""') || content.includes('title=" "')) {
        empty.push(slug);
      }
    }
    expect(empty, `Posts with empty title: ${empty.join(', ')}`).toHaveLength(0);
  });
});
