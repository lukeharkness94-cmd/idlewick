/* node tests/regression.cjs — deterministic engine and persistence regression checks. */
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
function harness(desktopStorage) {
  const storage = new Map(), listeners = {}, ui = { V: {}, DO: {}, B: {}, homeSections: [], homeAfterCurrent: [], tabState: () => null, render() {}, detail() {}, selbarHtml() {} };
  let denied = false, seed = 7;
  const math = Object.create(Math);
  math.random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const element = () => ({ setAttribute() {}, classList: { add() {}, remove() {}, toggle() {} }, appendChild() {}, style: {}, querySelector() {}, querySelectorAll: () => [], addEventListener() {} });
  const context = vm.createContext({
    idlewickDesktop: desktopStorage ? {storage:desktopStorage} : undefined,
    console, Math: math, Date, JSON, performance: { now: () => 0 },
    setTimeout: () => 0, setInterval: () => 0, clearTimeout() {},
    addEventListener: (name, fn) => { listeners[name] = fn; },
    matchMedia: () => ({ matches: false }), innerWidth: 1200, innerHeight: 800,
    btoa: s => Buffer.from(s, 'binary').toString('base64'), atob: s => Buffer.from(s, 'base64').toString('binary'),
    escape, unescape,
    localStorage: {
      getItem: k => { if (denied) throw Error('denied'); return storage.get(k) || null; },
      setItem: (k, v) => { if (denied) throw Error('denied'); storage.set(k, v); },
      removeItem: k => storage.delete(k)
    },
    document: { querySelector: () => null, querySelectorAll: () => [], getElementById: () => null, createElement: element, body: element(), addEventListener() {} }
  });
  context.window = context;
  const load = name => vm.runInContext(fs.readFileSync(path.join(__dirname, '../js', name + '.js'), 'utf8'), context, { filename: name });
  ['util', 'data', 'data2', 'data3', 'economy', 'state', 'audio'].forEach(load);
  const q = context.DQ;
  q.notify = q.pulse = q.floatAt = q.flash = q.burstAt = q.burstEl = q.toast = q.go = () => {};
  ['engine', 'systems', 'plan', 'meta', 'mastery'].forEach(load);
  q.ui = ui; q.tips = { item: () => '' }; q.goals = () => [];
  ['research', 'journey', 'onboarding'].forEach(load);
  q.S = q.newState(); q.fxDirty();
  return { q, load, storage, listeners, deny: value => { denied = value; } };
}

module.exports = { harness };
