'use strict';

// More demanding situations: pouring fractions together, digit puzzles, working backwards, receipts, comparing plans and
// "a fraction of what is left". These read less like "A has X, B has Y" and ask the student to plan the steps.
module.exports = function register(t, H) {
  const { int, pick, shuffle, fmt, F } = H;
  const { reg, money, dollars, cap } = H.sit;

  // ---------- pouring and regrouping fractions ----------
  const VESSELS = [
    ['water bottle', 'water bottles', 'water'], ['juice jug', 'juice jugs', 'juice'], ['milk jug', 'milk jugs', 'milk'], ['paint can', 'paint cans', 'paint'], ['watering can', 'watering cans', 'water'],
  ];
  reg('sit-pour-together', { ops: ['mul', 'div'], kind: 'fraction', steps: 2, level: 2, grades: [4, 5] }, (r, c, g) => {
    const [v1, vp, stuff] = pick(r, VESSELS);
    if (g === 5 && r() < 0.5) {
      const d1 = pick(r, [2, 4]); const a1 = int(r, 1, d1 - 1); const n1 = int(r, 2, 6); const d2 = pick(r, [2, 4]); const a2 = int(r, 1, d2 - 1); const n2 = int(r, 2, 6);
      const total = F.add(F.mul(F.frac(n1, 1), F.frac(a1, d1)), F.mul(F.frac(n2, 1), F.frac(a2, d2)));
      const whole = Math.floor(total.n / total.d); const rem = F.sub(total, F.frac(whole, 1));
      return { story: `${c.A.name} has ${n1} ${vp} that are each ${a1}/${d1} full of ${stuff}, and ${n2} more ${vp} that are each ${a2}/${d2} full. ${c.A.S} pours all of the ${stuff} together.`, question: `How many ${vp} can ${c.A.s} fill all the way? How much is left over?`, answer: `${whole} ${vp}${rem.n ? `, with ${F.show(rem)} of a ${v1} left over` : ''}`, eq: '', meta: { op: 'pour-two', n1, a1, d1, n2, a2, d2 } };
    }
    const d = pick(r, [2, 3, 4, 5, 6, 8]); const a = int(r, 1, d - 1); const n = Math.max(int(r, 3, 12), Math.ceil(d / a));
    const total = F.mul(F.frac(n, 1), F.frac(a, d)); const whole = Math.floor(total.n / total.d); const rem = F.sub(total, F.frac(whole, 1));
    return { text: `There are ${n} ${vp}, and each ${v1} is ${a}/${d} full of ${stuff}. If we pour all the ${stuff} together, how many ${vp} can be filled all the way?${rem.n ? ` How much of another ${v1} is left?` : ''}`, answer: `${whole} ${vp}${rem.n ? `, with ${F.show(rem)} of a ${v1} left over` : ''}`, meta: { op: 'pour', n, a, d } };
  });

  // ---------- number puzzles ----------
  const DIG = { 3: 3, 4: 5, 5: 5 }; // digits in the puzzle number: within the numbers each grade works with
  reg('sit-digits-puzzle', { ops: ['sub', 'add'], kind: 'whole', steps: 2, level: 2, grades: [3, 5] }, (r, c, g) => {
    const len = DIG[g]; let digits;
    do { digits = Array.from({ length: len }, () => int(r, 0, 9)); } while (new Set(digits).size < Math.min(4, len) || digits[0] === 0);
    const num = Number(digits.join('')); const desc = [...digits].sort((x, y) => y - x); const asc = [...digits].sort((x, y) => x - y);
    const high = Number(desc.join('')); const nz = asc.findIndex((d) => d > 0); const lowDigits = [asc[nz], ...asc.filter((_, i) => i !== nz)]; const low = Number(lowDigits.join(''));
    const A = c.A.name; const B = c.B.name; const kind = int(r, 0, 2);
    const lead = pick(r, [`${A} wrote the number ${fmt(num)} on a sticky note.`, `${A} picked the number ${fmt(num)} for a game.`]);
    if (kind === 0) return { story: `${lead} ${c.A.S} challenged ${B} to rearrange the digits to create the highest possible number.`, question: `What number did ${B} make?`, answer: fmt(high), meta: { op: 'digits-high', num, ans: high } };
    if (kind === 1) return { story: `${lead} ${c.A.S} challenged ${B} to rearrange all of the digits to make the smallest number possible. A number cannot start with 0.`, question: `What number did ${B} make?`, answer: fmt(low), meta: { op: 'digits-low', num, ans: low } };
    return { story: `${lead} ${B} rearranges the digits to make the greatest number and then the least number possible. A number cannot start with 0.`, question: `What is the difference between ${B}'s two numbers?`, answer: fmt(high - low), eq: `${fmt(high)} − ${fmt(low)} = ?`, meta: { op: 'digits-diff', num, high, low, ans: high - low } };
  });

  // ---------- working backwards ----------
  reg('sit-backwards', { ops: ['sub', 'mul', 'add'], kind: 'whole', steps: 3, level: 2, grades: [3, 5] }, (r, c, g) => {
    const left = int(r, g === 3 ? 5 : 8, g === 3 ? 30 : 60); const spent = int(r, 4, g === 3 ? 25 : 45); const start = (left + spent) * 2;
    const [thing, thing2] = pick(r, [['a skateboard helmet', 'a snack'], ['a pair of sneakers', 'lunch'], ['a puzzle', 'a bus ticket'], ['a kite', 'ice cream'], ['a water bottle', 'a sandwich']]);
    return { story: `${c.A.name} had some money from mowing lawns. ${c.A.S} spent half of it on ${thing}. Then ${c.A.s} spent $${spent} on ${thing2}. Now ${c.A.s} has $${left} left.`, question: `How much money did ${c.A.s} have at the start?`, answer: `$${start}`, eq: `(${left} + ${spent}) × 2 = ?`, wrong: { value: `$${left + spent}`, mistake: `The half that was spent on the first item has to be doubled back, too.` }, meta: { op: 'backwards', left, spent, start } };
  });

  // ---------- receipts ----------
  const RECEIPTS = [
    { shop: 'a farm stand', items: [['Sweet corn (dozen)', 600], ['Peaches (basket)', 450], ['Honey (jar)', 800], ['Pumpkin', 500], ['Apple cider (jug)', 550]] },
    { shop: 'a camping store', items: [['Water bottle', 950], ['Trail map', 400], ['Sunscreen', 850], ['Bug spray', 725], ['Flashlight', 1150]] },
    { shop: 'a pet store', items: [['Dog toy', 650], ['Cat treats', 475], ['Fish food', 325], ['Chew bone', 400], ['Leash', 1200]] },
    { shop: 'a bike shop', items: [['Bike bell', 550], ['Patch kit', 400], ['Reflector set', 650], ['Water bottle', 700], ['Tire pump', 1500]] },
  ];
  reg('sit-receipt', { ops: ['mul', 'add', 'sub'], kind: 'decimal', steps: 4, level: 2, grades: [4, 5] }, (r, c) => {
    const rc = pick(r, RECEIPTS); const rows = shuffle(r, rc.items).slice(0, 3).map(([n, p]) => ({ n, p, q: int(r, 1, 4) }));
    const total = rows.reduce((s, x) => s + x.p * x.q, 0); const bill = Math.ceil((total + 100) / 1000) * 1000;
    const table = { title: `Receipt from ${rc.shop}`, head: ['Item', 'Number', 'Price each'], rows: rows.map((x) => [x.n, String(x.q), money(x.p)]) };
    if (r() < 0.5) return { story: `${c.A.name} buys these things at ${rc.shop}.`, table, question: 'What is the total cost?', answer: money(total), eq: rows.map((x) => `${x.q} × ${money(x.p)}`).join(' + ') + ' = ?', meta: { op: 'receipt-total', rows, total } };
    return { story: `${c.A.name} buys these things at ${rc.shop} and pays with ${dollars(bill)}.`, table, question: 'How much change does ' + c.A.s + ' get back?', answer: money(bill - total), eq: `${dollars(bill)} − (${rows.map((x) => `${x.q} × ${money(x.p)}`).join(' + ')}) = ?`, meta: { op: 'receipt-change', rows, total, bill } };
  });

  // ---------- comparing two plans ----------
  reg('sit-plan-compare', { ops: ['mul', 'add', 'sub'], kind: 'whole', steps: 4, level: 2, grades: [5, 5] }, (r, c) => {
    const place = pick(r, [['a climbing gym', 'visit', 'visits'], ['a swim club', 'visit', 'visits'], ['a skate park', 'visit', 'visits'], ['a music studio', 'lesson', 'lessons']]);
    let fee; let a; let b; let v; let costA; let costB;
    do { fee = pick(r, [10, 15, 20, 24, 30]); a = int(r, 3, 7); b = a + int(r, 2, 5); v = int(r, 4, 10); costA = fee + a * v; costB = b * v; } while (costA === costB);
    const cheaper = costA < costB ? 'Plan A' : 'Plan B';
    return { story: `${c.A.name} is joining ${place[0]}. Plan A costs $${fee} to sign up plus $${a} for every ${place[1]}. Plan B costs $${b} for every ${place[1]} with no sign-up fee. ${c.A.S} expects to go ${v} ${place[2]}.`, question: 'Which plan costs less, and how much less?', answer: `${cheaper}, by $${Math.abs(costA - costB)} (Plan A: $${costA}, Plan B: $${costB})`, meta: { op: 'plan-compare', fee, a, b, v, costA, costB } };
  });

  // ---------- a fraction of what is left ----------
  reg('sit-fraction-of-left', { ops: ['mul', 'div', 'sub'], kind: 'fraction', steps: 3, level: 2, grades: [5, 5] }, (r, c) => {
    const d1 = pick(r, [2, 3, 4, 5]); const d2 = pick(r, [2, 3, 4, 5]); const k = int(r, 1, 4); const total = d1 * d2 * k;
    const used1 = total / d1; const rem1 = total - used1; const used2 = rem1 / d2; const left = rem1 - used2;
    const [what, units, uses] = pick(r, [['ribbon', ['foot', 'feet'], ['a gift', 'a wreath']], ['rope', ['foot', 'feet'], ['a swing', 'a clothesline']], ['trail mix', ['cup', 'cups'], ['a hike', 'a picnic']], ['fabric', ['yard', 'yards'], ['a cape', 'a banner']]]);
    return { story: `${c.A.name} has ${total} ${units[1]} of ${what}. ${c.A.S} uses 1/${d1} of it for ${uses[0]}. Then ${c.A.s} uses 1/${d2} of what is left for ${uses[1]}.`, question: `How many ${units[1]} of ${what} are left?`, answer: `${left} ${left === 1 ? units[0] : units[1]}`, eq: '', meta: { op: 'fraction-of-left', total, d1, d2, left } };
  });
  void cap;
};
