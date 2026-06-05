/**
 * Batch script: Convert all blog posts from prerendered (static) to SSR with D1 publish gate.
 * 
 * Replaces:
 *   export const prerender = true;
 *   import Layout from '../../layouts/Layout.astro';
 * 
 * With:
 *   import Layout from '../../layouts/Layout.astro';
 *   import { isBlogPublished } from '../../lib/blogGate';
 *   const slug = Astro.url.pathname.replace('/blog/', '').replace(/\/$/, '');
 *   const isPublished = await isBlogPublished(slug);
 *   if (!isPublished) return Astro.redirect('/404');
 */

import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const BLOG_DIR = join(process.cwd(), 'src/pages/blog');

async function main() {
  const files = await readdir(BLOG_DIR);
  const blogFiles = files.filter(f => f.endsWith('.astro') && f !== 'index.astro');
  
  let updated = 0;
  
  for (const file of blogFiles) {
    const filePath = join(BLOG_DIR, file);
    let content = await readFile(filePath, 'utf-8');
    
    // Skip if already converted
    if (content.includes('isBlogPublished')) {
      console.log(`  SKIP ${file} (already converted)`);
      continue;
    }
    
    // Replace the frontmatter
    content = content.replace(
      /---\nexport const prerender = true;\nimport Layout from '\.\.\/\.\.\/layouts\/Layout\.astro';\n---/,
      `---\nimport Layout from '../../layouts/Layout.astro';\nimport { isBlogPublished } from '../../lib/blogGate';\n\nconst slug = Astro.url.pathname.replace('/blog/', '').replace(/\\/$/, '');\nconst isPublished = await isBlogPublished(slug);\nif (!isPublished) return Astro.redirect('/404');\n---`
    );
    
    await writeFile(filePath, content);
    updated++;
    console.log(`  ✓ ${file}`);
  }
  
  console.log(`\nDone. Updated ${updated} of ${blogFiles.length} blog files.`);
}

main().catch(console.error);
