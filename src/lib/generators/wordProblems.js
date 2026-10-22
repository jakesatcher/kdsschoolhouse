'use strict';

// Word problems are written as small scenes, not number templates. Every scene picks quantities from ranges that are
// believable for the thing being counted (a school bus carries up to ~70 students, a bag holds a handful of apples),
// and grade level changes the *kind* of scene and the operations, not just how big the numbers get.
const { int, pick, shuffle } = require('./rng');
const F = require('./fractions');
const { fmt } = require('./math');

// The six main characters, with the genders they were given, so narration can use he/she correctly.
// Names outside this set are only for stories that need more than six people (none do today) and are randomized.
const NAMES = ['Zach', 'AC', 'Screech', 'Kelly', 'Lisa', 'Jessie'];
const EXTRA_NAMES = ['Mia', 'Leo', 'Ava', 'Sam', 'Zoe', 'Max', 'Ella', 'Ben', 'Lily', 'Noah', 'Ruby', 'Eli'];
const GENDER = { Zach: 'm', AC: 'm', Screech: 'm', Kelly: 'f', Lisa: 'f', Jessie: 'f' };
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

class Person {
  constructor(name) {
    const m = GENDER[name] === 'm';
    this.name = name;
    this.s = m ? 'he' : 'she'; // subject
    this.o = m ? 'him' : 'her'; // object
    this.p = m ? 'his' : 'her'; // possessive
    this.self = m ? 'himself' : 'herself';
    this.S = cap(this.s);
    this.P = cap(this.p);
  }

  toString() { return this.name; } // so `${A}` prints the name
}

const ORD = ['', 'first', 'second', 'third', 'fourth', 'fifth'];
const cents = (c) => `$${(c / 100).toFixed(2)}`;
const dec = (v, places) => (v / 10 ** places).toFixed(places);

function ctx(rng) {
  const [a, b, c] = shuffle(rng, NAMES);
  return { A: new Person(a), B: new Person(b), C: new Person(c), extraName: () => pick(rng, EXTRA_NAMES) };
}

// Scene: { id, ops, kind:'whole'|'decimal'|'fraction', steps (calculations), level:1|2, grades:[min,max], make(r, c, g) -> { text, answerText } }
const T = [];
const t = (def) => T.push({ level: 1, ...def }); // level 1 = standard, 2 = challenge

const OPS = ['add', 'sub', 'mul', 'div', 'mixed'];
const KINDS = ['whole', 'decimal', 'fraction', 'mixed'];
const STEPS = ['single', 'multi', 'mixed'];
const LEVELS = ['mixed', 'standard', 'challenge'];

const { makeRng } = require('./rng');
const makeRngFor = (g) => makeRng(g * 7919 + 11);
const H = { int, pick, shuffle, F, fmt, cents, dec, cap, ORD, EXTRA_NAMES };
require('./wpWhole')(t, H);
require('./wpMoney')(t, H);
require('./wpFractions')(t, H);
require('./wpSituations')(t, H);

// Older scenes that are told in a classroom (school, class, teacher, cafeteria ...) are flagged so the sheets lean on real-life
// scenarios; they are only used when nothing else fits the teacher's choices.
const SCHOOL = /\b(school|classroom|class|classes|teacher|recess|cafeteria|principal|homework|students?|library|playground|bake sale|lunch|field trip|science fair|field day|spelling|book fair|pep rally|recess)\b/i;
for (const x of T) {
  if (x.id.startsWith('sit-')) continue;
  for (let g = x.grades[0]; g <= x.grades[1] && !x.school; g++) { try { const r = makeRngFor(g); if (SCHOOL.test(x.make(r, ctx(r), g).text)) x.school = true; } catch { /* ignore */ } }
}

function pool({ grade, op, kind, steps, level = 'mixed' }, withSchool = false) {
  return T.filter(
    (x) =>
      (withSchool || !x.school) &&
      grade >= x.grades[0] && grade <= x.grades[1] &&
      (level === 'mixed' || x.level === (level === 'challenge' ? 2 : 1)) &&
      (kind === 'mixed' || x.kind === kind) &&
      (op === 'mixed' || x.ops.includes(op)) &&
      (steps === 'mixed' || (steps === 'single' ? x.steps === 1 : x.steps > 1))
  );
}

function wordProblems(rng, { grade = 3, op = 'mixed', kind = 'whole', steps = 'mixed', level = 'mixed', count = 10 }) {
  let available = pool({ grade, op, kind, steps, level });
  if (available.length < 6) available = pool({ grade, op, kind, steps, level }, true); // too few real-life scenes for these choices: bring the classroom ones back
  if (!available.length) return { problems: [], error: 'No word problems match those choices for this grade. Try a different grade, number type or step setting.' };
  H.sit.used.clear();
  const out = [];
  const seen = new Set();
  let deck = [];
  let guard = 0;
  while (out.length < count && guard++ < count * 40) {
    // Walk a shuffled deck of scenes so a sheet uses as many different stories as possible before repeating one.
    // the situation-based scenes (real-life contexts, many formats) are dealt twice as often as the older ones
    if (deck.length === 0) deck = shuffle(rng, available.flatMap((x) => (x.id.startsWith('sit-') ? [x, x] : [x])));
    const tpl = deck.pop();
    let p;
    try { p = tpl.make(rng, ctx(rng), grade); } catch { continue; } // a scene that cannot be built from these numbers is skipped
    if (seen.has(p.text)) continue;
    seen.add(p.text);
    out.push({ text: p.text, answerText: p.answerText, steps: tpl.steps, kind: tpl.kind, level: tpl.level, id: tpl.id, ...(p.table ? { table: p.table } : {}), ...(p.parts ? { parts: p.parts } : {}), ...(p.choices ? { choices: p.choices } : {}), ...(p.note ? { note: p.note } : {}), ...(p.explain ? { explain: true } : {}), ...(p.meta ? { meta: p.meta } : {}) });
  }
  return { problems: out, error: null };
}

module.exports = { wordProblems, pool, ctx, OPS, KINDS, STEPS, LEVELS, TEMPLATES: T, NAMES, EXTRA_NAMES, GENDER };
