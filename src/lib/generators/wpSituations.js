'use strict';

// Situation-based word problems. A *structure* (join with the start unknown, compare, equal groups, remainders, a price
// table ...) is told in a *context* from wpContexts.js (baking, road trips, pet stores, sports ...) and then shown in one of
// several *formats* (plain question, write an equation, extra fact, error check, reasonableness, choose the equation,
// explain, several parts). The structures follow the problem situations used in the Common Core / CGI tables:
//   add to / take from / put together / take apart / compare, each with the unknown in every position;
//   equal groups, arrays and multiplicative comparison with the product, group size or number of groups unknown;
//   remainders, multi-step stories, prices and change, fractions of sets and recipes, tables and schedules.
const { CONTEXTS } = require('./wpContexts');

module.exports = function register(t, H) {
  const { int, pick, shuffle, fmt, F } = H;
  const LIM = { 1: 20, 2: 100, 3: 1000, 4: 10000, 5: 100000 }; // largest total at each grade
  const NO_OWN = new Set(['bus', 'stadium', 'museum', 'cars', 'rain', 'steps', 'miles', 'hike', 'trains', 'laps', 'books', 'bricks', 'recycle', 'bottles', 'carwash']); // counts nobody "has"
  const RATE = new Set(['miles', 'hike', 'steps', 'laps', 'books', 'points', 'soccer', 'basketball', 'carwash']); // containers are periods of time
  const UNMOVABLE = new Set(['row', 'rows', 'day', 'days', 'hour', 'hours', 'game', 'games', 'quarter', 'quarters', 'level', 'levels', 'tour', 'tours', 'storm', 'storms', 'section', 'sections', 'set', 'sets', 'plant', 'plants', 'chapter', 'chapters', 'pizza', 'pizzas', 'strip', 'strips', 'train', 'trains', 'bus', 'buses']);
  const movable = (x) => !UNMOVABLE.has(x.container[0]) && !RATE.has(x.id);
  const ARRAY = new Set(['flowers', 'tiles', 'cars', 'tomatoes', 'apples']);
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const money = (cents) => `$${(cents / 100).toFixed(2)}`;
  const dollars = (c) => (c % 100 === 0 ? `$${c / 100}` : money(c));
  const plural = (n, one, many) => (n === 1 ? one : many);

  // ---------- text helpers ----------
  const fill = (s, v) => s.replace(/\{(\w+)\}/g, (m, k) => (k in v ? v[k] : m));
  const vars = (c, x, extra = {}) => ({
    A: c.A.name, B: c.B.name, C: c.C.name, he: c.A.s, He: c.A.S, his: c.A.p, His: c.A.P, him: c.A.o,
    items: x.item[1], item: x.item[0], c: x.container[0], cs: x.container[1], base: x.verb[0], past: x.verb[1], ...extra,
  });
  // `prior` = the text so far: a sentence that uses he/she/his is only chosen when the character is already named
  const PRON = /\{(he|He|his|His|him)\}/;
  const say = (s, c, x, extra, prior) => {
    let pool = Array.isArray(s) ? s : [s];
    if (prior !== undefined && !prior.includes(c.A.name)) { const free = pool.filter((f) => !PRON.test(f)); if (free.length) pool = free; }
    return fill(pick(c.rng, pool), vars(c, x, extra));
  };
  // a setup sentence followed by a gain / lose sentence that suits it
  const sc = (c, x, key, a, b) => { const s0 = say(x.setup, c, x, { n: fmt(a) }); return `${s0} ${say(x[key], c, x, { n: fmt(b) }, s0)}`; };

  // ---------- picking a context and numbers ----------
  // Finds a context that passes `ok` and has a usable count range at this grade (cap = the largest single count we want).
  // contexts already used on this sheet are tried last, so a worksheet tells ten different stories
  const used = new Set();
  const fresh = (r) => shuffle(r, CONTEXTS).sort((a, b) => used.has(a.id) - used.has(b.id));
  function pickCtx(r, g, capN, ok = () => true) {
    for (const x of fresh(r)) {
      if (!ok(x)) continue;
      const hi = Math.min(x.max, capN);
      if (x.min > capN * 2) continue; // a stadium crowd is not a first-grade number
      if (x.max < Math.max(6, capN * 0.01)) continue; // grade 4-5 totals should be big, so small-count contexts sit out
      let lo = Math.max(2, Math.min(x.min, Math.floor(capN / 3)));
      if (g >= 4 && hi >= 300) lo = Math.max(lo, Math.min(Math.floor(hi / 4), g === 4 ? 100 : 1000));
      if (hi >= lo + 2) { used.add(x.id); return { x, lo, hi }; }
    }
    throw new Error('wpSituations: no context fits');
  }
  const own = (x) => !NO_OWN.has(x.id);
  const hasLose = (x) => x.lose.length > 0 && own(x);
  const hasSplit = (x) => !!x.split;
  const arrayOk = (x) => ARRAY.has(x.id);
  const perCap = { 2: 10, 3: 10, 4: 30, 5: 60 };
  const grpCap = { 2: 5, 3: 10, 4: 12, 5: 25 };
  // equal-groups numbers: per container k, number of containers n, with a context that suits them
  function groupsCtx(r, g, ok = () => true) {
    for (const x of fresh(r)) {
      if (!ok(x) || x.id === 'pizza' || x.id === 'bus' || x.id === 'bricks') continue;
      const kLo = Math.max(2, Math.min(x.per[0], perCap[g])); const kHi = Math.min(x.per[1], perCap[g]);
      if (x.per[0] > perCap[g] || kHi < kLo) continue;
      const k = g === 2 ? pick(r, [2, 3, 4, 5, 10].filter((v) => v >= kLo && v <= kHi).concat([kLo])) : int(r, kLo, kHi);
      const n = g === 2 ? pick(r, [2, 3, 4, 5]) : int(r, 2, grpCap[g]);
      if (k * n > x.max * 3) continue;
      used.add(x.id);
      return { x, k, n };
    }
    throw new Error('wpSituations: no group context fits');
  }

  // ---------- registering with formats ----------
  // A structure returns { story, question, answer, eq, extra?, wrong?, wrongEqs?, estimate?, parts?, table?, meta }.
  // `finish` chooses how to show it.
  const NAMES3 = (c) => c.C;
  function finish(r, g, c, s) {
    const out = { answerText: s.answer, meta: s.meta };
    const roll = r();
    const person = NAMES3(c);
    const inGrade = (v) => Number(String(v).replace(/[^0-9.]/g, '')) <= LIM[g]; // a made-up claim must not be bigger than the grade works with
    if (s.wrong && !inGrade(s.wrong.value)) s.wrong = null;
    if (s.extra && (String(s.extra).match(/\d[\d,]*/g) || []).some((v) => Number(v.replace(/,/g, '')) > Math.max(12, LIM[g] / 10))) s.extra = null;
    if (s.estimate && !(inGrade(s.estimate.good) && inGrade(s.estimate.bad))) s.estimate = null;
    let text = `${s.story} ${s.question}`;
    if (s.parts) {
      out.text = s.story; out.parts = s.parts; return out;
    }
    if (s.table) out.table = s.table;
    if (s.text) { out.text = s.text; return out; }
    if (roll < 0.07 && s.eq && g >= 2) {
      const letter = pick(r, ['n', 'x', 'm', 'p', 'b', 't']);
      const eqL = s.eq.replace('?', letter);
      text += g >= 3 ? ` Write an equation with a letter for the unknown, then solve it.` : ` Write a number sentence, then solve it.`;
      out.answerText = `${eqL}; ${s.answer}`;
    } else if (roll < 0.14 && s.extra && g >= 2) {
      text = `${s.story} ${s.extra} ${s.question}`;
      out.note = 'Not every fact in this problem is needed. Cross out the one you do not need.';
    } else if (roll < 0.20 && s.estimate && g >= 4) {
      const e = s.estimate; const ok = r() < 0.5; const claim = ok ? e.good : e.bad;
      text = `${s.story} ${s.question.replace(/\?$/, '')}? ${person.name} says the answer is about ${fmt(claim)}. Is that a reasonable estimate? Explain.`;
      out.answerText = ok ? `Yes. The exact answer is ${s.answer}, which is close to ${fmt(claim)}.` : `No. The exact answer is ${s.answer}; ${fmt(claim)} is too ${claim > e.exact ? 'high' : 'low'}${e.why ? ` (${e.why})` : ''}.`;
      out.explain = true;
    } else if (roll < 0.27 && s.wrong && String(s.wrong.value) !== String(s.answer) && g >= 3) {
      text += ` ${person.name} says the answer is ${s.wrong.value}. Is ${person.s} correct? If not, find the correct answer and tell what ${person.s} did wrong.`;
      out.answerText = `No. The correct answer is ${s.answer}. ${s.wrong.mistake}`;
      out.explain = true;
    } else if (roll < 0.33 && s.eq && s.wrongEqs && g >= 3) {
      const opts = shuffle(r, [s.eq.replace('?', '□'), ...s.wrongEqs.slice(0, 2).map((e) => e.replace('?', '□'))]);
      const letters = ['A', 'B', 'C'];
      out.choices = opts.map((o, i) => `${letters[i]}. ${o}`);
      text += ' Which equation matches the story? Circle it, then solve.';
      out.answerText = `${letters[opts.indexOf(s.eq.replace('?', '□'))]} (${s.eq.replace('?', '□')}); ${s.answer}`;
    } else if (roll < 0.37 && g >= 3) {
      text += ' Explain how you know your answer makes sense.';
      out.explain = true;
    }
    out.text = text;
    return out;
  }
  const reg = (id, def, make) => t({
    id, ops: def.ops, kind: def.kind || 'whole', steps: def.steps || 1, level: def.level || 1, grades: def.grades,
    make: (r, c, g) => { c.rng = r; return finish(r, g, c, make(r, c, g)); },
  });
  H.sit = { used, reg, say, fill, vars, pickCtx, finish, money, dollars, cap, plural, own, hasSplit, RATE, movable, LIM };
  const Q = ['How many {items} are there now?', 'How many {items} are there in all?', 'What is the new total?'];

  // ======================= ADD TO / TAKE FROM / PUT TOGETHER / TAKE APART / COMPARE =======================
  const amounts = (r, g, ok) => {
    const { x, lo, hi } = pickCtx(r, g, Math.floor(LIM[g] * 0.5), ok);
    const a = int(r, lo, hi); let b = int(r, lo, hi); if (b === a) b = a < hi ? a + 1 : a - 1;
    return { x, a, b };
  };
  const wrongAddSub = (a, b) => ({ value: fmt(a + b), mistake: `${fmt(a)} − ${fmt(b)} was needed, not ${fmt(a)} + ${fmt(b)}.` });

  reg('sit-join-result', { ops: ['add'], grades: [1, 5] }, (r, c, g) => {
    const { x, a, b } = amounts(r, g);
    return { story: `${sc(c, x, 'gain', a, b)}`, question: say(Q, c, x), answer: fmt(a + b), eq: `${fmt(a)} + ${fmt(b)} = ?`, wrongEqs: [`${fmt(a)} − ${fmt(b)} = ?`, `${fmt(a)} × ${fmt(b)} = ?`], extra: say(x.extra, c, x, {}, ''), estimate: g >= 4 ? { exact: a + b, good: Math.round((a + b) / 10) * 10, bad: Math.round((a + b) / 10) * 100, why: 'adding two numbers cannot reach that high' } : null, wrong: { value: fmt(Math.abs(a - b)), mistake: `${fmt(a)} + ${fmt(b)} was needed, not a subtraction.` }, meta: { op: 'join', a, b } };
  });
  reg('sit-join-change', { ops: ['sub', 'add'], grades: [1, 5] }, (r, c, g) => {
    const { x, a, b } = amounts(r, g, own);
    return { story: `${say(x.setup, c, x, { n: fmt(a) })} After getting some more, there are ${fmt(a + b)} ${x.item[1]} in all.`, question: `How many more ${x.item[1]} were added?`, answer: fmt(b), eq: `${fmt(a)} + ? = ${fmt(a + b)}`, wrongEqs: [`${fmt(a)} + ${fmt(a + b)} = ?`, `${fmt(a)} × ${fmt(a + b)} = ?`], extra: say(x.extra, c, x, {}, ''), wrong: { value: fmt(a + a + b), mistake: `The question asks how many were added, so subtract ${fmt(a)} from ${fmt(a + b)}.` }, meta: { op: 'join-change', a, b, total: a + b } };
  });
  reg('sit-join-start', { ops: ['sub'], level: 2, grades: [1, 5] }, (r, c, g) => {
    const { x, a, b } = amounts(r, g, own);
    return { story: `${c.A.name} starts with some ${x.item[1]}. ${say(x.gain, c, x, { n: fmt(b) })} Now there are ${fmt(a + b)} ${x.item[1]}.`, question: `How many ${x.item[1]} were there at the start?`, answer: fmt(a), eq: `? + ${fmt(b)} = ${fmt(a + b)}`, wrongEqs: [`${fmt(b)} + ${fmt(a + b)} = ?`, `${fmt(a + b)} + ${fmt(b)} = ?`], wrong: { value: fmt(a + b + b), mistake: `The ${fmt(b)} that were added must be taken away from ${fmt(a + b)} to find the start.` }, meta: { op: 'join-start', a, b, total: a + b } };
  });
  reg('sit-separate-result', { ops: ['sub'], grades: [1, 5] }, (r, c, g) => {
    const { x, a, b } = amounts(r, g, hasLose); const hi = Math.max(a, b); const lo = Math.min(a, b);
    return { story: sc(c, x, 'lose', hi, lo), question: `How many ${x.item[1]} are left?`, answer: fmt(hi - lo), eq: `${fmt(hi)} − ${fmt(lo)} = ?`, wrongEqs: [`${fmt(hi)} + ${fmt(lo)} = ?`, `${fmt(lo)} − ${fmt(hi)} = ?`], extra: say(x.extra, c, x, {}, ''), wrong: wrongAddSub(hi, lo), estimate: g >= 4 ? { exact: hi - lo, good: Math.round((hi - lo) / 10) * 10, bad: Math.round((hi + lo) / 10) * 10, why: 'the amount left is smaller than what you started with' } : null, meta: { op: 'separate', a: hi, b: lo } };
  });
  reg('sit-separate-change', { ops: ['sub'], grades: [1, 5] }, (r, c, g) => {
    const { x, a, b } = amounts(r, g, hasLose); const hi = Math.max(a, b); const lo = Math.min(a, b);
    return { story: `${say(x.setup, c, x, { n: fmt(hi) })} After some are taken away, ${fmt(lo)} ${x.item[1]} are left.`, question: `How many ${x.item[1]} were taken away?`, answer: fmt(hi - lo), eq: `${fmt(hi)} − ? = ${fmt(lo)}`, wrongEqs: [`${fmt(hi)} + ${fmt(lo)} = ?`, `${fmt(lo)} − ${fmt(hi)} = ?`], extra: say(x.extra, c, x, {}, ''), meta: { op: 'separate-change', a: hi, b: lo } };
  });
  reg('sit-separate-start', { ops: ['add'], level: 2, grades: [1, 5] }, (r, c, g) => {
    const { x, a, b } = amounts(r, g, hasLose);
    return { story: `${c.A.name} has some ${x.item[1]}. ${say(x.lose, c, x, { n: fmt(b) })} Now there are ${fmt(a)} left.`, question: `How many ${x.item[1]} were there to begin with?`, answer: fmt(a + b), eq: `? − ${fmt(b)} = ${fmt(a)}`, wrongEqs: [`${fmt(a)} − ${fmt(b)} = ?`, `${fmt(b)} − ${fmt(a)} = ?`], wrong: { value: fmt(Math.abs(a - b)), mistake: `Going back to the start means adding the ${fmt(b)} that were taken away to ${fmt(a)}.` }, meta: { op: 'separate-start', left: a, removed: b } };
  });
  reg('sit-part-whole', { ops: ['add', 'sub'], grades: [1, 5] }, (r, c, g) => {
    const { x, a, b } = amounts(r, g, hasSplit); const [p, q] = x.split;
    if (r() < 0.5) return { story: `${c.A.name} counts ${fmt(a)} ${p} ${x.item[1]} and ${fmt(b)} ${q} ${x.item[1]}.`, question: `How many ${x.item[1]} are there in all?`, answer: fmt(a + b), eq: `${fmt(a)} + ${fmt(b)} = ?`, wrongEqs: [`${fmt(a)} − ${fmt(b)} = ?`], extra: say(x.extra, c, x, {}, ''), meta: { op: 'part-whole-total', a, b } };
    const hi = a + b;
    return { story: `There are ${fmt(hi)} ${x.item[1]} in a box. ${fmt(a)} of them are ${p}, and the rest are ${q}.`, question: `How many ${x.item[1]} are ${q}?`, answer: fmt(b), eq: `${fmt(a)} + ? = ${fmt(hi)}`, wrongEqs: [`${fmt(a)} + ${fmt(hi)} = ?`, `${fmt(hi)} + ${fmt(a)} = ?`], extra: say(x.extra, c, x, {}, ''), wrong: { value: fmt(hi + a), mistake: `The ${p} ones are part of the ${fmt(hi)}, so subtract them instead of adding.` }, meta: { op: 'part-whole-part', whole: hi, a, b } };
  });
  reg('sit-compare', { ops: ['sub'], grades: [1, 5] }, (r, c, g) => {
    const { x, a, b } = amounts(r, g, own); if (a === b) throw new Error('tie'); const hi = Math.max(a, b); const lo = Math.min(a, b);
    const A = c.A.name; const B = c.B.name; const kind = r() < 0.5 ? 'more' : 'fewer';
    const story = `${A} ${x.verb[1]} ${fmt(hi)} ${x.item[1]}. ${B} ${x.verb[1]} ${fmt(lo)} ${x.item[1]}.`;
    return { story, question: kind === 'more' ? `How many more ${x.item[1]} did ${A} ${x.verb[0]} than ${B}?` : `How many fewer ${x.item[1]} did ${B} ${x.verb[0]} than ${A}?`, answer: fmt(hi - lo), eq: `${fmt(hi)} − ${fmt(lo)} = ?`, wrongEqs: [`${fmt(hi)} + ${fmt(lo)} = ?`, `${fmt(lo)} − ${fmt(hi)} = ?`], extra: say(x.extra, c, x, {}, ''), wrong: wrongAddSub(hi, lo), meta: { op: 'compare', hi, lo } };
  });
  reg('sit-compare-bigger', { ops: ['add'], level: 2, grades: [2, 5] }, (r, c, g) => {
    const { x, lo, hi } = pickCtx(r, g, Math.floor(LIM[g] * 0.5), own); const a = int(r, lo, hi); const d = Math.min(int(r, Math.max(2, Math.floor(lo / 2)), Math.max(3, Math.floor(hi / 2))), a - 1);
    const A = c.A.name; const B = c.B.name;
    const variants = [
      { story: `${A} ${x.verb[1]} ${fmt(a)} ${x.item[1]}. ${B} ${x.verb[1]} ${fmt(d)} more ${x.item[1]} than ${A}.`, question: `How many ${x.item[1]} did ${B} ${x.verb[0]}?`, answer: fmt(a + d), eq: `${fmt(a)} + ${fmt(d)} = ?`, wrongEqs: [`${fmt(a)} − ${fmt(d)} = ?`] },
      { story: `${A} ${x.verb[1]} ${fmt(a + d)} ${x.item[1]}, which is ${fmt(d)} more than ${B} ${x.verb[1]}.`, question: `How many ${x.item[1]} did ${B} ${x.verb[0]}?`, answer: fmt(a), eq: `${fmt(a + d)} − ${fmt(d)} = ?`, wrongEqs: [`${fmt(a + d)} + ${fmt(d)} = ?`] },
      { story: `${B} ${x.verb[1]} ${fmt(a)} ${x.item[1]}. ${A} ${x.verb[1]} ${fmt(d)} fewer ${x.item[1]} than ${B}.`, question: `How many ${x.item[1]} did ${A} ${x.verb[0]}?`, answer: fmt(a - d), eq: `${fmt(a)} − ${fmt(d)} = ?`, wrongEqs: [`${fmt(a)} + ${fmt(d)} = ?`] },
    ];
    const v = variants[int(r, 0, 2)];
    return { ...v, extra: say(x.extra, c, x, {}, ''), meta: { op: 'compare-unknown', a, d } };
  });

  // ---------- two-step additive ----------
  reg('sit-two-step-add-sub', { ops: ['addsub', 'add', 'sub'], steps: 2, grades: [2, 5] }, (r, c, g) => {
    const { x, lo, hi } = pickCtx(r, g, Math.floor(LIM[g] * 0.4), hasLose); const a = int(r, lo, hi); const b = int(r, lo, hi); const d = int(r, Math.max(2, Math.floor(lo / 2)), Math.max(2, Math.min(a + b - 1, hi)));
    return { story: `${sc(c, x, 'gain', a, b)} ${say(x.lose, c, x, { n: fmt(d) }, c.A.name)}`, question: `How many ${x.item[1]} are left?`, answer: fmt(a + b - d), eq: `${fmt(a)} + ${fmt(b)} − ${fmt(d)} = ?`, extra: say(x.extra, c, x, {}, ''), estimate: g >= 4 ? { exact: a + b - d, good: Math.round((a + b - d) / 10) * 10, bad: Math.round((a + b + d) / 10) * 10, why: 'some were taken away, so the total should not go up' } : null, wrong: { value: fmt(a + b + d), mistake: `The last step takes ${fmt(d)} away; it should not be added.` }, meta: { op: 'two-step', a, b, d } };
  });
  reg('sit-compare-total', { ops: ['add'], steps: 2, level: 2, grades: [2, 5] }, (r, c, g) => {
    const { x, lo, hi } = pickCtx(r, g, Math.floor(LIM[g] * 0.3), own); const a = int(r, lo, hi); const d = int(r, Math.max(2, Math.floor(lo / 2)), Math.max(3, Math.floor(hi / 2)));
    return { story: `${c.A.name} ${x.verb[1]} ${fmt(a)} ${x.item[1]}. ${c.B.name} ${x.verb[1]} ${fmt(d)} more ${x.item[1]} than ${c.A.name}.`, question: `How many ${x.item[1]} did they ${x.verb[0]} altogether?`, answer: fmt(a + a + d), eq: `${fmt(a)} + (${fmt(a)} + ${fmt(d)}) = ?`, extra: say(x.extra, c, x, {}, ''), wrong: { value: fmt(a + d), mistake: `That is only ${c.B.name}'s ${x.item[1]}. ${c.A.name}'s ${fmt(a)} must be added too.` }, meta: { op: 'compare-total', a, d } };
  });
  reg('sit-three-parts', { ops: ['add'], steps: 2, grades: [3, 5] }, (r, c, g) => {
    const { x, lo, hi } = pickCtx(r, g, Math.floor(LIM[g] / 3)); const n = [int(r, lo, hi), int(r, lo, hi), int(r, lo, hi)];
    const days = pick(r, [['Friday', 'Saturday', 'Sunday'], ['Monday', 'Tuesday', 'Wednesday'], ['week 1', 'week 2', 'week 3']]);
    const tell = pick(r, [
      () => `${c.A.name} keeps track of ${x.item[1]} over three days. ${n.map((v, i) => `On ${days[i]} the count is ${fmt(v)}.`).join(' ')}`,
      () => `A log book lists ${x.item[1]} for three days. ${n.map((v, i) => `${cap(days[i])}: ${fmt(v)}.`).join(' ')}`,
      () => `${c.A.name} writes down how many ${x.item[1]} there were: ${fmt(n[0])} first, then ${fmt(n[1])}, then ${fmt(n[2])}.`,
    ]);
    const story = tell();
    return { story, question: `What is the total for all three days?`, answer: fmt(n[0] + n[1] + n[2]), eq: `${n.map(fmt).join(' + ')} = ?`, meta: { op: 'three-parts', n } };
  });

  // ======================= EQUAL GROUPS / ARRAYS / MULTIPLICATIVE COMPARE =======================
  function groupsStory(r, c, x, k, n, ask) {
    const A = c.A.name; const cs = x.container[1]; const c1 = x.container[0]; const it = x.item[1];
    const rate = RATE.has(x.id);
    if (ask === 'product') {
      if (rate) return pick(r, [`In one ${c1}, ${A} ${x.verb[1]} ${fmt(k)} ${it}. If ${c.A.s} keeps up the same pace, how many ${it} will ${c.A.s} ${x.verb[0]} in ${n} ${cs}?`, `${A} ${x.verb[1]} ${fmt(k)} ${it} every ${c1} for ${n} ${cs}. How many ${it} is that in all?`]);
      return pick(r, [`${A} has ${n} ${cs}. Each ${c1} holds ${fmt(k)} ${it}. How many ${it} are there in all?`, `There are ${n} ${cs} with ${fmt(k)} ${it} in each ${c1}. How many ${it} are there altogether?`, `${A} fills ${n} ${cs} by putting ${fmt(k)} ${it} in each ${c1}. How many ${it} does ${c.A.s} use?`]);
    }
    if (ask === 'size') {
      if (rate) return `${A} ${x.verb[1]} ${fmt(k * n)} ${it} in ${n} ${cs}, the same number each ${c1}. How many ${it} did ${c.A.s} ${x.verb[0]} each ${c1}?`;
      return pick(r, [`${A} shares ${fmt(k * n)} ${it} equally among ${n} ${cs}. How many ${it} go in each ${c1}?`, `${fmt(k * n)} ${it} are packed into ${n} ${cs}, with the same number in each ${c1}. How many ${it} are in each ${c1}?`]);
    }
    if (rate) return `${A} ${x.verb[1]} ${fmt(k * n)} ${it} in all, ${fmt(k)} each ${c1}. How many ${cs} did it take?`;
    return pick(r, [`${A} has ${fmt(k * n)} ${it}. Each ${c1} holds ${fmt(k)}. How many ${cs} does ${c.A.s} need?`, `${fmt(k * n)} ${it} are packed ${fmt(k)} to a ${c1}. How many ${cs} are filled?`]);
  }
  const groupsMake = (ask) => (r, c, g) => {
    const { x, k, n } = groupsCtx(r, g);
    const q = groupsStory(r, c, x, k, n, ask);
    const total = k * n;
    const base = { story: q.replace(/\s*(How many|What) [^?]*\?$/, '').trim(), question: (/(How many|What) [^?]*\?$/.exec(q) || [q])[0], extra: say(x.extra, c, x, {}, '') };
    if (ask === 'product') return { ...base, answer: fmt(total), eq: `${n} × ${fmt(k)} = ?`, wrongEqs: [`${n} + ${fmt(k)} = ?`, `${fmt(total)} ÷ ${n} = ?`], wrong: { value: fmt(k + n), mistake: `Equal groups call for multiplying ${n} × ${fmt(k)}, not adding.` }, meta: { op: 'groups-product', k, n } };
    if (ask === 'size') return { ...base, answer: fmt(k), eq: `${fmt(total)} ÷ ${n} = ?`, wrongEqs: [`${fmt(total)} × ${n} = ?`, `${fmt(total)} − ${n} = ?`], wrong: { value: fmt(total - n), mistake: `Sharing equally is division: ${fmt(total)} ÷ ${n}.` }, meta: { op: 'groups-size', k, n } };
    return { ...base, answer: String(n), eq: `${fmt(total)} ÷ ${fmt(k)} = ?`, wrongEqs: [`${fmt(total)} × ${fmt(k)} = ?`, `${fmt(total)} − ${fmt(k)} = ?`], wrong: { value: fmt(total - k), mistake: `Finding how many groups is division: ${fmt(total)} ÷ ${fmt(k)}.` }, meta: { op: 'groups-count', k, n } };
  };
  reg('sit-groups-size', { ops: ['div'], grades: [3, 5] }, groupsMake('size'));
  reg('sit-groups-count', { ops: ['div'], grades: [3, 5] }, groupsMake('count'));
  reg('sit-groups-product', { ops: ['mul'], grades: [2, 5] }, groupsMake('product'));

  reg('sit-array', { ops: ['mul', 'div'], grades: [2, 4] }, (r, c, g) => {
    const { x } = pickCtx(r, g, 200, arrayOk); const rows = int(r, 2, g === 2 ? 5 : 9); const cols = int(r, 2, g === 2 ? 5 : 9); const A = c.A.name;
    const kind = g === 2 ? 0 : int(r, 0, 2);
    if (kind === 0) return { story: `${A} arranges ${x.item[1]} in ${rows} rows. There are ${cols} ${x.item[1]} in each row.`, question: `How many ${x.item[1]} are there in all?`, answer: fmt(rows * cols), eq: `${rows} × ${cols} = ?`, wrongEqs: [`${rows} + ${cols} = ?`], meta: { op: 'array', rows, cols } };
    if (kind === 1) return { story: `${A} has ${rows * cols} ${x.item[1]} to set out in ${rows} equal rows.`, question: `How many ${x.item[1]} go in each row?`, answer: fmt(cols), eq: `${rows * cols} ÷ ${rows} = ?`, wrongEqs: [`${rows * cols} × ${rows} = ?`], meta: { op: 'array-cols', rows, cols } };
    return { story: `${rows * cols} ${x.item[1]} are set out in rows of ${cols}.`, question: `How many rows are there?`, answer: fmt(rows), eq: `${rows * cols} ÷ ${cols} = ?`, wrongEqs: [`${rows * cols} × ${cols} = ?`], meta: { op: 'array-rows', rows, cols } };
  });
  reg('sit-times-as-many', { ops: ['mul'], grades: [3, 5] }, (r, c, g) => {
    const { x, lo, hi } = pickCtx(r, g, g === 3 ? 12 : g === 4 ? 150 : 900, own); const a = int(r, Math.max(2, Math.min(lo, 8)), Math.max(4, Math.min(hi, g === 3 ? 9 : 40))); const k = g === 3 ? int(r, 2, 6) : int(r, 2, 9);
    const A = c.A.name; const B = c.B.name; const f = ['', '', 'twice', 'three times', 'four times', 'five times'][k] || `${k} times`;
    return { story: `${A} ${x.verb[1]} ${fmt(a)} ${x.item[1]}. ${B} ${x.verb[1]} ${k === 2 ? 'twice' : `${k} times`} as many ${x.item[1]} as ${A}.`, question: `How many ${x.item[1]} did ${B} ${x.verb[0]}?`, answer: fmt(a * k), eq: `${k} × ${fmt(a)} = ?`, wrongEqs: [`${k} + ${fmt(a)} = ?`, `${fmt(a)} ÷ ${k} = ?`], wrong: { value: fmt(a + k), mistake: `"${f} as many" means multiply, not add ${k}.` }, meta: { op: 'times-as-many', a, k } };
  });
  reg('sit-times-unknown', { ops: ['div'], level: 2, grades: [4, 5] }, (r, c, g) => {
    const { x, lo, hi } = pickCtx(r, g, g === 4 ? 150 : 900, own); const a = int(r, Math.max(2, Math.min(lo, 12)), Math.max(4, Math.min(hi, 40))); const k = int(r, 2, 9);
    const A = c.A.name; const B = c.B.name;
    if (r() < 0.5) return { story: `${B} ${x.verb[1]} ${fmt(a * k)} ${x.item[1]}. That is ${k} times as many as ${A} ${x.verb[1]}.`, question: `How many ${x.item[1]} did ${A} ${x.verb[0]}?`, answer: fmt(a), eq: `${fmt(a * k)} ÷ ${k} = ?`, wrongEqs: [`${fmt(a * k)} × ${k} = ?`], wrong: { value: fmt(a * k * k), mistake: `${B}'s amount is ${k} times ${A}'s, so divide to go back.` }, meta: { op: 'times-unknown-ref', a, k } };
    return { story: `${A} ${x.verb[1]} ${fmt(a)} ${x.item[1]} and ${B} ${x.verb[1]} ${fmt(a * k)} ${x.item[1]}.`, question: `${B} ${x.verb[1]} how many times as many ${x.item[1]} as ${A}?`, answer: String(k), eq: `${fmt(a * k)} ÷ ${fmt(a)} = ?`, wrongEqs: [`${fmt(a * k)} − ${fmt(a)} = ?`], meta: { op: 'times-unknown-mult', a, k } };
  });

  // ---------- remainders ----------
  reg('sit-remainder', { ops: ['div'], level: 2, grades: [3, 5] }, (r, c, g) => {
    const { x } = pickCtx(r, g, 200, (y) => movable(y) && y.per[1] <= 40 && y.per[0] >= 4 && y.per[0] <= 12);
    const k = int(r, Math.max(3, x.per[0]), Math.min(x.per[1], g === 3 ? 9 : 12)); const q = int(r, 3, g === 3 ? 9 : 20); const rem = int(r, 1, k - 1); const total = k * q + rem;
    const A = c.A.name; const it = x.item[1]; const cs = x.container[1]; const c1 = x.container[0];
    const kind = int(r, 0, 2);
    if (kind === 0) return { story: `${A} has ${fmt(total)} ${it} and puts ${k} in each ${c1}.`, question: `How many full ${cs} can ${c.A.s} fill, and how many ${it} are left over?`, answer: `${q} full ${cs}, ${rem} left over`, eq: `${fmt(total)} ÷ ${k} = ?`, meta: { op: 'remainder', total, k, q, rem, kind: 'both' } };
    if (kind === 1) return { story: `${fmt(total)} ${it} must be packed ${k} to a ${c1}.`, question: `How many ${cs} are needed so that every one is packed?`, answer: `${q + 1} ${cs} (${q} full ${cs} and one more for the ${rem} left over)`, eq: `${fmt(total)} ÷ ${k} = ?`, extra: say(x.extra, c, x, {}, ''), meta: { op: 'remainder', total, k, q, rem, kind: 'roundup' } };
    return { story: `${A} has ${fmt(total)} ${it}. ${c.A.S} puts exactly ${k} ${it} in each ${c1} and does not use any partly filled ${c1}.`, question: `How many ${it} will ${c.A.s} have left over?`, answer: `${rem} ${plural(rem, x.item[0], x.item[1])}`, eq: `${fmt(total)} ÷ ${k} = ?`, meta: { op: 'remainder', total, k, q, rem, kind: 'leftover' } };
  });

  // ---------- multi-step ----------
  reg('sit-groups-plus', { ops: ['muladd', 'mulsub'], steps: 2, level: 2, grades: [3, 5] }, (r, c, g) => {
    const { x, k, n } = groupsCtx(r, g, (y) => hasLose(y) && movable(y)); const more = int(r, 3, Math.max(5, Math.floor(k * n / 2))); const plus = r() < 0.5; const A = c.A.name;
    if (plus) return { story: `${A} fills ${n} ${x.container[1]} with ${fmt(k)} ${x.item[1]} in each ${x.container[0]}. ${say(x.gain, c, x, { n: fmt(more) })}`, question: `How many ${x.item[1]} does ${c.A.s} have now?`, answer: fmt(k * n + more), eq: `${n} × ${fmt(k)} + ${fmt(more)} = ?`, extra: say(x.extra, c, x, {}, ''), wrong: { value: fmt(n * (k + more)), mistake: `The ${fmt(more)} extra ${x.item[1]} are added once, after multiplying.` }, meta: { op: 'groups-plus', k, n, more } };
    return { story: `${A} fills ${n} ${x.container[1]} with ${fmt(k)} ${x.item[1]} in each ${x.container[0]}. ${say(x.lose, c, x, { n: fmt(Math.min(more, k * n - 1)) })}`, question: `How many ${x.item[1]} are left?`, answer: fmt(k * n - Math.min(more, k * n - 1)), eq: `${n} × ${fmt(k)} − ${fmt(Math.min(more, k * n - 1))} = ?`, extra: say(x.extra, c, x, {}, ''), meta: { op: 'groups-minus', k, n, more: Math.min(more, k * n - 1) } };
  });
  reg('sit-sum-times', { ops: ['addmul'], steps: 2, level: 2, grades: [3, 5] }, (r, c, g) => {
    const { x } = pickCtx(r, g, 200, (y) => hasSplit(y) && movable(y)); const a = int(r, 2, 8); const b = int(r, 2, 8); const n = int(r, 2, g === 3 ? 6 : 12); const [p, q] = x.split;
    return { story: `${c.A.name} has ${n} ${x.container[1]}. Each ${x.container[0]} holds ${a} ${p} ${x.item[1]} and ${b} ${q} ${x.item[1]}.`, question: `How many ${x.item[1]} are there in all?`, answer: fmt(n * (a + b)), eq: `${n} × (${a} + ${b}) = ?`, wrongEqs: [`${n} × ${a} + ${b} = ?`], wrong: { value: fmt(n * a + b), mistake: `Both kinds go in every ${x.container[0]}, so multiply the whole ${a + b} by ${n}.` }, meta: { op: 'sum-times', a, b, n } };
  });
  reg('sit-two-groups', { ops: ['muladd'], steps: 3, level: 2, grades: [4, 5] }, (r, c, g) => {
    const { x, k, n } = groupsCtx(r, g); const k2 = int(r, Math.max(2, Math.min(x.per[0], perCap[g])), Math.min(x.per[1], perCap[g])); const n2 = int(r, 2, grpCap[g]);
    return { story: `${c.A.name} has ${n} ${x.container[1]} with ${fmt(k)} ${x.item[1]} in each ${x.container[0]}. ${c.A.S} also has ${n2} more ${x.container[1]} with ${fmt(k2)} ${x.item[1]} in each one.`, question: `How many ${x.item[1]} are there in all?`, answer: fmt(n * k + n2 * k2), eq: `${n} × ${fmt(k)} + ${n2} × ${fmt(k2)} = ?`, estimate: { exact: n * k + n2 * k2, good: Math.round((n * k + n2 * k2) / 10) * 10, bad: Math.round((n * k + n2 * k2) / 10) * 10 * 2, why: 'the estimate is about double the real total' }, meta: { op: 'two-groups', k, n, k2, n2 } };
  });
  reg('sit-divide-then', { ops: ['divsub', 'divmul'], steps: 2, level: 2, grades: [4, 5] }, (r, c, g) => {
    const { x, k, n } = groupsCtx(r, g, (y) => movable(y) && y.per[0] <= 30); const gone = int(r, 1, n - 1); const total = k * n;
    return { story: `${c.A.name} has ${fmt(total)} ${x.item[1]} and puts ${fmt(k)} in each ${x.container[0]}. Then ${c.A.s} gives away ${gone} ${plural(gone, x.container[0], x.container[1])}.`, question: `How many ${x.item[1]} does ${c.A.s} still have?`, answer: fmt(total - gone * k), eq: `${fmt(total)} − ${gone} × ${fmt(k)} = ?`, extra: say(x.extra, c, x, {}, ''), meta: { op: 'divide-then', total, k, n, gone } };
  });

  // ---------- several parts ----------
  reg('sit-parts-total-left', { ops: ['addsub'], steps: 2, grades: [2, 5] }, (r, c, g) => {
    const { x, lo, hi } = pickCtx(r, g, Math.floor(LIM[g] * 0.4), hasLose); const a = int(r, lo, hi); const b = int(r, lo, hi); const d = int(r, 2, Math.max(2, Math.min(a + b - 1, hi)));
    return { story: sc(c, x, 'gain', a, b), answer: `a) ${fmt(a + b)}  b) ${fmt(a + b - d)}`, parts: [{ q: `How many ${x.item[1]} are there now?`, a: fmt(a + b) }, { q: `Then ${fmt(d)} ${x.item[1]} are taken away. How many are left?`, a: fmt(a + b - d) }], meta: { op: 'parts-total-left', a, b, d } };
  });
  reg('sit-parts-compare', { ops: ['addsub'], steps: 2, grades: [2, 5] }, (r, c, g) => {
    const { x, a, b } = amounts(r, g, own); if (a === b) throw new Error('tie'); const hi = Math.max(a, b); const lo = Math.min(a, b);
    return { story: `${c.A.name} ${x.verb[1]} ${fmt(hi)} ${x.item[1]}. ${c.B.name} ${x.verb[1]} ${fmt(lo)} ${x.item[1]}.`, answer: `a) ${fmt(hi + lo)}  b) ${fmt(hi - lo)}`, parts: [{ q: `How many ${x.item[1]} did they ${x.verb[0]} together?`, a: fmt(hi + lo) }, { q: `How many more did ${c.A.name} ${x.verb[0]} than ${c.B.name}?`, a: fmt(hi - lo) }], meta: { op: 'parts-compare', hi, lo } };
  });
  reg('sit-parts-groups', { ops: ['muldiv'], steps: 2, grades: [3, 5] }, (r, c, g) => {
    const { x, k, n } = groupsCtx(r, g, movable); const total = k * n; const parts = int(r, 2, 6);
    return { story: `${c.A.name} fills ${n} ${x.container[1]} with ${fmt(k)} ${x.item[1]} in each ${x.container[0]}.`, answer: `a) ${fmt(total)}  b) ${fmt(total)} ÷ ${parts}`, parts: [{ q: `How many ${x.item[1]} is that in all?`, a: fmt(total) }, { q: `Write a division sentence to show sharing all of them equally among ${parts} friends. (You do not have to solve it.)`, a: `${fmt(total)} ÷ ${parts}` }], meta: { op: 'parts-groups', k, n, parts } };
  });
  require('./wpSituations2')(t, H);
};
