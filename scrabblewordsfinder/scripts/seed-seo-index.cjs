#!/usr/bin/env node
/**
 * Seed SEO Index — Extracts SEO data from all pages and upserts into seo_index table
 * Usage: node scripts/seed-seo-index.cjs
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const PAGES_DIR = "src/pages";
const BASE_URL = "https://www.scrabblewordsfinder.com";

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

function countH2(content) {
  return (content.match(/<h2[\s>]/g) || []).length;
}

function countInternalLinks(content) {
  return (content.match(/href="\/[^"]*"/g) || []).length;
}

function hasJsonLd(content, type) {
  return content.includes(`"@type":"${type}"`) || content.includes(`"@type": "${type}"`) ? 1 : 0;
}

function estimateWordCount(content) {
  // Strip HTML tags and count words in text content
  const text = content.replace(/<[^>]+>/g, " ").replace(/\{[^}]+\}/g, " ").replace(/\s+/g, " ");
  return text.split(" ").filter(w => w.length > 2).length;
}

function fileToUrl(filePath) {
  let url = "/" + path.relative(PAGES_DIR, filePath).replace(/\.astro$/, "/").replace(/index\/$/, "");
  if (!url.endsWith("/")) url += "/";
  return url;
}

console.log("🔍 Scanning all pages for SEO data...");
const files = getFiles(PAGES_DIR);
console.log(`   Found ${files.length} pages`);

const records = [];

for (const f of files) {
  const content = fs.readFileSync(f, "utf-8");
  const url = fileToUrl(f);
  
  const title = extractProp(content, "title");
  const description = extractProp(content, "description");
  const keywords = extractProp(content, "keywords");
  
  // H1 — from BlogCrossLinks title prop or standalone h1
  let h1 = "";
  const bclMatch = content.match(/BlogCrossLinks title="([^"]+)"/);
  if (bclMatch) h1 = bclMatch[1];
  else {
    const h1Match = content.match(/<h1[^>]*>([^<]+)<\/h1>/);
    if (h1Match) h1 = h1Match[1];
  }
  
  records.push({
    url,
    seo_title: title,
    seo_h1: h1,
    seo_meta_description: description,
    seo_canonical: BASE_URL + url,
    seo_h2_count: countH2(content),
    seo_json_ld_article: hasJsonLd(content, "Article"),
    seo_json_ld_faq: hasJsonLd(content, "FAQPage"),
    seo_meta_keywords: keywords,
    seo_og_title: title, // OG title typically mirrors page title
    seo_og_description: description,
    seo_og_image: BASE_URL + "/social-card.svg",
    seo_word_count: estimateWordCount(content),
    seo_internal_links: countInternalLinks(content),
    seo_title_length: title.length,
    seo_desc_length: description.length,
  });
}

console.log(`   Extracted SEO data from ${records.length} pages`);
console.log("   Generating SQL...");

// Build SQL in chunks of 20 for wrangler
const esc = (s) => (s || "").replace(/'/g, "''").substring(0, 500);
const chunks = [];
for (let i = 0; i < records.length; i += 20) {
  chunks.push(records.slice(i, i + 20));
}

let sqlFile = "";
for (const chunk of chunks) {
  const values = chunk.map(r => 
    `('${esc(r.url)}', '${esc(r.seo_title)}', '${esc(r.seo_h1)}', '${esc(r.seo_meta_description)}', '${esc(r.seo_canonical)}', ${r.seo_h2_count}, ${r.seo_json_ld_article}, ${r.seo_json_ld_faq}, '${esc(r.seo_meta_keywords)}', '${esc(r.seo_og_title)}', '${esc(r.seo_og_description)}', '${esc(r.seo_og_image)}', ${r.seo_word_count}, ${r.seo_internal_links}, ${r.seo_title_length}, ${r.seo_desc_length})`
  ).join(",\n");
  
  sqlFile += `INSERT OR REPLACE INTO seo_index (url, seo_title, seo_h1, seo_meta_description, seo_canonical, seo_h2_count, seo_json_ld_article, seo_json_ld_faq, seo_meta_keywords, seo_og_title, seo_og_description, seo_og_image, seo_word_count, seo_internal_links, seo_title_length, seo_desc_length) VALUES\n${values}\nON CONFLICT(url) DO UPDATE SET seo_title=excluded.seo_title, seo_h1=excluded.seo_h1, seo_meta_description=excluded.seo_meta_description, seo_canonical=excluded.seo_canonical, seo_h2_count=excluded.seo_h2_count, seo_json_ld_article=excluded.seo_json_ld_article, seo_json_ld_faq=excluded.seo_json_ld_faq, seo_meta_keywords=excluded.seo_meta_keywords, seo_og_title=excluded.seo_og_title, seo_og_description=excluded.seo_og_description, seo_og_image=excluded.seo_og_image, seo_word_count=excluded.seo_word_count, seo_internal_links=excluded.seo_internal_links, seo_title_length=excluded.seo_title_length, seo_desc_length=excluded.seo_desc_length, updated_at=datetime('now');\n`;
}

const sqlPath = "/tmp/seed-seo-index.sql";
fs.writeFileSync(sqlPath, sqlFile, "utf-8");
console.log(`   SQL written to ${sqlPath} (${chunks.length} statements, ${records.length} records)`);
console.log("   Executing against local DB...");

try {
  // Need unique constraint on url for UPSERT to work
  execSync(`cd "${path.resolve(".")}" && npx wrangler d1 execute DB --local --command "CREATE UNIQUE INDEX IF NOT EXISTS idx_seo_index_url ON seo_index(url);"`, { stdio: "pipe" });
  execSync(`cd "${path.resolve(".")}" && echo "Y" | npx wrangler d1 execute DB --local --file=${sqlPath}`, { stdio: "pipe", timeout: 60000 });
  console.log("✅ Done! All " + records.length + " pages seeded into seo_index");
} catch (e) {
  console.error("❌ Error executing SQL:", e.message.substring(0, 200));
  console.log("   SQL file saved at: " + sqlPath);
  console.log("   Run manually: npx wrangler d1 execute DB --local --file=" + sqlPath);
}
