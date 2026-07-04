#!/usr/bin/env node
/**
 * School Leads Generator — GIAS Data
 * 
 * Downloads the public "Get Information About Schools" (GIAS) extract from the
 * DfE and filters for open secondary schools in England. Outputs a CSV with:
 *   - School name
 *   - Town
 *   - Postcode
 *   - Local Authority
 *   - General email (office/admin email from GIAS)
 *   - School website
 *   - Phase (Secondary, All-through, etc.)
 *   - Type (Academy, Community, etc.)
 *
 * Usage:
 *   node scripts/school-leads.mjs                    # All England secondary schools
 *   node scripts/school-leads.mjs --county "Oxfordshire"
 *   node scripts/school-leads.mjs --town "Oxford"
 *   node scripts/school-leads.mjs --postcode "OX"   # Postcode prefix
 *   node scripts/school-leads.mjs --la "Oxfordshire" --limit 50
 *
 * Data source: https://get-information-schools.service.gov.uk
 * This is public government data — no scraping of private info.
 */

import { existsSync, mkdirSync } from 'fs';
import { readFile, writeFile } from 'fs/promises';

// --- Config ---
const CACHE_DIR = '/tmp/school-leads';
const CACHE_FILE = `${CACHE_DIR}/gias-establishments.csv`;
const OUTPUT_FILE = `${CACHE_DIR}/school-leads.csv`;

// Secondary phase codes in GIAS
const SECONDARY_PHASES = ['Secondary', 'All-through', '16 plus', 'Middle deemed secondary'];
const OPEN_STATUSES = ['Open', 'Open, but proposed to close'];

// --- Parse CLI args ---
function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { county: '', town: '', postcode: '', la: '', limit: 0 };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--county' && args[i + 1]) opts.county = args[++i];
    else if (args[i] === '--town' && args[i + 1]) opts.town = args[++i];
    else if (args[i] === '--postcode' && args[i + 1]) opts.postcode = args[++i];
    else if (args[i] === '--la' && args[i + 1]) opts.la = args[++i];
    else if (args[i] === '--limit' && args[i + 1]) opts.limit = parseInt(args[++i], 10);
    else if (args[i] === '--help') {
      console.log(`
School Leads Generator — GIAS Public Data

Usage:
  node scripts/school-leads.mjs [options]

Options:
  --county "Name"     Filter by county (e.g., "Oxfordshire")
  --town "Name"       Filter by town (e.g., "Oxford")
  --postcode "XX"     Filter by postcode prefix (e.g., "OX", "B")
  --la "Name"         Filter by Local Authority name
  --limit N           Max results to output
  --help              Show this help

Examples:
  node scripts/school-leads.mjs --la "Oxfordshire"
  node scripts/school-leads.mjs --postcode "OX" --limit 30
  node scripts/school-leads.mjs --town "Birmingham"
`);
      process.exit(0);
    }
  }
  return opts;
}

// --- Check for GIAS data ---
async function ensureGIASData() {
  if (!existsSync(CACHE_DIR)) mkdirSync(CACHE_DIR, { recursive: true });

  if (existsSync(CACHE_FILE)) {
    const { stat } = await import('fs/promises');
    const info = await stat(CACHE_FILE);
    const ageDays = (Date.now() - info.mtimeMs) / (24 * 60 * 60 * 1000);
    const sizeMB = (info.size / 1024 / 1024).toFixed(1);
    console.log(`Using GIAS data: ${CACHE_FILE} (${sizeMB}MB, ${ageDays.toFixed(0)} days old)`);
    if (ageDays > 30) {
      console.log('⚠️  Data is over 30 days old. Consider re-downloading for fresh results.');
    }
    return;
  }

  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📥 GIAS DATA NEEDED — One-time download (takes 2 minutes)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('The DfE requires a browser for the initial download.');
  console.log('');
  console.log('OPTION A — Full dataset (recommended, ~50MB):');
  console.log('  1. Open: https://get-information-schools.service.gov.uk/Downloads');
  console.log('  2. Click "Establishment and group data" tab');
  console.log('  3. Click the first "All establishment data" download link');
  console.log('  4. Save/move the CSV file to:');
  console.log(`     ${CACHE_FILE}`);
  console.log('');
  console.log('OPTION B — Filtered download (smaller, ~5MB):');
  console.log('  1. Open: https://get-information-schools.service.gov.uk/Search');
  console.log('  2. Set filters: Status = "Open", Phase = "Secondary"');
  console.log('  3. Click "Search"');
  console.log('  4. At the top of results, click "Download these search results"');
  console.log('  5. Save/move the CSV to:');
  console.log(`     ${CACHE_FILE}`);
  console.log('');
  console.log('After downloading, re-run this script.');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  process.exit(0);
}

// --- Parse CSV (handle quoted fields with commas) ---
function parseCSVLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current.trim());
  return fields;
}

// --- Process the CSV ---
async function processSchools(opts) {
  if (!existsSync(CACHE_FILE)) {
    console.error(`Cache file not found: ${CACHE_FILE}`);
    console.error('Run the download step first or manually place the GIAS CSV there.');
    process.exit(1);
  }

  const content = await readFile(CACHE_FILE, 'utf-8');
  const lines = content.split('\n');
  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine);

  // Find column indices — use exact match or specific patterns
  const col = (name) => {
    // Try exact match first (case-insensitive, ignoring quotes)
    let idx = headers.findIndex(h => h.replace(/"/g, '').toLowerCase() === name.toLowerCase());
    if (idx !== -1) return idx;
    // Try includes as fallback
    idx = headers.findIndex(h => h.replace(/"/g, '').toLowerCase().includes(name.toLowerCase()));
    if (idx === -1) console.warn(`Warning: column "${name}" not found in headers`);
    return idx;
  };

  const nameIdx = col('EstablishmentName');
  const statusIdx = col('EstablishmentStatus (name)');
  const phaseIdx = col('PhaseOfEducation (name)');
  const typeIdx = col('TypeOfEstablishment (name)');
  const townIdx = col('Town');
  const postcodeIdx = col('Postcode');
  const countyIdx = col('County (name)');
  const laIdx = col('LA (name)');
  const websiteIdx = col('SchoolWebsite');

  // Try to find an email column (may not exist in bulk extract)
  const emailColIdx = headers.findIndex(h => 
    h.replace(/"/g, '').toLowerCase().includes('email') && !h.toLowerCase().includes('headteacher')
  );

  console.log(`\nHeaders found: ${headers.length} columns`);
  console.log(`Key columns: Name(${nameIdx}), Status(${statusIdx}), Phase(${phaseIdx}), Town(${townIdx}), Postcode(${postcodeIdx}), LA(${laIdx}), Website(${websiteIdx}), Email(${emailColIdx})`);

  const results = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const fields = parseCSVLine(lines[i]);

    // Filter: open schools only
    const status = fields[statusIdx] || '';
    if (!OPEN_STATUSES.some(s => status.includes(s))) continue;

    // Filter: secondary phase
    const phase = fields[phaseIdx] || '';
    if (!SECONDARY_PHASES.some(p => phase.includes(p))) continue;

    const name = fields[nameIdx] || '';
    const town = fields[townIdx] || '';
    const postcode = fields[postcodeIdx] || '';
    const county = fields[countyIdx] || '';
    const la = fields[laIdx] || '';
    const website = fields[websiteIdx] || '';
    const email = emailColIdx >= 0 ? (fields[emailColIdx] || '') : '';
    const type = fields[typeIdx] || '';

    // Apply user filters
    if (opts.county && !county.toLowerCase().includes(opts.county.toLowerCase())) continue;
    if (opts.town && !town.toLowerCase().includes(opts.town.toLowerCase())) continue;
    if (opts.postcode && !postcode.toLowerCase().startsWith(opts.postcode.toLowerCase())) continue;
    if (opts.la && !la.toLowerCase().includes(opts.la.toLowerCase())) continue;

    // Derive office email from website if no email in data
    let contactEmail = email;
    if (!contactEmail && website) {
      // Common UK school email pattern: office@domain or admin@domain
      try {
        const domain = new URL(website.startsWith('http') ? website : `https://${website}`).hostname.replace('www.', '');
        contactEmail = `office@${domain}`;
      } catch { /* ignore malformed URLs */ }
    }

    results.push({
      name,
      town,
      postcode,
      la,
      email: contactEmail,
      website,
      phase,
      type,
    });

    if (opts.limit && results.length >= opts.limit) break;
  }

  return results;
}

// --- Output ---
async function outputResults(results) {
  if (results.length === 0) {
    console.log('\nNo schools found matching your filters.');
    return;
  }

  // CSV output
  const csvHeader = 'School Name,Town,Postcode,Local Authority,Email,Website,Phase,Type';
  const csvRows = results.map(r => 
    `"${r.name}","${r.town}","${r.postcode}","${r.la}","${r.email}","${r.website}","${r.phase}","${r.type}"`
  );
  const csv = [csvHeader, ...csvRows].join('\n');
  await writeFile(OUTPUT_FILE, csv, 'utf-8');

  console.log(`\n✅ Found ${results.length} secondary schools`);
  console.log(`📄 CSV saved to: ${OUTPUT_FILE}`);
  console.log('');

  // Show first 10 as preview
  console.log('Preview (first 10):');
  console.log('─'.repeat(100));
  console.log(`${'School'.padEnd(40)} ${'Town'.padEnd(15)} ${'Postcode'.padEnd(10)} Email`);
  console.log('─'.repeat(100));
  results.slice(0, 10).forEach(r => {
    console.log(`${r.name.substring(0, 39).padEnd(40)} ${r.town.substring(0, 14).padEnd(15)} ${r.postcode.padEnd(10)} ${r.email}`);
  });
  if (results.length > 10) {
    console.log(`... and ${results.length - 10} more in the CSV file`);
  }
  console.log('');
  console.log(`Open the full list: open ${OUTPUT_FILE}`);
}

// --- Main ---
async function main() {
  const opts = parseArgs();
  
  console.log('🏫 School Leads Generator — GIAS Public Data');
  console.log('─'.repeat(50));
  
  if (opts.county) console.log(`Filter: County = "${opts.county}"`);
  if (opts.town) console.log(`Filter: Town = "${opts.town}"`);
  if (opts.postcode) console.log(`Filter: Postcode prefix = "${opts.postcode}"`);
  if (opts.la) console.log(`Filter: Local Authority = "${opts.la}"`);
  if (opts.limit) console.log(`Filter: Limit = ${opts.limit}`);

  await ensureGIASData();
  const results = await processSchools(opts);
  await outputResults(results);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
