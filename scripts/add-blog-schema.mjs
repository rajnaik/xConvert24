/**
 * Adds BlogPosting JSON-LD schema import to blog posts that don't have it yet.
 * Also adds a cross-link to the relevant converter at the bottom of each post.
 */

import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const BLOG_DIR = join(process.cwd(), 'src/pages/blog');

// Map blog slugs to their converter page for cross-linking
const converterLinks = {
  'how-to-convert-kg-to-lbs': '/convert/weight',
  'how-to-convert-celsius-to-fahrenheit': '/convert/temperature',
  'how-tall-is-6-feet-in-cm': '/convert/length',
  'cups-to-ml-baking-conversion': '/convert/cooking',
  'speed-limits-around-the-world': '/convert/speed',
  'understanding-tire-pressure-psi': '/convert/pressure',
  'mb-vs-gb-explained-simply': '/convert/data',
  'world-time-zones-explained': '/tools/clock',
  'horsepower-vs-kilowatts-cars': '/convert/power',
  'driving-distances-km-vs-miles': '/convert/length',
  'calories-vs-kilocalories': '/convert/energy',
  'gold-weight-troy-ounces': '/convert/weight',
  'how-much-is-1tb-of-storage': '/convert/data',
  'mortgage-vs-rent-calculator-guide': '/tools/loan',
  'oven-temperatures-celsius-fahrenheit': '/convert/temperature',
  'internet-speed-mbps-explained': '/convert/data',
  'healthy-weight-loss-rate-per-week': '/tools/bmi',
  'fever-temperature-what-is-normal': '/convert/temperature',
  'binary-vs-decimal-storage-confusion': '/convert/data',
  'best-time-to-exchange-currency': '/convert/currency',
  'understanding-cryptocurrency-basics': '/tools/crypto-coins',
  'feet-and-inches-to-cm-height': '/convert/length',
  'how-many-days-until-christmas': '/tools/date-diff',
  'how-many-liters-in-a-gallon': '/convert/volume',
  'body-weight-metric-vs-imperial': '/convert/weight',
  'wind-speed-knots-to-mph': '/convert/speed',
  'fuel-economy-mpg-vs-l100km': '/convert/fuel',
  'what-is-a-stone-in-weight': '/convert/weight',
  'room-measurements-meters-to-feet': '/convert/length',
  'tablespoon-to-ml-medicine': '/convert/cooking',
  'rgb-vs-cmyk-when-to-use': '/tools/color',
  'how-far-is-a-nautical-mile': '/convert/length',
  'bmi-limitations-muscle-vs-fat': '/tools/bmi',
  'compound-interest-explained': '/tools/loan',
  'miles-to-kilometers-running': '/convert/length',
  'age-calculator-exact-days-alive': '/tools/age',
  'baby-weight-conversion-chart': '/convert/weight',
  'pomodoro-technique-timer-guide': '/tools/stopwatch',
  'us-vs-uk-pint-difference': '/convert/volume',
  'luggage-weight-kg-to-lbs': '/convert/weight',
  'what-is-mach-speed': '/convert/speed',
  'weather-temperature-conversion-travel': '/convert/temperature',
  'hex-color-codes-explained': '/tools/color',
  'understanding-millimeters-in-engineering': '/convert/length',
  'what-is-kelvin-temperature': '/convert/temperature',
  'water-intake-liters-per-day': '/convert/volume',
  'bmi-what-is-a-healthy-weight': '/tools/bmi',
  'grams-to-ounces-for-cooking': '/convert/cooking',
  'freezing-and-boiling-points-all-scales': '/convert/temperature',
  'how-exchange-rates-work': '/convert/currency',
  'why-world-uses-different-units': '/convert/weight',
};

async function main() {
  const files = await readdir(BLOG_DIR);
  const blogFiles = files.filter(f => f.endsWith('.astro') && f !== 'index.astro');
  
  let updated = 0;
  
  for (const file of blogFiles) {
    const filePath = join(BLOG_DIR, file);
    let content = await readFile(filePath, 'utf-8');
    const slug = file.replace('.astro', '');
    
    // Skip if already has cross-link
    if (content.includes('Try our converter')) {
      console.log(`  SKIP ${file} (already has cross-link)`);
      continue;
    }
    
    // Find the converter link for this blog
    const converterPath = converterLinks[slug];
    if (!converterPath) {
      console.log(`  SKIP ${file} (no converter mapping)`);
      continue;
    }
    
    // Add cross-link before the closing </article> or </Layout>
    const crossLink = `\n      <div class="not-prose mt-8 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">\n        <p class="text-sm text-amber-800 dark:text-amber-300 font-medium">🔗 Try our converter: <a href="${converterPath}" class="text-amber-600 dark:text-amber-400 font-bold hover:underline">Open ${converterPath.includes('convert') ? 'Converter' : 'Tool'} →</a></p>\n      </div>`;
    
    // Insert before </article> if it exists, otherwise before </Layout>
    if (content.includes('</article>')) {
      content = content.replace('</article>', crossLink + '\n    </article>');
    } else if (content.includes('</Layout>')) {
      content = content.replace('</Layout>', '  ' + crossLink + '\n</Layout>');
    }
    
    await writeFile(filePath, content);
    updated++;
    console.log(`  ✓ ${file} → ${converterPath}`);
  }
  
  console.log(`\nDone. Added cross-links to ${updated} blog files.`);
}

main().catch(console.error);
