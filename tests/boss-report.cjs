const assert = require('node:assert/strict');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const simulator = path.join(__dirname, '..', 'scripts', 'sim-bosses.cjs');
const report = only => execFileSync(process.execPath, [simulator, '--report'], {
  encoding: 'utf8',
  env: { ...process.env, ONLY: only, NO_PERKS: '' }
});

const grubnash = report('grubnash');
assert.match(grubnash, /^## Grubnash · Combat 8$/m);
assert.equal(grubnash, report('grubnash'));
const entries = grubnash.split('\n').filter(line => /^\| (Melee|Ranged|Magic) \|/.test(line));
assert.equal(entries.filter(line => line.includes('| General |')).length, 3);
for (const line of entries) {
  assert.match(line, /^\| (Melee|Ranged|Magic) \| 8 \|/);
  assert.match(line, /\| \d+\/24 \(\d+%\) \|/);
}
assert.match(grubnash, /\| Melee \| 8 \| Counter \| .* \| crush \(weak 1\/1\) .*\d+\/24 .* food, .* s \|/);
assert.doesNotMatch(grubnash, /^## Old Tusk/m);
console.log('PASS Combat 8 in all three styles, 24 trials per row, matched crush control, boss filter and repeatable output');
