'use strict';

// Builds worksheet data from a path + query. Used by the live routes, by Favorites / Print Later (which re-build a
// saved sheet from its URL), and by batch printing. Every parameter is whitelisted or range-checked here.
const querystring = require('querystring');
const { oneOf, intIn, flag, str } = require('./params');
const { makeRng } = require('./generators/rng');
const math = require('./generators/math');
const { decimals } = require('./generators/decimals');
const { fractionProblems } = require('./generators/fractionProblems');
const wp = require('./generators/wordProblems');
const { phonics } = require('./generators/phonics');
const { sightWords } = require('./generators/sight');
const { writing, TYPES: WRITING_TYPES } = require('./generators/writing');

const MATH_TYPES = { addition: 'Addition', subtraction: 'Subtraction', multiplication: 'Multiplication', division: 'Division', decimals: 'Decimals', fractions: 'Fractions', 'word-problems': 'Word Problems' };

const WORKSHEET_RE = [
  /^\/math\/(addition|subtraction|multiplication|division|decimals|fractions|word-problems)\/worksheet$/,
  /^\/reading\/phonics\/worksheet$/,
  /^\/reading\/sight-words\/worksheet$/,
  /^\/writing\/worksheet$/,
];
const isSheetPath = (p) => WORKSHEET_RE.some((re) => re.test(p));

const validSeed = (q) => intIn(q.seed, 1, 2147483647, 0);
const newSeed = () => Math.floor(Math.random() * 2147483646) + 1;

// Print layout: vertical sheets are 5 columns x 5 rows (25 problems per page), horizontal sheets 3 columns x 5 rows
// (15 per page). Longer sheets continue on more pages. These must match the grid rules in public/css/app.css.
const PER_PAGE = { vertical: 25, horizontal: 15 };
const digitLabel = (v, mixedText) => (v === 'mixed' ? `${mixedText}-digit` : `${v}-digit`);

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
      return { ...meta, subtitle, partial: 'math', locals: { ...base, subtitle, digits, problems, perPage: PER_PAGE[base.layout] } };
    }
    if (type === 'multiplication') {
      const mode = oneOf(q.mode, ['facts', 'multi', 'mixed'], 'facts');
      const factor = oneOf(q.factor, ['all', ...Array.from({ length: 13 }, (_, i) => i)], 'all');
      const top = oneOf(q.top, ['1', '2', '3', '4', 'mixed'], '2');
      const bottom = oneOf(q.bottom, ['1', '2', 'mixed'], '1');
      const special = flag(q.special, true);
      const problems = math.multiplication(rng, { mode, factor, top, bottom, special, count: intIn(q.count, 5, 60, 30) });
      const subtitle = (mode === 'multi' ? `Multiplication: ${digitLabel(top, '1 to 4')} number × ${digitLabel(bottom, '1 to 2')} number`
        : mode === 'mixed' ? 'Mixed multiplication' : factor === 'all' ? 'Multiplication facts 0-12 (mixed)' : `Multiplication facts: ${factor}s`) + (special ? '' : ' (no ×0 or ×1)');
      return { ...meta, subtitle, partial: 'math', locals: { ...base, subtitle, digits: mode === 'facts' ? 2 : 3, problems, perPage: PER_PAGE[base.layout] } };
    }
    if (type === 'division') {
      const mode = oneOf(q.mode, ['facts', 'multi', 'mixed'], 'facts');
      const divisor = oneOf(q.divisor, ['all', ...Array.from({ length: 12 }, (_, i) => i + 1)], 'all');
      const dividend = oneOf(q.dividend, ['2', '3', '4', 'mixed'], '3');
      const vdigits = oneOf(q.vdigits, ['1', '2', 'mixed'], '1');
      const remainders = oneOf(q.remainders, ['none', 'with', 'mixed'], 'mixed');
      const special = flag(q.special, true);
      const problems = math.division(rng, { mode, divisor, dividend, vdigits, remainders, special, count: intIn(q.count, 5, 60, 30) });
      const remText = { none: 'no remainders', with: 'with remainders', mixed: 'with and without remainders' }[remainders];
      const subtitle = (mode === 'multi' ? `Division: ${digitLabel(dividend, '2 to 4')} dividend ÷ ${digitLabel(vdigits, '1 to 2')} divisor, ${remText}`
        : mode === 'mixed' ? 'Mixed division (with remainders)' : divisor === 'all' ? 'Division facts 0-12 (mixed)' : `Division facts: divide by ${divisor}`) + (special ? '' : ' (no ÷1 or ÷10)');
      return { ...meta, subtitle, partial: 'math', locals: { ...base, subtitle, digits: mode === 'facts' ? 2 : 4, problems, perPage: PER_PAGE[base.layout] } };
    }
    if (type === 'decimals') {
      const op = oneOf(q.op, ['add', 'sub', 'mul', 'div'], 'add');
      const places = oneOf(q.places, ['1', '2', '3', 'mixed'], '2');
      const second = oneOf(q.second, ['whole', 'decimal', 'mixed'], 'whole');
      const digits = intIn(q.digits, 1, 4, op === 'add' || op === 'sub' ? 2 : 1);
      const problems = decimals(rng, { op, places, digits, second, addends: intIn(q.addends, 2, 3, 2), count: intIn(q.count, 5, 50, 20) });
      const placeText = { 1: 'tenths', 2: 'hundredths', 3: 'thousandths', mixed: 'tenths to thousandths' }[places];
      const verb = { add: 'addition', sub: 'subtraction', mul: 'multiplication', div: 'division' }[op];
      const subtitle = `Decimal ${verb} (${placeText})`;
      return { ...meta, subtitle, partial: 'math', locals: { ...base, subtitle, digits: digits + 4, problems, perPage: PER_PAGE[base.layout] } };
    }
    if (type === 'fractions') {
      const op = oneOf(q.op, ['add', 'sub', 'mul', 'div'], 'add');
      const den = oneOf(q.den, ['like', 'unlike', 'mixed'], 'unlike');
      const form = oneOf(q.form, ['proper', 'mixed', 'mix'], 'proper');
      // multiplying and dividing fractions are written across the page; adding and subtracting can be stacked
      const layout = op === 'add' || op === 'sub' ? base.layout : 'horizontal';
      const problems = fractionProblems(rng, { op, den, form, maxDen: intIn(q.maxden, 4, 20, 8), count: intIn(q.count, 5, 50, 20) });
      const verb = { add: 'addition', sub: 'subtraction', mul: 'multiplication', div: 'division' }[op];
      const subtitle = `Fraction ${verb} (${{ like: 'like denominators', unlike: 'unlike denominators', mixed: 'like and unlike denominators' }[den]}${form === 'mixed' ? ', mixed numbers' : form === 'mix' ? ', fractions and mixed numbers' : ''})`;
      return { ...meta, subtitle, partial: 'math', locals: { ...base, layout, subtitle, digits: 3, problems, perPage: PER_PAGE[layout] } };
    }
    const level = oneOf(q.level, wp.LEVELS, 'mixed');
    const result = wp.wordProblems(rng, { grade, level, op: oneOf(q.op, wp.OPS, 'mixed'), kind: oneOf(q.kind, wp.KINDS, 'whole'), steps: oneOf(q.steps, wp.STEPS, 'mixed'), count: intIn(q.count, 3, 20, 10) });
    if (result.error) return { ...meta, error: result.error };
    const subtitle = `Grade ${grade} word problems${level === 'challenge' ? ' (challenge)' : ''}`;
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

module.exports = { PER_PAGE, build, fromUrl, isSheetPath, validSeed, newSeed, MATH_TYPES, WRITING_TYPES };
