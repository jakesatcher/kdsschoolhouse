'use strict';

// Builds worksheet data from a path + query. Used by the live routes, by Favorites / Print Later (which re-build a
// saved sheet from its URL), and by batch printing. Every parameter is whitelisted or range-checked here.
const querystring = require('querystring');
const { oneOf, intIn, flag, str } = require('./params');
const { makeRng } = require('./generators/rng');
const math = require('./generators/math');
const wp = require('./generators/wordProblems');
const { phonics } = require('./generators/phonics');
const { sightWords } = require('./generators/sight');
const { writing, TYPES: WRITING_TYPES } = require('./generators/writing');

const MATH_TYPES = { addition: 'Addition', subtraction: 'Subtraction', multiplication: 'Multiplication', division: 'Division', 'word-problems': 'Word Problems' };

const WORKSHEET_RE = [
  /^\/math\/(addition|subtraction|multiplication|division|word-problems)\/worksheet$/,
  /^\/reading\/phonics\/worksheet$/,
  /^\/reading\/sight-words\/worksheet$/,
  /^\/writing\/worksheet$/,
];
const isSheetPath = (p) => WORKSHEET_RE.some((re) => re.test(p));

const validSeed = (q) => intIn(q.seed, 1, 2147483647, 0);
const newSeed = () => Math.floor(Math.random() * 2147483646) + 1;

// Print sizing for vertical/horizontal math sheets. Each step must match an `ol.problems.fit-*` rule in app.css
// (lh = line height px, space = answer space under the rule). We pick the roomiest step whose rows fit the page.
const FITS = [
  { id: 'a', lh: 30, space: 34 }, { id: 'b', lh: 26, space: 22 }, { id: 'c', lh: 23, space: 14 },
  { id: 'd', lh: 20, space: 10 }, { id: 'e', lh: 18, space: 8 }, { id: 'f', lh: 15, space: 5 },
];
const PRINT_BUDGET_PX = 820;
const digitLabel = (v, mixedText) => (v === 'mixed' ? `${mixedText}-digit` : `${v}-digit`); // usable height for the problem grid on Letter with 0.5in margins, after the header
function fitsOnPage(lines, count, layout) {
  const cols = layout === 'horizontal' ? 2 : 4;
  const rows = Math.ceil(count / cols);
  const rowHeight = (f) => (layout === 'horizontal' ? f.lh + 10 : lines * f.lh + f.space + 8);
  const f = FITS.find((x) => rows * rowHeight(x) <= PRINT_BUDGET_PX);
  return f ? f.id : null;
}
const fitFor = (lines, count, layout) => fitsOnPage(lines, count, layout) || FITS[FITS.length - 1].id;

// Multi-digit problems ask for extra work lines. If the page is too full for that (e.g. 50 long-division problems),
// trim the work space until everything fits on one page; the problems themselves are never dropped.
function fitSheet(problems, layout) {
  const want = Math.max(0, ...problems.map((p) => p.work || 0));
  for (let cap = want; cap >= 0; cap--) {
    const id = fitsOnPage(2 + cap, problems.length, layout);
    if (id) {
      problems.forEach((p) => { if (p.work > cap) p.work = cap; });
      return id;
    }
  }
  return FITS[FITS.length - 1].id;
}

function build(pathname, q) {
  const seed = validSeed(q) || newSeed();
  const rng = makeRng(seed);
  let m;

  if ((m = /^\/math\/([a-z-]+)\/worksheet$/.exec(pathname)) && MATH_TYPES[m[1]]) {
    const type = m[1];
    const grade = intIn(q.grade, 1, 5, 3);
    const meta = { subject: 'math', kind: type, title: `${MATH_TYPES[type]} Worksheet`, formPath: `/math/${type}`, seed };
    const base = { title: meta.title, seed, includeKey: flag(q.key, true), layout: oneOf(q.layout, ['vertical', 'horizontal'], 'vertical') };
    if (type === 'addition' || type === 'subtraction') {
      const digits = intIn(q.digits, 2, 7, 2);
      const count = intIn(q.count, 5, 50, 20);
      const regroup = oneOf(q.regroup, ['always', 'any'], 'always');
      const problems = type === 'addition'
        ? math.addition(rng, { digits, count, addends: intIn(q.addends, 2, 3, 2), regroup })
        : math.subtraction(rng, { digits, count, regroup });
      const subtitle = `${digits}-digit ${type}${regroup === 'any' ? '' : ' with regrouping'}`;
      return { ...meta, subtitle, partial: 'math', locals: { ...base, subtitle, digits, problems, fit: fitFor(Math.max(...problems.map((p) => p.operands.length)), problems.length, base.layout) } };
    }
    if (type === 'multiplication') {
      const mode = oneOf(q.mode, ['facts', 'multi', 'mixed'], 'facts');
      const factor = oneOf(q.factor, ['all', ...Array.from({ length: 13 }, (_, i) => i)], 'all');
      const top = oneOf(q.top, ['1', '2', '3', '4', 'mixed'], '2');
      const bottom = oneOf(q.bottom, ['1', '2', 'mixed'], '1');
      const problems = math.multiplication(rng, { mode, factor, top, bottom, count: intIn(q.count, 5, 60, 30) });
      const subtitle = mode === 'multi' ? `Multiplication: ${digitLabel(top, '1 to 4')} number × ${digitLabel(bottom, '1 to 2')} number`
        : mode === 'mixed' ? 'Mixed multiplication' : factor === 'all' ? 'Multiplication facts 0-12 (mixed)' : `Multiplication facts: ${factor}s`;
      return { ...meta, subtitle, partial: 'math', locals: { ...base, subtitle, digits: mode === 'facts' ? 2 : 3, problems, fit: fitSheet(problems, base.layout) } };
    }
    if (type === 'division') {
      const mode = oneOf(q.mode, ['facts', 'multi', 'mixed'], 'facts');
      const divisor = oneOf(q.divisor, ['all', ...Array.from({ length: 12 }, (_, i) => i + 1)], 'all');
      const dividend = oneOf(q.dividend, ['2', '3', '4', 'mixed'], '3');
      const vdigits = oneOf(q.vdigits, ['1', '2', 'mixed'], '1');
      const remainders = oneOf(q.remainders, ['none', 'with', 'mixed'], 'mixed');
      const problems = math.division(rng, { mode, divisor, dividend, vdigits, remainders, count: intIn(q.count, 5, 60, 30) });
      const remText = { none: 'no remainders', with: 'with remainders', mixed: 'with and without remainders' }[remainders];
      const subtitle = mode === 'multi' ? `Division: ${digitLabel(dividend, '2 to 4')} dividend ÷ ${digitLabel(vdigits, '1 to 2')} divisor, ${remText}`
        : mode === 'mixed' ? 'Mixed division (with remainders)' : divisor === 'all' ? 'Division facts 0-12 (mixed)' : `Division facts: divide by ${divisor}`;
      return { ...meta, subtitle, partial: 'math', locals: { ...base, subtitle, digits: mode === 'facts' ? 2 : 4, problems, fit: fitSheet(problems, base.layout) } };
    }
    const result = wp.wordProblems(rng, { grade, op: oneOf(q.op, wp.OPS, 'mixed'), kind: oneOf(q.kind, wp.KINDS, 'whole'), steps: oneOf(q.steps, wp.STEPS, 'mixed'), count: intIn(q.count, 3, 20, 10) });
    if (result.error) return { ...meta, error: result.error };
    const subtitle = `Grade ${grade} word problems`;
    return { ...meta, subtitle, partial: 'words', locals: { ...base, subtitle, problems: result.problems } };
  }

  if (pathname === '/reading/phonics/worksheet') {
    // New forms send category + subtype; older saved links send type=category/subtype.
    const legacy = str(q.type).split('/');
    const category = str(q.category) || legacy[0];
    const sub = str(q.category) ? str(q.subtype) : legacy[1];
    const result = phonics(rng, { category, subtype: sub || 'all', count: 20, mix: oneOf(q.mix, ['mixed', 'real', 'nonsense'], 'mixed') });
    const meta = { subject: 'reading', kind: 'phonics', title: 'Phonics Worksheet', formPath: '/reading/phonics', seed };
    if (result.error) return { ...meta, error: result.error };
    const subtitle = result.category.name + (result.subtypeName !== 'All' ? ` — ${result.subtypeName}` : '');
    return { ...meta, subtitle, partial: 'phonics', locals: { title: meta.title, seed, subtitle, result, format: oneOf(q.format, ['list', 'write'], 'list'), markNonsense: flag(q.mark, true), includeKey: flag(q.key, true) } };
  }

  if (pathname === '/reading/sight-words/worksheet') {
    const result = sightWords(rng, { list: str(q.list), count: oneOf(q.count, ['all', '10', '20', '30'], 'all'), order: oneOf(q.order, ['alphabetical', 'random'], 'alphabetical') });
    const meta = { subject: 'reading', kind: 'sight-words', title: 'Sight Words Worksheet', formPath: '/reading/sight-words', seed };
    if (result.error) return { ...meta, error: result.error };
    const subtitle = `${result.list.name} sight words`;
    return { ...meta, subtitle, partial: 'sight', locals: { title: meta.title, seed, subtitle, result, format: oneOf(q.format, ['list', 'cards', 'trace'], 'list') } };
  }

  if (pathname === '/writing/worksheet') {
    const grade = intIn(q.grade, 1, 5, 2);
    const type = oneOf(q.type, WRITING_TYPES, 'opinion');
    const sheet = writing(rng, { type, grade, count: intIn(q.count, 1, 4, 2), lines: intIn(q.lines, 4, 14, 8) });
    const subtitle = `Grade ${grade} · ${type} writing`;
    return { subject: 'writing', kind: 'writing', title: 'Writing Worksheet', formPath: '/writing', seed, subtitle, partial: 'writing', locals: { title: 'Writing Worksheet', seed, subtitle, sheet } };
  }
  return null;
}

// Re-builds a sheet from a stored URL. Returns null unless the URL is a pinned (seeded) worksheet we recognise.
function fromUrl(url) {
  if (typeof url !== 'string' || url.length > 600 || !url.startsWith('/') || url.startsWith('//')) return null;
  const [pathname, search = ''] = url.split('?');
  if (!isSheetPath(pathname)) return null;
  const q = querystring.parse(search);
  if (!validSeed(q)) return null;
  const built = build(pathname, q);
  if (!built || built.error) return null;
  return { built, url: `${pathname}?${search}` };
}

module.exports = { fitFor, fitSheet, FITS, build, fromUrl, isSheetPath, validSeed, newSeed, MATH_TYPES, WRITING_TYPES };
