/**
 * Assemble the static GitHub Pages bundle into `site/` without mutating source files.
 *
 * Output layout:
 *   site/
 *   ├── .nojekyll
 *   ├── index.html               (flattened Playground entry)
 *   ├── playground.html          (same as index.html for direct links)
 *   ├── dxf-preview.html / svg-to-dxf.html / dom-to-dxf.html / canvas-record.html / browser-demo.html
 *   ├── api.html                 (generated from docs/api.html)
 *   ├── assets/ & js/            (example shared styles and scripts)
 *   ├── examples/*.mjs           (Node example scripts referenced by API docs)
 *   ├── README.md & CHANGELOG.md
 *   └── dist/                    (browser IIFE vecbridge.global.js + ESM .js/.js.map)
 *
 * Usage: pnpm build:site
 */
import {
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = fileURLToPath(new URL('..', import.meta.url));
const distDir = join(rootDir, 'dist');
const docsDir = join(rootDir, 'docs');
const examplesDir = join(rootDir, 'examples');
const siteDir = join(rootDir, 'site');

const globalBundlePath = join(distDir, 'vecbridge.global.js');
const apiHtmlPath = join(docsDir, 'api.html');

if (!existsSync(globalBundlePath)) {
  console.error('Missing dist/vecbridge.global.js. Run `pnpm build` first.');
  process.exit(1);
}
if (!existsSync(apiHtmlPath)) {
  console.error('Missing docs/api.html. Run `pnpm docs:api` first.');
  process.exit(1);
}

rmSync(siteDir, { recursive: true, force: true });
mkdirSync(siteDir, { recursive: true });
writeFileSync(join(siteDir, '.nojekyll'), '');

/** Copy only browser-consumable JS & sourcemap artifacts from dist/ (exclude .cjs / .d.ts). */
function copyBrowserDist(srcDir, targetDir) {
  mkdirSync(targetDir, { recursive: true });
  let count = 0;
  for (const entry of readdirSync(srcDir, { withFileTypes: true })) {
    const srcPath = join(srcDir, entry.name);
    const dstPath = join(targetDir, entry.name);
    if (entry.isDirectory()) {
      count += copyBrowserDist(srcPath, dstPath);
    } else if (entry.name.endsWith('.js') || entry.name.endsWith('.js.map')) {
      copyFileSync(srcPath, dstPath);
      count += 1;
    }
  }
  return count;
}

const distFiles = copyBrowserDist(distDir, join(siteDir, 'dist'));

cpSync(join(examplesDir, 'assets'), join(siteDir, 'assets'), { recursive: true });
cpSync(join(examplesDir, 'js'), join(siteDir, 'js'), { recursive: true });

// Keep Node example scripts and top-level docs accessible so links in api.html never 404.
const siteNodeExamplesDir = join(siteDir, 'examples');
mkdirSync(siteNodeExamplesDir, { recursive: true });
for (const entry of readdirSync(examplesDir, { withFileTypes: true })) {
  if (entry.isFile() && entry.name.endsWith('.mjs')) {
    copyFileSync(join(examplesDir, entry.name), join(siteNodeExamplesDir, entry.name));
  }
}
for (const docFile of ['README.md', 'CHANGELOG.md']) {
  const srcPath = join(rootDir, docFile);
  if (existsSync(srcPath)) copyFileSync(srcPath, join(siteDir, docFile));
}

// Rewrite relative links in example HTML pages for flattened site/ root.
const rewriteExampleHtml = (html) =>
  html
    .replaceAll('../dist/', './dist/')
    .replaceAll('../docs/api.html', './api.html');

let htmlCount = 0;
for (const entry of readdirSync(examplesDir, { withFileTypes: true })) {
  if (!entry.isFile() || !entry.name.endsWith('.html')) continue;
  const raw = readFileSync(join(examplesDir, entry.name), 'utf8');
  const rewritten = rewriteExampleHtml(raw);
  writeFileSync(join(siteDir, entry.name), rewritten);
  htmlCount += 1;

  if (entry.name === 'playground.html') {
    writeFileSync(join(siteDir, 'index.html'), rewritten);
  }
}

// Rewrite relative links in docs/api.html for flattened site/ root.
const rawApiHtml = readFileSync(apiHtmlPath, 'utf8');
const rewrittenApiHtml = rawApiHtml
  .replace(/href="\.\.\/examples\/([^"]+\.html(?:#[^"]*)?)"/g, 'href="./$1"')
  .replace(/href="\.\.\/examples\/([^"]+\.mjs)"/g, 'href="./examples/$1"')
  .replace(/href="\.\.\/dist\/([^"]+)"/g, 'href="./dist/$1"')
  .replaceAll('href="../README.md"', 'href="./README.md"')
  .replaceAll('href="../CHANGELOG.md"', 'href="./CHANGELOG.md"');
writeFileSync(join(siteDir, 'api.html'), rewrittenApiHtml);

const globalSizeKb = (statSync(join(siteDir, 'dist', 'vecbridge.global.js')).size / 1024).toFixed(1);
console.log(
  `site/ assembled (${htmlCount} demo pages + index.html + api.html, ${distFiles} dist files, vecbridge.global.js ${globalSizeKb} kB)`
);
