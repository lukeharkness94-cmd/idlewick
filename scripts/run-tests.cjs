#!/usr/bin/env node
/* Idlewick: run the whole test suite safely and quickly (26 Nov 2026).
   Why: the suite took over an hour one test at a time, and two runs on the same machine broke each other because every
   browser test talked to the one preview server on port 8765 (one run's rebuild or shutdown failed the other's tests).
   This runner gives each run its own preview server on a free port, points every test at it through IDLEWICK_URL and
   its own SHOT_DIR, and runs several test files at once.

   Usage:
     node scripts/run-tests.cjs                 every test in tests/ (helpers named *harness* are skipped)
     node scripts/run-tests.cjs ui- shop        only files whose names contain one of these words
     node scripts/run-tests.cjs --jobs 2        how many test files at once (default: half the CPU cores, 2 to 4)
     node scripts/run-tests.cjs --timeout 900   seconds before one test file is stopped (default 600)
     node scripts/run-tests.cjs --no-build      skip rebuilding Play Idlewick.html first
     node scripts/run-tests.cjs --no-retry      don't rerun failures by themselves at the end
   Failures are run once more by themselves at the end (some browser tests time animations and fail only on a busy
   machine); one that passes alone is reported as flaky, separately from plain passes. Exit code 0 when nothing
   failed both times. Each test's full output is kept in the run's log folder (printed
   at the start and end); the summary shows the last lines of every failure. Slowest tests start first, using the
   durations remembered from earlier runs on this machine (in the OS temp folder, never in the repository).
   Uses Node built-ins only; the browser tests use Playwright's bundled Chromium unless CHROMIUM_PATH is set. */
const { spawn, spawnSync } = require('node:child_process');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path'), net = require('node:net'), http = require('node:http');

const ROOT = path.resolve(__dirname, '..');
const args = process.argv.slice(2), flag = (name, dflt) => { const i = args.indexOf(name); if (i < 0) return dflt; const v = args[i + 1]; args.splice(i, 2); return v; };
const noBuild = args.includes('--no-build'); if (noBuild) args.splice(args.indexOf('--no-build'), 1);
const noRetry = args.includes('--no-retry'); if (noRetry) args.splice(args.indexOf('--no-retry'), 1);
const cores = os.cpus().length || 2;
const jobs = Math.max(1, +flag('--jobs', Math.min(4, Math.max(2, Math.floor(cores / 2)))));
const timeoutS = +flag('--timeout', 600);
const words = args.filter(a => !a.startsWith('--'));
const python = process.platform === 'win32' ? 'py' : 'python3';

const all = fs.readdirSync(path.join(ROOT, 'tests')).filter(f => f.endsWith('.cjs') && !f.includes('harness')).sort();
const picked = words.length ? all.filter(f => words.some(w => f.includes(w))) : all;
if (!picked.length) { console.error('No tests match ' + words.join(', ')); process.exit(2); }

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const logDir = path.join(os.tmpdir(), 'idlewick-tests', stamp); fs.mkdirSync(logDir, { recursive: true });
const shotDir = path.join(logDir, 'shots'); fs.mkdirSync(shotDir, { recursive: true });
const timesFile = path.join(os.tmpdir(), 'idlewick-test-times.json');
let times = {}; try { times = JSON.parse(fs.readFileSync(timesFile, 'utf8')); } catch (e) { /* first run on this machine */ }

const freePort = () => new Promise((res, rej) => { const s = net.createServer(); s.unref(); s.on('error', rej); s.listen(0, '127.0.0.1', () => { const { port } = s.address(); s.close(() => res(port)); }); });
const up = url => new Promise(res => { const req = http.get(url, r => { r.resume(); res(r.statusCode === 200); }); req.on('error', () => res(false)); req.setTimeout(3000, () => { req.destroy(); res(false); }); });
const fmt = ms => ms >= 60000 ? `${Math.floor(ms / 60000)}m ${Math.round(ms % 60000 / 1000)}s` : `${(ms / 1000).toFixed(1)}s`;

let server = null; const running = new Set();
const cleanup = () => { for (const c of running) { try { c.kill('SIGKILL'); } catch (e) { /* already gone */ } } if (server) { try { server.kill('SIGTERM'); } catch (e) { /* already gone */ } } };
process.on('SIGINT', () => { cleanup(); process.exit(130); }); process.on('SIGTERM', () => { cleanup(); process.exit(143); });

(async () => {
  const t0 = Date.now();
  if (!noBuild) { const b = spawnSync(python, ['scripts/package-game.py'], { cwd: ROOT, encoding: 'utf8' }); if (b.status !== 0) { console.error('Build failed:\n' + b.stdout + b.stderr); process.exit(2); } }
  const port = await freePort(), base = `http://127.0.0.1:${port}/`;
  server = spawn(python, ['scripts/preview.py', '--port', String(port)], { cwd: ROOT, stdio: ['ignore', fs.openSync(path.join(logDir, '_preview.txt'), 'w'), fs.openSync(path.join(logDir, '_preview.txt'), 'a')] });
  for (let i = 0; i < 60 && !(await up(base)); i++) await new Promise(r => setTimeout(r, 250));
  if (!(await up(base))) { console.error(`Preview server did not start on port ${port}; see ${logDir}/_preview.txt`); cleanup(); process.exit(2); }
  console.log(`Idlewick tests: ${picked.length} files, ${jobs} at a time, preview ${base}\nLogs: ${logDir}\n`);

  /* slowest first, so the run doesn't end waiting on one long test */
  const queue = [...picked].sort((a, b) => (times[b] || 30000) - (times[a] || 30000));
  const results = [];
  const runOne = file => new Promise(res => {
    const start = Date.now(), out = fs.openSync(path.join(logDir, file + '.txt'), 'w');
    const env = { ...process.env, IDLEWICK_URL: base, SHOT_DIR: shotDir };
    const child = spawn(process.execPath, [path.join('tests', file)], { cwd: ROOT, env, stdio: ['ignore', out, out] }); running.add(child);
    let timedOut = false; const timer = setTimeout(() => { timedOut = true; child.kill('SIGKILL'); }, timeoutS * 1000);
    child.on('exit', code => { clearTimeout(timer); running.delete(child); fs.closeSync(out); const ms = Date.now() - start; times[file] = ms;
      const ok = code === 0 && !timedOut; results.push({ file, ok, ms, timedOut, code });
      console.log(`${ok ? 'pass' : 'FAIL'}  ${file.padEnd(40)} ${fmt(ms).padStart(8)}${timedOut ? '  (timed out)' : ''}   [${results.length}/${picked.length}]`); res(); });
  });
  const workers = Array.from({ length: Math.min(jobs, queue.length) }, async () => { while (queue.length) await runOne(queue.shift()); });
  await Promise.all(workers);
  /* a few browser tests time animations and pop-ups and can fail only because the machine is busy: each failure is run
     once more by itself; one that then passes is reported as flaky, never silently counted as a plain pass */
  const firstFails = results.filter(r => !r.ok).map(r => r.file), flaky = [];
  if (firstFails.length && !noRetry) {
    console.log(`\nRunning ${firstFails.length} failure${firstFails.length > 1 ? 's' : ''} again, one at a time:`);
    for (const file of firstFails) { const before = results.findIndex(r => r.file === file), old = results.splice(before, 1)[0];
      fs.renameSync(path.join(logDir, file + '.txt'), path.join(logDir, file + '.first-try.txt'));
      await runOne(file); const now = results[results.length - 1]; if (now.ok) { now.flaky = true; flaky.push(file); } else now.firstTry = old; }
  }
  cleanup();
  try { fs.writeFileSync(timesFile, JSON.stringify(times)); } catch (e) { /* durations are only an ordering hint */ }

  const failed = results.filter(r => !r.ok).sort((a, b) => a.file.localeCompare(b.file));
  const summary = `${results.length - failed.length - flaky.length} passed, ${flaky.length} flaky (failed alongside others, passed alone), ${failed.length} failed, in ${fmt(Date.now() - t0)} (${jobs} at a time).`;
  console.log('\n' + summary); if (flaky.length) console.log('Flaky: ' + flaky.join(', ') + `  (first-try output: *.first-try.txt in the log folder)`);
  try { fs.writeFileSync(path.join(logDir, 'summary.txt'), [summary, ...results.map(r => `${r.ok ? (r.flaky ? 'flaky' : 'pass') : 'FAIL'}\t${r.file}\t${fmt(r.ms)}`)].join('\n') + '\n'); } catch (e) { /* the console has it */ }
  for (const r of failed) { const text = fs.readFileSync(path.join(logDir, r.file + '.txt'), 'utf8').trim().split('\n').filter(l => !/^\s+at /.test(l)); console.log(`\n--- ${r.file}${r.timedOut ? ` (stopped after ${timeoutS}s)` : ` (exit ${r.code})`}\n` + text.slice(-12).join('\n')); }
  console.log(`\nFull output: ${logDir}`);
  process.exit(failed.length ? 1 : 0);
})().catch(e => { console.error(e); cleanup(); process.exit(2); });
