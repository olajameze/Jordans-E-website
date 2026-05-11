/**
 * Single entry point for Vercel and `npm run build`.
 * 1) Materialize Git LFS assets (videos) when pointers are present
 * 2) Copy the static site into public/
 * 3) Verify required files exist — fails the build if public/ is incomplete
 *
 * This prevents silent Vercel failures like "No Output Directory named public".
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.join(__dirname, '..');
const pub = path.join(root, 'public');

const REQUIRED_REL = [
  'index.html',
  'css/style.css',
  'js/script.js',
  'work.html',
];

function run(label, cmd) {
  console.log(`[vercel-build] ${label}…`);
  execSync(cmd, {
    cwd: root,
    stdio: 'inherit',
    env: process.env,
    shell: true,
  });
}

function verifyPublicOutput() {
  const missing = [];
  for (const rel of REQUIRED_REL) {
    const abs = path.join(pub, rel);
    if (!fs.existsSync(abs)) missing.push(`public/${rel}`);
  }
  if (missing.length > 0) {
    console.error('[vercel-build] OUTPUT CHECK FAILED. Missing:');
    missing.forEach((m) => console.error('  -', m));
    console.error(
      '\nDo not remove scripts/copy-static.js or change output without updating vercel.json "outputDirectory" and copy-static defaults.'
    );
    process.exit(1);
  }
  console.log('[vercel-build] Output OK: verified', REQUIRED_REL.length, 'paths under public/');
}

run('Git LFS (if needed)', 'node scripts/pull-lfs-assets.cjs');
run('Copy static site to public/', 'node scripts/copy-static.js');
verifyPublicOutput();
