import { readFileSync, writeFileSync } from 'fs';

const LINKS = `<div class="not-prose mb-6 flex flex-wrap items-center gap-3 text-sm"><a href="/" class="inline-flex items-center gap-1 text-blue-400 hover:underline"><span aria-hidden="true">🔍</span> Solver</a> <a href="/activities/#quiz" class="inline-flex items-center gap-1 text-blue-400 hover:underline"><span aria-hidden="true">🎯</span> Quiz</a> <a href="/activities/#anagram" class="inline-flex items-center gap-1 text-blue-400 hover:underline"><span aria-hidden="true">🔀</span> Anagram</a> <a href="/activities/#rack" class="inline-flex items-center gap-1 text-blue-400 hover:underline"><span aria-hidden="true">🎲</span> Rack</a> <a href="/activities/#wotd" class="inline-flex items-center gap-1 text-blue-400 hover:underline"><span aria-hidden="true">📖</span> WOTD</a> <a href="/sixty-seconds/" class="inline-flex items-center gap-1 text-blue-400 hover:underline"><span aria-hidden="true">⏱️</span> 60s</a></div>`;

const files = [
  "src/pages/blog/words-starting-with-over.astro",
  "src/pages/blog/is-up-a-scrabble-word.astro",
  "src/pages/blog/is-yo-a-scrabble-word.astro",
  "src/pages/blog/words-starting-with-qu.astro",
  "src/pages/blog/words-starting-with-re.astro",
  "src/pages/blog/words-starting-with-pre.astro",
  "src/pages/blog/is-fe-a-scrabble-word.astro",
  "src/pages/blog/is-lo-a-scrabble-word.astro"
];

let count = 0;
for (const fp of files) {
  let c = readFileSync(fp, 'utf8');
  if (c.includes('Solver</a>')) continue;
  if (c.includes('BlogCrossLinks')) {
    c = c.replace(/(BlogCrossLinks[^/]*\/>)/, `$1\n${LINKS}`);
  } else if (c.includes('<article')) {
    c = c.replace(/(<article[^>]*>)/, `$1\n${LINKS}`);
  } else if (c.includes('<div class="max-w-3xl')) {
    c = c.replace(/(<div class="max-w-3xl)/, `${LINKS}\n$1`);
  }
  writeFileSync(fp, c);
  count++;
}
console.log(`Added to ${count} files`);
