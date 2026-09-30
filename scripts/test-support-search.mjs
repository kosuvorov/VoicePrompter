import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const output = mkdtempSync(join(tmpdir(), 'vp-support-search-'));
try {
  execFileSync(process.execPath, ['node_modules/typescript/bin/tsc', 'src/support-search.ts', 'src/support-data.ts', '--outDir', output, '--module', 'commonjs', '--target', 'es2020', '--skipLibCheck']);
  writeFileSync(join(output, 'package.json'), '{"type":"commonjs"}');
  const require = createRequire(import.meta.url);
  const { articles } = require(join(output, 'support-data.js'));
  const { createSupportSearch } = require(join(output, 'support-search.js'));
  const search = createSupportSearch(articles.map(article => ({ ...article, text: `${article.answer.replace(/<[^>]*>/g, ' ')} ${article.platforms.join(' ')}` })));
  const results = query => [...search(query)].filter(([, score]) => score > 0).sort((a, b) => b[1] - a[1]).map(([id]) => id);
  const cases = [
    ["voice scrolling doesn't work", 'not-scrolling'],
    ['voice scrolling doesn’t work', 'not-scrolling'],
    ['voice scrolling doesnt work', 'not-scrolling'],
    ['doesnt scroll', 'not-scrolling'],
    ['voice scrolling does not work', 'not-scrolling'],
    ['voice scrolling not working', 'not-scrolling'],
    ['voice scrolling not working iphone', 'not-scrolling'],
    ["in Voice it doesn't move", 'not-scrolling'],
    ['stops following the script', 'not-scrolling'],
    ['text frozen', 'not-scrolling'],
    ["voice scrolling doesn't work when recording", 'android-recording'],
    ["voice scrolling can't keep up", 'slow-scrolling'],
    ['scrolling falls behind', 'slow-scrolling'],
    ['scrolling lagging', 'slow-scrolling'],
    ['unable to restore purchase', 'android-purchase'],
    ['paid but still says free', 'android-purchase'],
    ['licence cover Mac and Android', 'license-devices'],
    ['bluetooth mic not working', 'external-microphone'],
    ['text is sideways', 'rotate-pip'],
    ['prompter disappeared on second screen', 'external-monitor'],
    ['invioce', 'invoice'], ['4k', '4k-recording'], ['pdf', 'import-script'],
  ];
  for (const [query, expected] of cases) assert.equal(results(query)[0], expected, query);
  for (const query of ['voice scrolling not working android', "voice scrolling doesn't work on android"]) {
    assert.deepEqual(results(query).slice(0, 2), ['not-scrolling', 'android-recording'], query);
  }
  assert.equal(results('').length, articles.length);
  assert.equal(results('  ').length, articles.length);
  assert.deepEqual(results('zebra gardening'), []);
  console.log(`Passed ${cases.length + 5} support search checks.`);
} finally {
  rmSync(output, { recursive: true, force: true });
}
