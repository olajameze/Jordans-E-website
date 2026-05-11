/**
 * Materializes Git LFS files in the build working tree before Vercel uploads static assets.
 * If deployments serve pointer text instead of binary MP4s, videos fail in the browser.
 *
 * On Vercel, also enable: Project → Settings → Git → Git Large File Storage.
 * @see https://vercel.com/changelog/git-lfs-support
 */
const { execSync, spawnSync } = require('child_process');

const onVercel = process.env.VERCEL === '1';

function run(cmd) {
  execSync(cmd, { stdio: 'inherit', env: process.env });
}

function hasGitLfs() {
  const r = spawnSync('git', ['lfs', 'version'], { encoding: 'utf8' });
  return r.status === 0;
}

if (!hasGitLfs()) {
  const msg =
    'Git LFS is not available. On Vercel: Settings → Git → enable Git Large File Storage, then redeploy. Videos are stored with Git LFS in this repo.';
  if (onVercel) {
    console.error(msg);
    process.exit(1);
  }
  console.warn(msg + ' (continuing locally)');
  process.exit(0);
}

try {
  run('git lfs install');
  run('git lfs pull');
} catch (err) {
  const msg = 'Git LFS pull failed; MP4s may not deploy correctly.';
  if (onVercel) {
    console.error(msg);
    console.error(err);
    process.exit(1);
  }
  console.warn(msg, err && err.message);
  process.exit(0);
}
