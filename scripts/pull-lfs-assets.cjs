/**
 * Materializes Git LFS files in the build working tree before Vercel uploads static assets.
 * If deployments serve pointer text instead of binary MP4s, videos fail in the browser.
 *
 * On Vercel: Project → Settings → Git → enable Git Large File Storage.
 * `git lfs pull` often fails in CI (exit 2); we use fetch + checkout and fallbacks.
 * @see https://vercel.com/changelog/git-lfs-support
 */
const fs = require('fs');
const path = require('path');
const { execSync, spawnSync } = require('child_process');

const onVercel = process.env.VERCEL === '1';
const videoDir = path.join(__dirname, '..', 'videos');

const env = {
  ...process.env,
  GIT_TERMINAL_PROMPT: '0',
  /** Some CI shallow clones confuse LFS pull; allow explicit endpoint if needed */
  GIT_LFS_PROGRESS: '1',
};

function hasGitLfs() {
  return spawnSync('git', ['lfs', 'version'], { encoding: 'utf8' }).status === 0;
}

/** LFS pointer files start with this line (ASCII text) */
function fileLooksLikeLfsPointer(filePath) {
  const buf = Buffer.alloc(100);
  const fd = fs.openSync(filePath, 'r');
  try {
    const n = fs.readSync(fd, buf, 0, 100, 0);
    const s = buf.slice(0, n).toString('utf8');
    return s.startsWith('version https://git-lfs.github.com');
  } finally {
    fs.closeSync(fd);
  }
}

/** True if any sampled MP4 under /videos is still an LFS stub */
function needsMaterialize() {
  if (!fs.existsSync(videoDir)) return false;
  const names = fs.readdirSync(videoDir).filter((f) => /\.mp4$/i.test(f));
  if (names.length === 0) return false;
  for (const name of names.slice(0, 4)) {
    try {
      if (fileLooksLikeLfsPointer(path.join(videoDir, name))) return true;
    } catch {
      /* unreadable */
    }
  }
  return false;
}

function run(cmd) {
  execSync(cmd, { stdio: 'inherit', env, shell: true });
}

function tryRun(cmd) {
  const r = spawnSync(cmd, { env, shell: true, encoding: 'utf8' });
  if (r.status === 0) return true;
  if (r.stderr) process.stderr.write(r.stderr);
  if (r.stdout) process.stderr.write(r.stdout);
  return false;
}

if (!needsMaterialize()) {
  console.log('[pull-lfs-assets] Video files look like real MP4s (not LFS pointers). Nothing to do.');
  process.exit(0);
}

if (!hasGitLfs()) {
  const msg =
    '[pull-lfs-assets] Git LFS is not in PATH. Enable Git LFS for this project in Vercel (Settings → Git).';
  console.error(msg);
  process.exit(onVercel ? 1 : 0);
}

const branch = process.env.VERCEL_GIT_COMMIT_REF || 'main';
const sha = process.env.VERCEL_GIT_COMMIT_SHA || '';

console.log('[pull-lfs-assets] LFS pointers detected; materializing objects…');

try {
  run('git lfs install');

  const attempts = [
    sha && `git lfs fetch origin ${sha}`,
    `git lfs fetch origin ${branch}`,
    'git lfs fetch origin',
    'git lfs fetch --all',
    `git lfs pull origin ${branch}`,
    'git lfs pull',
  ].filter(Boolean);

  let fetched = false;
  for (const cmd of attempts) {
    console.log(`[pull-lfs-assets] Trying: ${cmd}`);
    if (tryRun(cmd)) {
      fetched = true;
      break;
    }
  }
  if (!fetched) {
    console.warn('[pull-lfs-assets] All fetch/pull variants failed; running checkout anyway.');
  }

  run('git lfs checkout');

  if (needsMaterialize()) {
    console.error(
      '[pull-lfs-assets] Videos are still LFS pointers after fetch/checkout. ' +
        'In Vercel: enable Settings → Git → Git Large File Storage, ensure the Git integration can reach GitHub LFS, and redeploy.'
    );
    process.exit(onVercel ? 1 : 0);
  }

  console.log('[pull-lfs-assets] LFS materialized successfully.');
} catch (err) {
  console.error('[pull-lfs-assets] Failed:', err);
  process.exit(onVercel ? 1 : 0);
}
