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

const H = { int, pick, shuffle, F, fmt, cents, dec, cap, ORD, EXTRA_NAMES };
require('./wpWhole')(t, H);
require('./wpMoney')(t, H);
require('./wpFractions')(t, H);

function pool({ grade, op, kind, steps, level = 'mixed' }) {
  return T.filter(
    (x) =>
      grade >= x.grades[0] && grade <= x.grades[1] &&
      (level === 'mixed' || x.level === (level === 'challenge' ? 2 : 1)) &&
      (kind === 'mixed' || x.kind === kind) &&
      (op === 'mixed' || x.ops.includes(op)) &&
      (steps === 'mixed' || (steps === 'single' ? x.steps === 1 : x.steps > 1))
  );
}

function wordProblems(rng, { grade = 3, op = 'mixed', kind = 'whole', steps = 'mixed', level = 'mixed', count = 10 }) {
  const available = pool({ grade, op, kind, steps, level });
  if (!available.length) return { problems: [], error: 'No word problems match those choices for this grade. Try a different grade, number type or step setting.' };
  const out = [];
  const seen = new Set();
  let deck = [];
  let guard = 0;
  while (out.length < count && guard++ < count * 40) {
    // Walk a shuffled deck of scenes so a sheet uses as many different stories as possible before repeating one.
    if (deck.length === 0) deck = shuffle(rng, available);
    const tpl = deck.pop();
    const p = tpl.make(rng, ctx(rng), grade);
    if (seen.has(p.text)) continue;
    seen.add(p.text);
    out.push({ text: p.text, answerText: p.answerText, steps: tpl.steps, kind: tpl.kind, level: tpl.level });
  }
  return { problems: out, error: null };
}

module.exports = { wordProblems, pool, ctx, OPS, KINDS, STEPS, LEVELS, TEMPLATES: T, NAMES, EXTRA_NAMES, GENDER };
