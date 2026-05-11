/**
 * Materializes Git LFS files in the build working tree before Vercel uploads static assets.
 * If deployments serve pointer text instead of binary MP4s, videos fail in the browser.
 *
 * On Vercel: Project → Settings → Git → enable Git Large File Storage.
 * "failed to fetch some objects from ''" usually means origin URL is empty/invalid for batch API
 * (SSH without SSH keys, or bad/wrong lfs.url). We normalize origin to HTTPS and avoid --all.
 *
 * Do not set GIT_LFS_PROGRESS unless it is an absolute path to a log file.
 */
const fs = require('fs');
const path = require('path');
const { execSync, spawnSync } = require('child_process');

const onVercel = process.env.VERCEL === '1';
const videoDir = path.join(__dirname, '..', 'videos');

function buildEnv() {
  const e = { ...process.env, GIT_TERMINAL_PROMPT: '0' };
  delete e.GIT_LFS_PROGRESS;
  return e;
}

const env = buildEnv();

function hasGitLfs() {
  return spawnSync('git', ['lfs', 'version'], { encoding: 'utf8', env }).status === 0;
}

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

/** Single HTTPS .git URL for github.com (LFS batch needs a resolvable HTTP(S) endpoint). */
function normalizeGithubHttpsCloneUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const u = url.trim();
  if (!u) return '';

  const ssh = /^git@github\.com:([^/]+)\/([\s\S]+)$/;
  const sm = u.match(ssh);
  if (sm) {
    let repo = sm[2].replace(/\s+$/, '');
    if (!repo.endsWith('.git')) repo += '.git';
    return `https://github.com/${sm[1]}/${repo}`;
  }

  if (/^https:\/\/github\.com\//i.test(u)) {
    return u.endsWith('.git') ? u : `${u}.git`;
  }

  return u;
}

/**
 * Clear mistaken lfs.url; force origin to HTTPS so Git LFS derives https://…/info/lfs itself.
 * Setting lfs.url manually has caused "missing protocol" / fetch from '' on some CI images.
 */
function ensureSolidGithubOrigin() {
  const fromEnv = (process.env.VERCEL_GIT_REPOSITORY_URL || '').trim();
  const gr = spawnSync('git', ['remote', 'get-url', 'origin'], { encoding: 'utf8', env });
  const fromGit = gr.status === 0 ? gr.stdout.trim() : '';

  let httpsUrl = normalizeGithubHttpsCloneUrl(fromEnv) || normalizeGithubHttpsCloneUrl(fromGit);

  /** Last resort if Vercel omits env (rare): this repo’s public GitHub HTTPS clone URL. */
  if (!httpsUrl && onVercel) {
    httpsUrl = 'https://github.com/olajameze/Jordans-E-website.git';
    console.warn('[pull-lfs-assets] VERCEL_GIT_REPOSITORY_URL empty; using fallback origin URL.');
  }

  if (!httpsUrl || !httpsUrl.includes('github.com')) {
    console.warn(
      '[pull-lfs-assets] Cannot resolve HTTPS GitHub clone URL.',
      'VERCEL_GIT_REPOSITORY_URL=',
      fromEnv || '(empty)',
      'origin=',
      fromGit || '(missing)'
    );
    return false;
  }

  tryRun('git config --local --unset-all lfs.url 2>/dev/null');

  const hasOrigin =
    spawnSync('git', ['remote', 'get-url', 'origin'], { encoding: 'utf8', env }).status === 0;

  if (hasOrigin) {
    tryRun(`git remote set-url origin "${httpsUrl}"`);
  } else {
    tryRun(`git remote add origin "${httpsUrl}"`);
  }

  const check = spawnSync('git', ['remote', 'get-url', 'origin'], { encoding: 'utf8', env });
  console.log('[pull-lfs-assets] origin →', check.status === 0 ? check.stdout.trim() : '(failed)');
  return true;
}

if (!needsMaterialize()) {
  console.log('[pull-lfs-assets] Video files look like real MP4s (not LFS pointers). Nothing to do.');
  process.exit(0);
}

if (!hasGitLfs()) {
  console.error(
    '[pull-lfs-assets] Git LFS is not in PATH. Enable Git LFS in Vercel (Settings → Git).'
  );
  process.exit(onVercel ? 1 : 0);
}

const branch = process.env.VERCEL_GIT_COMMIT_REF || 'main';
const sha = process.env.VERCEL_GIT_COMMIT_SHA || '';

console.log('[pull-lfs-assets] LFS pointers detected; materializing objects…');

try {
  run('git lfs install');

  if (onVercel && !ensureSolidGithubOrigin()) {
    console.error('[pull-lfs-assets] Aborted: could not configure origin for GitHub LFS.');
    process.exit(1);
  }

  const attempts = [
    sha && `git lfs fetch origin ${sha}`,
    `git lfs fetch origin ${branch}`,
    'git lfs fetch origin',
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
        'Confirm VERCEL_GIT_REPOSITORY_URL in the build (Vercel injects it for Git-connected projects). ' +
        'Enable Settings → Git → Git Large File Storage and redeploy.'
    );
    process.exit(onVercel ? 1 : 0);
  }

  console.log('[pull-lfs-assets] LFS materialized successfully.');
} catch (err) {
  console.error('[pull-lfs-assets] Failed:', err);
  process.exit(onVercel ? 1 : 0);
}
