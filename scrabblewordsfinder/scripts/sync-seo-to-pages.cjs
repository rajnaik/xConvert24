#!/usr/bin/env node
/**
 * Sync SEO to Pages — Compares page files against seo_index DB and reports changes
 * Usage: node scripts/sync-seo-to-pages.cjs
 * 
 * - Extracts SEO data from all .astro page files
 * - Compares with existing seo_index records
 * - Updates changed records
 * - Logs field-level changes to seo_sync_log table
 * - Updates site_status.last_seo_sync_to_pages
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const PAGES_DIR = "src/pages";
const BASE_URL = "https://www.scrabblewordsfinder.com";
const DB_CMD = 'npx wrangler d1 execute DB --local';

function getFiles(dir, results) {
  results = results || [];
  try {
    for (const e of fs.readdirSync(dir)) {
      if (e.startsWith("_") || e === "admin" || e === "api") continue;
      const f = path.join(dir, e);
      if (fs.statSync(f).isDirectory()) getFiles(f, results);
      else if (e.endsWith(".astro")) results.push(f);
    }
  } catch {}
  return results;
}

function extractProp(content, prop) {
  const m = content.match(new RegExp(`${prop}="([^"]+)"`));
  return m ? m[1] : "";
}

function fileToUrl(filePath) {
  let url = "/" + path.relative(PAGES_DIR, filePath).replace(/\.astro$/, "/").replace(/index\/$/, "");
  if (!url.endsWith("/")) url += "/";
  return url;
}

function execDB(cmd) {
  try {
    const result = execSync(`${DB_CMD} --command "${cmd.replace(/"/g, '\\"')}" --json`, { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] });
    return JSON.parse(result)[0]?.results || [];
  } catch { return []; }
}

console.log("🔄 Sync SEO to Pages — Comparing files vs DB...");

// Get current DB records
const dbRecords = {};
const rows = execDB("SELECT id, url, seo_title, seo_h1, seo_meta_description, seo_meta_keywords, seo_h2_count, seo_json_ld_article, seo_json_ld_faq, seo_word_count, seo_internal_links, seo_title_length, seo_desc_length FROM seo_index");
rows.forEach(r => { dbRecords[r.url] = r; });
console.log(`   DB has ${Object.keys(dbRecords).length} records`);

// Scan all pages
const files = getFiles(PAGES_DIR);
console.log(`   Found ${files.length} page files`);

const changes = [];
const newPages = [];

for (const f of files) {
  const content = fs.readFileSync(f, "utf-8");
  const url = fileToUrl(f);
  
  const title = extractProp(content, "title");
  const description = extractProp(content, "description");
  const keywords = extractProp(content, "keywords");
  let h1 = "";
  const bclMatch = content.match(/BlogCrossLinks title="([^"]+)"/);
  if (bclMatch) h1 = bclMatch[1];
  else { const h1m = content.match(/<h1[^>]*>([^<]+)<\/h1>/); if (h1m) h1 = h1m[1]; }
  
  const h2Count = (content.match(/<h2[\s>]/g) || []).length;
  const hasArticle = (content.includes('"@type":"Article"') || content.includes('"@type": "Article"')) ? 1 : 0;
  const hasFaq = content.includes('FAQPage') ? 1 : 0;
  const internalLinks = (content.match(/href="\/[^"]*"/g) || []).length;
  const wordCount = content.replace(/<[^>]+>/g, " ").replace(/\{[^}]+\}/g, " ").replace(/\s+/g, " ").split(" ").filter(w => w.length > 2).length;
  
  const current = {
    seo_title: title,
    seo_h1: h1,
    seo_meta_description: description,
    seo_meta_keywords: keywords,
    seo_h2_count: h2Count,
    seo_json_ld_article: hasArticle,
    seo_json_ld_faq: hasFaq,
    seo_word_count: wordCount,
    seo_internal_links: internalLinks,
    seo_title_length: title.length,
    seo_desc_length: description.length,
  };
  
  const existing = dbRecords[url];
  if (!existing) {
    newPages.push(url);
    continue;
  }
  
  // Compare fields
  const fields = ['seo_title', 'seo_h1', 'seo_meta_description', 'seo_meta_keywords', 'seo_h2_count', 'seo_json_ld_article', 'seo_json_ld_faq', 'seo_word_count', 'seo_internal_links', 'seo_title_length', 'seo_desc_length'];
  for (const field of fields) {
    const oldVal = String(existing[field] || '');
    const newVal = String(current[field] || '');
    if (oldVal !== newVal) {
      changes.push({ url, field, oldVal: oldVal.substring(0, 100), newVal: newVal.substring(0, 100) });
    }
  }
}

console.log(`\n📊 RESULTS:`);
console.log(`   New pages (not in DB): ${newPages.length}`);
console.log(`   Fields changed: ${changes.length}`);
console.log(`   Unique pages with changes: ${new Set(changes.map(c => c.url)).size}`);

if (changes.length > 0) {
  console.log(`\n📝 CHANGES (first 20):`);
  changes.slice(0, 20).forEach(c => {
    console.log(`   ${c.url} | ${c.field} | "${c.oldVal.substring(0,30)}" → "${c.newVal.substring(0,30)}"`);
  });
  if (changes.length > 20) console.log(`   ... and ${changes.length - 20} more`);
}

// Write changes to seo_sync_log
if (changes.length > 0) {
  console.log(`\n💾 Writing ${changes.length} changes to seo_sync_log...`);
  const esc = (s) => (s || "").replace(/'/g, "''").substring(0, 200);
  
  // Batch insert in chunks of 20
  for (let i = 0; i < changes.length; i += 20) {
    const chunk = changes.slice(i, i + 20);
    const values = chunk.map(c => `('${esc(c.url)}', '${esc(c.field)}', '${esc(c.oldVal)}', '${esc(c.newVal)}')`).join(",");
    const sql = `INSERT INTO seo_sync_log (url, field_changed, old_value, new_value) VALUES ${values};`;
    try {
      execSync(`cd "${path.resolve(".")}" && ${DB_CMD} --command "${sql.replace(/"/g, '\\"')}"`, { stdio: "pipe" });
    } catch {}
  }
}

// Re-run the full seed to update DB
console.log("\n🔄 Re-seeding seo_index with current page data...");
try {
  execSync(`cd "${path.resolve(".")}" && node scripts/seed-seo-index.cjs`, { stdio: "inherit" });
} catch {}

// Update site_status timestamp
try {
  execSync(`cd "${path.resolve(".")}" && ${DB_CMD} --command "UPDATE site_status SET last_seo_sync_to_pages = datetime('now') WHERE id = 1;"`, { stdio: "pipe" });
} catch {}

console.log("\n✅ Sync complete!");
console.log(`   Pages updated: ${new Set(changes.map(c => c.url)).size}`);
console.log(`   Fields changed: ${changes.length}`);
console.log(`   New pages added: ${newPages.length}`);
