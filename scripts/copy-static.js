/**
 * Vercel build: copy static site files into dist/ so the deployment
 * output always includes css, js, images, videos, and HTML.
 * Run: npm run build
 */
'use strict';

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const out = path.join(root, 'dist');
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
  console.log('[copy-static]', dir, '-> dist/' + dir);
}

const optional = ['.hintrc', 'favicon.ico', 'robots.txt'];
for (const name of optional) {
  const p = path.join(root, name);
  if (fs.existsSync(p)) {
    fs.copyFileSync(p, path.join(out, name));
  }
}

console.log('[copy-static] done. HTML files:', htmlCount, '->', out);
