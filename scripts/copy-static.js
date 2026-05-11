/**
 * Copy static site assets into an output directory for hosts that deploy a folder (e.g. Vercel `public/`).
 * Default output: `public/` — matches Vercel's default Output Directory for static projects.
 * Override: STATIC_OUTPUT_DIR=dist npm run build:dist
 */
'use strict';

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const outDirName = process.env.STATIC_OUTPUT_DIR || 'public';
const out = path.join(root, outDirName);
const copyDirs = ['css', 'js', 'images', 'videos'];

if (Number(process.versions.node.split('.')[0]) < 16) {
  console.error('Node 16+ required for fs.cpSync');
  process.exit(1);
}

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

let htmlCount = 0;
for (const name of fs.readdirSync(root)) {
  if (!name.endsWith('.html')) continue;
  fs.copyFileSync(path.join(root, name), path.join(out, name));
  htmlCount++;
}

for (const dir of copyDirs) {
  const src = path.join(root, dir);
  const dest = path.join(out, dir);
  if (!fs.existsSync(src)) {
    console.warn('[copy-static] skip (missing):', dir);
    continue;
  }
  fs.cpSync(src, dest, { recursive: true });
  console.log('[copy-static]', dir, '->', outDirName + '/' + dir);
}

const optional = ['.hintrc', 'favicon.ico', 'robots.txt'];
for (const name of optional) {
  const p = path.join(root, name);
  if (fs.existsSync(p)) {
    fs.copyFileSync(p, path.join(out, name));
  }
}

console.log('[copy-static] done. HTML files:', htmlCount, '->', outDirName + '/');
