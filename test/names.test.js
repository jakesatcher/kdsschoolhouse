'use strict';
// Name banks: 100 boy names and 100 girl names, culturally diverse, including the original six characters. Stories draw
// from the banks at random, the same seed gives the same names, and pronouns always match the name's gender.
const test = require('node:test');
const assert = require('node:assert');
const names = require('../src/lib/names');
const wp = require('../src/lib/generators/wordProblems');
const sp = require('../src/lib/generators/spiral');
const { makeRng } = require('../src/lib/generators/rng');

test('the banks hold 100 unique boy names and 100 unique girl names, with the original characters inside', () => {
  assert.strictEqual(names.BOYS.length, 100); assert.strictEqual(names.GIRLS.length, 100);
  assert.strictEqual(new Set(names.ALL).size, 200, 'no name is in both banks or twice');
  for (const n of ['Zach', 'AC', 'Screech']) assert.ok(names.BOYS.includes(n), n);
  for (const n of ['Kelly', 'Lisa', 'Jessie']) assert.ok(names.GIRLS.includes(n), n);
  for (const n of names.ALL) assert.match(n, /^[A-Za-z]{2,9}$/, n);
  for (const n of names.BOYS) assert.strictEqual(names.GENDER[n], 'm'); for (const n of names.GIRLS) assert.strictEqual(names.GENDER[n], 'f');
});

test('the banks cover many cultures and communities', () => {
  const has = (list, ...want) => want.every((n) => list.includes(n));
  assert.ok(has(names.BOYS, 'Mateo', 'Jamal', 'Omar', 'Rahul', 'Kenji', 'Kwame', 'Dmitri', 'Yosef', 'Kai', 'Takoda'));
  assert.ok(has(names.GIRLS, 'Sofia', 'Aaliyah', 'Fatima', 'Priya', 'Mei', 'Ngozi', 'Katya', 'Naomi', 'Leilani', 'Aponi'));
});

test('story characters are random picks from the banks, repeat rarely on one sheet, and are reproducible for a seed', () => {
  const seen = new Set(); let boysSeen = 0; let girlsSeen = 0;
  for (let seed = 1; seed <= 80; seed++) {
    const out = wp.wordProblems(makeRng(seed), { grade: 4, op: 'mixed', kind: 'mixed', steps: 'mixed', level: 'mixed', count: 10 });
    const found = out.problems.map((p) => names.ALL.filter((n) => new RegExp(`\\b${n}\\b`).test(p.text)));
    found.flat().forEach((n) => { seen.add(n); if (names.GENDER[n] === 'm') boysSeen++; else girlsSeen++; });
    const firsts = found.map((f) => f[0]).filter(Boolean);
    assert.ok(new Set(firsts).size >= firsts.length - 1, `a sheet reuses a lead name: ${firsts}`);
  }
  assert.ok(seen.size >= 120, `${seen.size} different names across 80 sheets`); assert.ok(boysSeen > 200 && girlsSeen > 200, `boys ${boysSeen}, girls ${girlsSeen}`);
  const a = wp.wordProblems(makeRng(5), { grade: 3, op: 'mixed', kind: 'whole', steps: 'mixed', level: 'mixed', count: 10 });
  const b = wp.wordProblems(makeRng(5), { grade: 3, op: 'mixed', kind: 'whole', steps: 'mixed', level: 'mixed', count: 10 });
  assert.deepStrictEqual(a.problems.map((p) => p.text), b.problems.map((p) => p.text));
  const s1 = sp.buildTest(makeRng(9), { grade: 4, test: 12 }); const s2 = sp.buildTest(makeRng(9), { grade: 4, test: 12 });
  assert.deepStrictEqual(s1.key, s2.key);
});

test('he/she always matches the character, and the names are not limited to the original six', () => {
  const orig = new Set(['Zach', 'AC', 'Screech', 'Kelly', 'Lisa', 'Jessie']); let other = 0;
  for (let seed = 1; seed <= 40; seed++) for (const g of [2, 4]) {
    for (const p of wp.wordProblems(makeRng(seed * g), { grade: g, op: 'mixed', kind: 'whole', steps: 'mixed', level: 'mixed', count: 10 }).problems) {
      const present = names.ALL.filter((n) => new RegExp(`\\b${n}\\b`).test(p.text));
      if (present.some((n) => !orig.has(n))) other++;
      if (present.length && present.every((n) => names.GENDER[n] === 'f')) assert.ok(!/\b(he|him|his|himself)\b/i.test(p.text), p.text);
      if (present.length && present.every((n) => names.GENDER[n] === 'm')) assert.ok(!/\b(she|her|hers|herself)\b/i.test(p.text), p.text);
    }
  }
  assert.ok(other > 400, `${other} problems use names beyond the original six`);
});

test('AI prompts hand the writer a fresh set of names from the banks', () => {
  const { buildPrompt } = require('../src/lib/wpAi');
  const prompt = buildPrompt({ grade: 3, count: 4, op: 'mixed', kind: 'whole', steps: 'mixed', level: 'mixed' });
  const m = /boys ([A-Za-z, ]+); girls ([A-Za-z, ]+)\./.exec(prompt); assert.ok(m);
  m[1].split(', ').forEach((n) => assert.strictEqual(names.GENDER[n], 'm')); m[2].split(', ').forEach((n) => assert.strictEqual(names.GENDER[n], 'f'));
});
