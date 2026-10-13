'use strict';

// Grade 3 spiral review: what each numbered practice contains, in order. Each practice follows the matching real
// "Test" page of the 3rd grade sample (practice 1 = Test 1 ... practice 36 = Test 36): the same skills in the same
// order, with numbers, shapes and stories made fresh each time. Boxes holding two short problems are written B(a, b);
// pictures stay in single-problem boxes.
const B = (...parts) => ({ parts: parts.map((p) => (Array.isArray(p) ? p : [p, {}])) });
const one = (id, p = {}) => B([id, p]);
const fn = (op, k) => one('g3Function', { op, ...(k ? { k } : {}) });
const rl = (unit) => one('g3RoundLine', { unit });
const rd = (unit, p = {}) => one('g3Round', { unit, ...p });
const rdp = (unit, p = {}) => ['g3Round', { unit, ...p }];
const clk = (kind = 'read', step = 5) => one('g3Clock', { kind, step });
const pick = (p) => one('g3Shaded', { kind: 'pick', ...p });
const equiv = (p = {}) => one('g3Shaded', { kind: 'equiv', ...p });
const letter = (p = {}) => one('g3FracLetter', p);
const split = (parts, p = {}) => one('g3Partition', { kind: 'split', parts, ...p });
const line = (parts) => one('g3Partition', { kind: 'line', parts });
const isEq = (p = {}) => one('g3Partition', { kind: 'isEqual', ...p });
const poly = (kind, p = {}) => one('g3Polygon', { kind, ...p });
const polyP = (kind, p = {}) => ['g3Polygon', { kind, ...p }];
const prop = (kind, which) => one('g3Property', { kind, ...(which ? { which: [which] } : {}) });
const propP = (kind, which) => ['g3Property', { kind, ...(which ? { which: [which] } : {}) }];
const ff = (kind = 'missing', p = {}) => one('g3FactFamily', { kind, ...p });
const ffP = (kind = 'missing', p = {}) => ['g3FactFamily', { kind, ...p }];
const add = (kind, digits, p = {}) => ['g3Add', { kind, digits, ...p }];
const addOne = (kind, digits, p = {}) => one('g3Add', { kind, digits, ...p });
const mul = (kind, p = {}) => one('g3Mult', { kind, ...p });
const mulP = (kind, p = {}) => ['g3Mult', { kind, ...p }];
const pat = (p = {}) => one('g3Pattern', p);
const patP = (p = {}) => ['g3Pattern', p];
const vr = (kind, p = {}) => one('g3Variable', { kind, ...p });
const word = (kind, p = {}) => one('g3Word', { kind, ...p });
const graph = (kind, q, p = {}) => one('g3Graph', { kind, q, ...p });
const area = (kind, p = {}) => one('g3Area', { kind, ...p });
const meas = () => one('g3Measure');
const units = (kind) => one('g3Units', { kind });
const el = (kind, p = {}) => one('g3Elapsed', { kind, ...p });
const arr = (p = {}) => one('g3Array', p);
const grp = (p = {}) => one('g3GroupsOf', p);
const sets = (p = {}) => one('g3SetsCircle', p);
const rem = (p = {}) => one('g3Remainder', p);
const rep = (dir, p = {}) => one('g3RepeatAdd', { dir, ...p });
const lp = () => one('g3LinePlot');
const div = (p = {}) => ['g3Mult', { kind: 'div', ...p }];
const T = { tens: ['T×D', 'T×D', 'T×D'], tt: ['T×T', 'T×T', 'T×T'] };

module.exports = {
  1: [rl(10), clk('read', 60), one('g3EvenOdd'), sets({ groups: [3, 4], per: [3, 5] }), pick({ d: [2, 4], models: ['pie'] }), grp({ per: [3, 5], groups: [3, 4] }), sets({ groups: [3, 3], per: [3, 3] }), fn('+', [2, 4]), arr({ rows: [2, 4], cols: [3, 6] }), poly('draw', { n: 4, irregular: false })],
  2: [poly('draw', { n: 5, irregular: false }), arr({ rows: [2, 4], cols: [3, 8] }), pick({ d: [3], models: ['bar'] }), one('g3EvenOdd'), fn('−', [2, 5]), grp({ per: [3, 8], groups: [3, 4] }), rl(10), B(add('add', 2, { carry: 'none' }), add('add', 2, { carry: 'none' })), pick({ d: [8], models: ['pie'] }), clk('read', 30)],
  3: [one('g3OnesDigit'), units('volume'), sets({ groups: [2, 4], per: [3, 7] }), pick({ d: [3], models: ['pie', 'bar'] }), units('volume'), B(add('add', 2), add('add', 2)), ff('fill'), fn('−', [10, 10]), poly('isShape', { targets: [7, 8] }), rl(100)],
  4: [rl(100), grp({ per: [4, 5], groups: [4, 5] }), units('volume'), pick({ d: [8], models: ['pie', 'grid'] }), word('addSub'), poly('draw', { n: 8, irregular: false }), poly('isShape', { targets: [4] }), ff('fill'), B(add('add', 3, { carry: 'none' }), add('add', 3, { carry: 'none' })), units('volume')],
  5: [fn('×', [2, 2]), word('addSub'), graph('pict', 'read'), arr({ rows: [4, 6], cols: [5, 7] }), ff('fill'), B(add('add', 3, { carry: 'none' }), add('add', 3, { carry: 'none' })), isEq({ kind: 'isEqual', shapes: ['circle', 'rect'] }), letter({ b: [4], mult: [1] }), one('g3OnesDigit'), ff('toMul')],
  6: [letter({ b: [4], mult: [1], whole: true }), arr({ rows: [4, 5], cols: [5, 8] }), clk('read', 5), one('g3NumberLineMul', { a: [2, 3], b: [2, 4] }), word('sub3'), rd(10), isEq(), graph('pict', 'more'), rd(10), clk('read', 15)],
  7: [pick({ d: [9], models: ['grid'] }), ff('fill', { a: [3, 5], b: [3, 5] }), units('weight'), one('g3NumberLineMul', { a: [3, 5], b: [1, 1] }), prop('circle', 'comm'), clk('read', 5), poly('table'), B(add('sub', 2), add('sub', 2)), poly('draw', { n: 3, irregular: false }), clk('read', 5)],
  8: [fn('−', [5, 5]), grp({ per: [6, 8], groups: [3, 4] }), poly('draw', { n: 4, irregular: false, hint: true }), units('volume'), ff('missing', { pat: 1 }), pick({ d: [9], models: ['pie', 'grid'] }), units('weight'), B(add('sub', 3), add('sub', 3)), poly('story'), prop('circle', 'comm')],
  9: [letter({ mode: 'eighths' }), fn('+', [20, 20]), meas(), isEq({ shapes: ['circle'] }), prop('circle', 'assoc'), grp({ per: [6, 6], groups: [4, 4] }), rd(100), graph('pict', 'read'), meas(), one('g3OnesDigit')],
  10: [split(2, { shapes: ['rect', 'square'] }), meas(), word('groups', { ask: 'solution' }), rep('toMul', { k: [3, 3], n: [4, 4] }), B(add('add', 3), ['g3Round', { unit: 100, count: 1 }]), rd(100), graph('bar', 'read'), word('groups', { ask: 'solution' }), fn('×', [2, 2]), line(4)],
  11: [grp({ per: [9, 9], groups: [4, 4] }), B(propP('circle', 'comm'), propP('circle', 'assoc')), B(ffP('missing'), add('add', 3)), split(4, { shapes: ['circle'] }), fn('×', [4, 4]), rd(100, { digits: [4, 4] }), word('add3'), meas(), word('groups', { ask: 'expression' }), graph('bar', 'more')],
  12: [rd(100, { digits: [4, 4] }), line(7), fn('−', [5, 5]), pick({ d: [6], models: ['pie'], bonus: true }), graph('bar', 'read'), B(propP('circle', 'assoc'), ffP('missing')), poly('quadHow'), word('add3'), word('groups', { ask: 'expression' }), units('volume')],
  13: [equiv({ d: [2, 3], mult: [2] }), pat({ step: [2, 3], start: [2, 3] }), clk('read', 5), meas(), graph('bar', 'more'), B(['g3Variable', { kind: 'add', digits: [2, 2] }], mulP('missing', { zeroOne: true })), B(['g3RepeatAdd', { dir: 'toMul', k: [4, 5], n: [5, 6] }], polyP('sides', { n: [8, 8] })), poly('draw', { n: 5, irregular: true }), units('weight'), ff('toMul')],
  14: [grp({ per: [7, 8], groups: [4, 5] }), meas(), lp(), equiv({ d: [3, 4], mult: [3] }), clk('draw', 1), pick({ d: [3, 4], models: ['pie'] }), B(mulP('tens', { forms: ['D×10', 'D×10', 'D×10'] }), mulP('missing')), area('draw'), split(7, { shapes: ['rect'] }), prop('circle', 'ident')],
  15: [area('grid'), split(8, { shapes: ['circle'] }), word('addSub'), grp({ per: [6, 6], groups: [6, 6] }), equiv({ d: [2, 3], mult: [2, 3] }), pick({ d: [8], models: ['pie'] }), B(ffP('toMul'), mulP('missing')), B(propP('name'), mulP('tens', { forms: ['D×T', 'D×T', 'D×T'] })), word('addSub'), el('elapsed', { dh: [0, 1], dmins: [30, 50] })],
  16: [lp(), area('grid'), split(3, { shapes: ['circle'] }), area('draw', { square: true }), el('pack'), pick({ d: [8], models: ['pie'] }), rd(100, { digits: [4, 4] }), word('addSub', { words: true }), ff('toMul'), mul('missing')],
  17: [B(mulP('tens', { forms: ['T×D', 'T×D', 'T×D'] }), mulP('missing')), equiv({ d: [4, 8], mult: [2] }), area('draw', { square: true }), poly('sides', { n: [6, 6] }), area('grid'), ff('toMul'), lp(), mul('missing'), prop('name', 'ident'), el('elapsed')],
  18: [poly('sides', { n: [7, 7] }), el('elapsed'), B(rdp(100, { count: 3 }), mulP('tens', { forms: ['T×D', 'T×D', 'T×D'] })), mul('div', { forms: ['self', 'one', 'fact'] }), word('groups', { ask: 'equation' }), grp({ per: [6, 6], groups: [6, 6] }), area('draw', { square: true }), area('grid'), equiv({ d: [3], mult: [2] }), pat({ step: [6, 6], start: [3, 3] })],
  19: [rep('toAdd', { k: [6, 8], n: [3, 4] }), equiv({ d: [4, 8], mult: [2] }), area('draw'), poly('draw', { n: 5, irregular: true }), area('grid'), rd(1000, { digits: [4, 4] }), grp({ per: [5, 5], groups: [8, 8] }), split(4, { shapes: ['triangle'] }), line(4), el('elapsed')],
  20: [one('g3Clock', { kind: 'convert' }), poly('isShape', { targets: [4] }), B(['g3Word', { kind: 'share' }], ['g3Pattern', { start: [100, 150], step: [5, 5] }]), area('grid'), area('draw'), rem({ rem: false, askLeft: false, sets: [2, 2] }), B(patP({ start: [100, 150], step: [2, 2] }), rdp(1000, { count: 3 })), equiv({ d: [3, 4], mult: [2, 3] }), units('volume'), B(rep('toAdd', {}).parts[0], mulP('div', { forms: ['fact', 'fact', 'one'] }))],
  21: [graph('bar', 'read', { id: 'farm' }), ff('missing', { pat: 1 }), poly('draw', { n: 7, irregular: false }), rem({ rem: false, sets: [4, 4] }), area('model'), area('grid'), equiv({ d: [4, 6], mult: [2] }), letter({ b: [4], mult: [2] }), lp(), word('groups', { ask: 'equation' })],
  22: [lp(), ff('toDiv'), isEq({ shapes: ['circle'] }), word('share'), letter({ b: [4], mult: [3] }), split(5, { shapes: ['rect'], draw: true }), B(ffP('missing'), patP({ start: [350, 352], step: [2, 2] })), area('grid', { square: true }), prop('circle', 'comm'), B(rdp(1000, { count: 3 }), div())],
  23: [one('g3Shaded', { kind: 'write', full: true }), B(['g3RepeatAdd', { dir: 'toAdd', k: [4, 5], n: [4, 5] }], mulP('tens', { forms: ['T×D', 'T×D', 'T×D'] })), B(['g3Word', { kind: 'addSub', ask: 'expression' }], patP({ start: [225, 225], step: [100, 100] })), word('add3'), prop('name', 'comm'), lp(), B(['g3Word', { kind: 'share' }], ffP('missing')), graph('bar', 'more', { id: 'trees' }), area('grid'), B(ffP('toDiv'), ['g3Partition', { kind: 'isEqual', shapes: ['grid'] }])],
  24: [one('g3Clock', { kind: 'convert' }), B(['g3Variable', { kind: 'sub', digits: [3, 3] }], ['g3Partition', { kind: 'isEqual', shapes: ['circle'] }]), B(ffP('toDiv'), mulP('tens', { forms: ['T×T', 'T×T', 'D×T'] })), area('draw'), area('model'), rem({ rem: false, sets: [3, 3] }), B(['g3RepeatAdd', { dir: 'toAdd', k: [7, 7], n: [4, 4] }], ffP('missing')), prop('name', 'ident'), word('estimate'), word('twoSets')],
  25: [rem({ rem: false, sets: [3, 3] }), poly('isShape', { targets: [3] }), letter({ b: [4], mult: [2] }), B(ffP('toMul'), ['g3Variable', { kind: 'sub', digits: [3, 3] }]), word('estimate'), one('g3Clock', { kind: 'convert' }), area('model'), B(mulP('tens', { forms: ['H×D', 'T×T', 'D×H'] }), mulP('div')), area('draw'), units('weight')],
  26: [word('estimate'), el('pack'), poly('draw', { n: 6, irregular: false }), units('volume'), area('both'), rem({ rem: false, sets: [4, 4] }), B(mulP('tens', { forms: ['T×T', 'T×T', 'T×T'] }), mulP('div')), prop('equal'), rep('toAdd', { k: [6, 6], n: [5, 5] }), word('groups', { ask: 'plain' })],
  27: [area('grid'), word('friends', { ask: 'equation' }), one('g3Shaded', { kind: 'write' }), graph('bar', 'more', { id: 'stores' }), lp(), units('weight'), B(ffP('missing'), patP({ start: [5, 5], step: [5, 5] })), rep('toAdd', { k: [6, 6], n: [5, 5] }), letter({ b: [3], mult: [2] }), poly('vertices', { n: [8, 8] })],
  28: [lp(), B(patP({ start: [15, 15], step: [5, 5] }), mulP('div')), equiv({ d: [4, 6], mult: [2] }), graph('bar', 'more', { id: 'aquarium' }), units('weight'), word('add3'), word('estimate'), letter({ b: [3], mult: [2] }), area('grid'), word('friends', { ask: 'equation' })],
  29: [area('comp'), word('friends', { ask: 'equation' }), isEq({ shapes: ['circle'] }), lp(), letter({ b: [2], mult: [4] }), one('g3Shaded', { kind: 'twoEquiv' }), word('twoSets'), word('add3'), graph('bar', 'more', { id: 'pies' }), prop('notEqual')],
  30: [equiv({ d: [4, 6], mult: [2] }), B(mulP('tens', { forms: ['T×T', 'T×T', 'T×T'] }), ffP('missing')), word('friends', { ask: 'equation' }), units('weight'), rem({ sets: [4, 4] }), lp(), word('twoSets'), letter({ b: [4], mult: [4], maxD: 16 }), area('comp'), word('estimate')],
  31: [word('add3'), B(ffP('toDiv'), mulP('div')), el('end'), area('comp'), area('grid'), lp(), rem({ sets: [3, 5] }), word('cars'), equiv({ d: [4], mult: [2] }), B(mulP('tens', { forms: ['T×T', 'T×T', 'T×T'] }), propP('equal'))],
  32: [area('grid'), mul('tens', { forms: ['T×T', 'T×T', 'T×T'] }), units('volume'), isEq({ shapes: ['grid'] }), ff('missing', { pat: 1 }), lp(), equiv({ d: [4], mult: [2] }), word('add3'), B(rep('toAdd', {}).parts[0], mulP('div')), B(mulP('div'), patP({ start: [49, 49], step: [7, 7], down: true }))],
  33: [graph('bar', 'more', { id: 'games' }), prop('notEqual'), B(patP({ start: [60, 60], step: [5, 5], down: true }), mulP('tens', { forms: ['D×H', 'T×T', 'H×D'] })), ff('missing'), rep('toAdd', { k: [3, 3], n: [6, 6] }), area('grid'), area('draw', { square: true }), word('friends', { ask: 'equation' }), letter({ b: [2, 4], mult: [4], whole: true }), isEq({ shapes: ['grid'] })],
  34: [letter({ b: [4], mult: [3], maxD: 12 }), one('g3Shaded', { kind: 'twoEquiv' }), word('friends', { ask: 'equation' }), poly('draw', { n: 7, irregular: false }), rem({ sets: [3, 3] }), ff('missing'), rep('toAdd', { k: [7, 7], n: [6, 6] }), graph('bar', 'more', { id: 'tshirt' }), area('comp'), word('estimate')],
  35: [area('draw'), word('estimate'), word('friends', { ask: 'equation' }), el('start'), one('g3Shaded', { kind: 'compare', models: ['pie'] }), rem({ sets: [3, 3] }), area('comp'), graph('bar', 'more', { horizontal: true }), letter({ b: [2], mult: [8], maxD: 16 }), B(ffP('toDiv'), propP('notEqual'))],
  36: [graph('bar', 'more', { id: 'supply' }), prop('notEqual'), poly('draw', { n: 7, irregular: false }), word('friends', { ask: 'equation' }), area('comp'), lp(), letter({ b: [2], mult: [10], maxD: 20 }), one('g3Shaded', { kind: 'compare', models: ['pie'] }), B(ffP('toDiv'), ['g3Variable', { kind: 'subVar' }]), el('end')],
};
