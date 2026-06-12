import { chromium } from 'playwright';

const args = process.argv.slice(2);
const dexscreenerurl = args[0];
const fieldMaps = JSON.parse(args[1]);

async function scrape() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // DexScreener is JS-heavy, use longer timeout and wait for body content
  await page.goto(dexscreenerurl, { waitUntil: 'domcontentloaded', timeout: 60000 });

  // Wait for the main content to render (DexScreener is a SPA)
  try {
    await page.waitForSelector('[class*="chakra"]', { timeout: 15000 });
  } catch (e) {
    // Try waiting a bit more
  }
  await page.waitForTimeout(5000);

  const scraped = {};

  for (const field of fieldMaps) {
    try {
      const elements = await page.locator(`xpath=${field.lookupid}`).all();
      if (elements.length > 0) {
        const text = await elements[0].textContent();
        scraped[field.fieldname] = (text || '').trim();
      } else {
        scraped[field.fieldname] = '';
      }
    } catch (e) {
      scraped[field.fieldname] = '';
    }
  }

  await browser.close();
  console.log(JSON.stringify(scraped));
}

scrape().catch(e => {
  console.error(JSON.stringify({ error: e.message }));
  process.exit(1);
});
