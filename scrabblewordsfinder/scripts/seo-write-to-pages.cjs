#!/usr/bin/env node
/**
 * SEO Write to Pages — Reads SEO data from DB and writes changes to .astro source files
 * Usage: node scripts/seo-write-to-pages.cjs
 * 
 * Compares DB seo_index values (title, description, keywords) with source files
 * and writes the DB values to the files where they differ.
 * Only processes entries updated since last_seo_sync_to_pages.
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const PAGES_DIR = "src/pages";
const DB_CMD = 'npx wrangler d1 execute DB --local';

function execDB(cmd) {
  try {
    const result = execSync(`${DB_CMD} --command "${cmd.replace(/"/g, '\\"')}" --json`, { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] });
    return JSON.parse(result)[0]?.results || [];
  } catch { return []; }
}

function urlToFile(url) {
  const cleanUrl = url === '/' ? '' : url.replace(/\/$/, '');
  const directPath = path.join(PAGES_DIR, cleanUrl ? cleanUrl + '.astro' : 'index.astro');
  const indexPath = path.join(PAGES_DIR, cleanUrl, 'index.astro');
  if (fs.existsSync(directPath)) return directPath;
  if (fs.existsSync(indexPath)) return indexPath;
  return null;
}

console.log("🔄 SEO Write to Pages — Writing DB values to source files...\n");

// Get last sync time
const syncInfo = execDB("SELECT COALESCE(last_seo_sync_to_pages, '2020-01-01') as last_sync FROM site_status WHERE id = 1");
const lastSync = syncInfo[0]?.last_sync || '2020-01-01';
console.log(`   Last sync: ${lastSync}`);

// Get entries updated since last sync that have text field values
const entries = execDB(`SELECT url, seo_title, seo_meta_description, seo_meta_keywords, seo_h1 FROM seo_index WHERE updated_at > '${lastSync}' AND (seo_title != '' OR seo_meta_description != '' OR seo_meta_keywords != '')`);
console.log(`   Entries updated since last sync: ${entries.length}\n`);

if (entries.length === 0) {
  console.log("✅ Nothing to write — all pages are in sync.");
  process.exit(0);
}

let written = 0;
let skipped = 0;
let notFound = 0;
const changes = [];

// Decode basic HTML entities that may be in DB values
function decodeEntities(s) {
  return (s || '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'").replace(/&quot;/g, '"');
}

for (const entry of entries) {
  const filePath = urlToFile(entry.url);
  if (!filePath) {
    notFound++;
    continue;
  }

  let content = fs.readFileSync(filePath, "utf-8");
  let fileChanged = false;

  // Compare and write title
  if (entry.seo_title) {
    const dbTitle = decodeEntities(entry.seo_title);
    const titleMatch = content.match(/title="([^"]*)"/);
    if (titleMatch && titleMatch[1].trim() !== dbTitle.trim()) {
      content = content.replace(/title="([^"]*)"/, `title="${dbTitle}"`);
      changes.push({ url: entry.url, field: 'title', old: titleMatch[1].substring(0,50), new: dbTitle.substring(0,50) });
      fileChanged = true;
    }
  }

  // Compare and write description
  if (entry.seo_meta_description) {
    const dbDesc = decodeEntities(entry.seo_meta_description);
    const descMatch = content.match(/description="([^"]*)"/);
    if (descMatch && descMatch[1].trim() !== dbDesc.trim()) {
      content = content.replace(/description="([^"]*)"/, `description="${dbDesc}"`);
      changes.push({ url: entry.url, field: 'description', old: descMatch[1].substring(0,50), new: dbDesc.substring(0,50) });
      fileChanged = true;
    }
  }

  // Compare and write keywords
  if (entry.seo_meta_keywords) {
    const dbKw = decodeEntities(entry.seo_meta_keywords);
    const kwMatch = content.match(/keywords="([^"]*)"/);
    if (kwMatch && kwMatch[1].trim() !== dbKw.trim()) {
      content = content.replace(/keywords="([^"]*)"/, `keywords="${dbKw}"`);
      changes.push({ url: entry.url, field: 'keywords', old: kwMatch[1].substring(0,50), new: dbKw.substring(0,50) });
      fileChanged = true;
    }
  }

  // Compare and write H1
  if (entry.seo_h1) {
    const dbH1 = decodeEntities(entry.seo_h1);
    const h1Match = content.match(/<h1[^>]*>([^<]+)<\/h1>/);
    if (h1Match && h1Match[1].trim() !== dbH1.trim()) {
      content = content.replace(/(<h1[^>]*>)[^<]*(<\/h1>)/, `$1${dbH1}$2`);
      changes.push({ url: entry.url, field: 'h1', old: h1Match[1].substring(0,50), new: dbH1.substring(0,50) });
      fileChanged = true;
    }
  }

  if (fileChanged) {
    fs.writeFileSync(filePath, content, "utf-8");
    written++;
  } else {
    skipped++;
  }
}

// Update last sync timestamp
execDB("UPDATE site_status SET last_seo_sync_to_pages = datetime('now') WHERE id = 1");

// Log changes to seo_sync_log
if (changes.length > 0) {
  const esc = (s) => (s || "").replace(/'/g, "''").substring(0, 500);
  for (let i = 0; i < changes.length; i += 20) {
    const chunk = changes.slice(i, i + 20);
    const values = chunk.map(c => `('${esc(c.url)}', '${esc(c.field)}', '${esc(c.old)}', '${esc(c.new)}')`).join(",");
    execDB(`INSERT INTO seo_sync_log (url, field_changed, old_value, new_value) VALUES ${values}`);
  }
}

console.log("📊 RESULTS:");
console.log(`   Files written: ${written}`);
console.log(`   Files unchanged: ${skipped}`);
console.log(`   Files not found: ${notFound}`);
console.log(`   Field changes: ${changes.length}`);

if (changes.length > 0) {
  console.log("\n📝 CHANGES:");
  changes.forEach(c => {
    console.log(`   ${c.url} | ${c.field} | "${c.old}..." → "${c.new}..."`);
  });
}

console.log("\n✅ Done! Sync timestamp updated.");
