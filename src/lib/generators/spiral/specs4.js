'use strict';

// Grade 4 spiral review: what each numbered practice contains, in order. Each practice follows the matching real
// "Test" page of the 4th grade sample (practice N = Test N): the same skills in the same order, with numbers, shapes and
// stories made fresh each time. Where the sample used a drag-and-drop or typed answer the box asks for a written one.
const B = (...parts) => ({ parts: parts.map((p) => (Array.isArray(p) ? p : [p, {}])) });
const one = (id, p = {}) => B([id, p]);
const vm = (a, b) => ['vmul', { a, b }];
const ld = (divisor, quotient, rem = false) => ['ldiv', { divisor, quotient, rem }];
const ldv = (d, q, rem = false) => ld([d, d], q, rem);
const frac = (p) => ['fracOp', { label: false, den: 'like', maxDen: 12, ...p }];
const add = (a, b) => ['g4AddSub', { op: 'add', a, b }];
const sub = (a, b) => ['g4AddSub', { op: 'sub', a, b }];
const rnd = (unit, extra = {}) => one('g4Round', { unit, list: true, ...extra });
const eq = (kind) => one('g4Equation', { kind });
const times = (k, forms) => one('g4TimesGreater', { k, ...(forms ? { forms } : {}) });
const pdiv = (count = 3) => one('g4PlaceDiv', { count });
const cmpN = (digits, kinds) => one('g4Compare', { digits, ...(kinds ? { kinds } : {}) });
const cmpF = (kinds) => one('g4CompareFrac', { kinds });
const cmpD = () => one('g4CompareDec');
const w2 = (kind) => one('g4Word2', { kind });
const fw = (kind) => one('g4FracWord', { kind });
const fo = (p) => frac(p);
const mixed = (op, p = {}) => frac({ op, mixed: true, bonus: 'reduce', noBorrow: false, ...p });
const lp = (q) => one('g4LinePlotQ', { q });
const ang = (kind) => one('g4AngleNamed', { kind });
const meas = () => one('g4MeasureAngle');
const shape = (kind) => one('g4ShapeSet', { kind });
const dec = (count) => one('g4DecList', { count });
const addM = (a, b) => ['g4AddSub', { op: 'add', a, b }];
const unit = (kind) => one('g4UnitTable', { kind });
const conv = (kind) => one('g4Convert', { kind });
const dm = (kind) => one('g4DecomposeFrac', { kind });

const RAW = {
  1: [B(['g4WordToStd', { digits: [4, 5] }], ['g4Expanded', { digits: [4, 5], reverse: true }]), times([10, 100]), one('g4LineRel'), one('g4MultiStep', { kind: 'sub3' }), rnd(100), eq('times'), one('g4EquivMissing'), unit('m-mm'), times([10, 100], ['larger', 'larger']), eq('times')],
  2: [one('g4Expanded', { digits: [5, 5] }), one('g4MultiStep', { kind: 'sub3' }), one('g4Angles'), times([100, 100]), one('g4MatchUnits', { set: 'time' }), cmpF(['sameDen', 'sameNum']), one('g4EquivMissing'), rnd(100), cmpN([4, 5]), one('g4Equiv')],
  3: [one('g4Patterns', { kind: 'add' }), one('g4Expanded', { digits: [6, 6], reverse: true }), cmpF(['sameDen', 'sameNum']), one('g4Angles'), B(add(3, 3), add(3, 3)), rnd(1000), one('g4EquivMissing'), one('g4TimeSum'), cmpN([3, 4]), one('g4CreateFrac')],
  4: [one('g4CreateFrac'), rnd(1000), one('g4EquivNL'), shape('quad'), one('g4Angles'), B(add(3, 3), add(3, 3)), one('g4RulePattern', { kind: 'shape' }), conv('gal-qt'), unit('kg-g'), shape('right')],
  5: [w2('roundTrip'), one('g4Vertices'), one('g4EquivLine'), B(add(3, 3), sub(3, 3)), B(vm([2, 2], [1, 1]), vm([2, 2], [1, 1])), times([100, 1000]), one('g4LinePoints', { pick: 3 }), eq('groups'), one('g4LineRel'), one('g4TimeSum')],
  6: [
    one('g4Convert', { kind: 'cups-pt' }),
    one('g4Vertices'),
    one('g4Compare'),
    B(vm([2, 2], [1, 1]), vm([2, 2], [1, 1])),
    B(add(4, 3), sub(4, 3)),
    one('g4Equation', { kind: 'times' }),
    one('g4MultiStep', { kind: 'sub3' }),
    one('g4EquivLine'),
    one('g4Convert', { kind: 'yd-ft' }),
    one('g4Equation', { kind: 'twice' }),
  ],
  7: [
    one('g4Equation', { kind: 'share' }),
    one('g4MatchUnits', { set: 'time' }),
    one('g4LinePoints', { pick: 0 }),
    one('g4Round', { unit: 10000, list: true }),
    B(sub(4, 3), add(4, 4)),
    one('g4Equiv'),
    one('g4Perimeter'),
    one('g4UnitTable', { kind: 'm-mm' }),
    one('g4Angles'),
    one('g4Triangles'),
  ],
  8: [one('g4PolyTable'), one('g4MatchUnits', { set: 'length' }), rnd(10000), one('g4FracBars', { op: 'add' }), eq('times'), one('g4AreaPerim'), cmpF(['sameDen']), unit('lb-oz'), cmpF(['sameNum']), one('g4Factors', { kind: 'multiples' })],
  9: [rnd(10000), one('g4SymLetter'), one('g4AreaPerim'), one('g4FracBars', { op: 'add' }), eq('times'), B(sub(4, 4), add(5, 4)), one('g4Patterns', { kind: 'add' }), eq('times'), one('g4Patterns', { kind: 'add' }), B(ldv(2, [10, 99]), ldv(3, [10, 99]))],
  10: [B(vm([2, 2], [1, 1]), ldv(2, [10, 99])), times([10000, 10000], ['greater', 'larger']), fo({ op: 'add', bonus: 'reduce' }), one('g4LineRel'), B(['g4Factors', { kind: 'multiples' }], ['g4Factors', { kind: 'multiples' }]), one('g4Factors', { kind: 'circlePrime' }), one('g4PolyTable'), cmpF(['sameDen']), eq('groups'), one('g4AreaPerim')],
  11: [B(ldv(4, [10, 99]), ldv(6, [10, 99])), fo({ op: 'add', bonus: 'reduce' }), one('g4AreaPerim'), cmpN([5, 7]), one('g4SymLetter'), lp('less'), B(['g4Factors', { kind: 'multiples' }], ['g4Factors', { kind: 'circlePrime' }]), dm('blank'), one('g4WordToStd', { digits: [7, 7] }), eq('times')],
  12: [dm('ways'), B(vm([3, 3], [1, 1]), ldv(4, [10, 99])), mixed('add'), eq('groups'), one('g4FracDecimal', { kind: 'tenth' }), w2('mulAdd'), one('g4LineRel'), lp('less'), one('g4MultiStep', { kind: 'mulAdd' }), one('g4SymLetter')],
  13: [one('g4PolyTable'), one('g4FracDecimal', { kind: 'tenthsToHundredths' }), one('g4FracDecimal', { kind: 'tenthsToHundredths' }), w2('mulAdd'), B(['g4Factors', { kind: 'multiples' }], ['g4Factors', { kind: 'circlePrime' }]), meas(), rnd(100000), B(add(5, 5), sub(4, 4)), one('g4EquivMissing'), fw('addLike')],
  14: [meas(), B(['g4Factors', { kind: 'list' }], ['g4Factors', { kind: 'prime' }]), one('g4SymLetter'), fw('addLike'), one('g4FracDecimal', { kind: 'tenthsToHundredths' }), B(mixed('sub'), mixed('add')), ang('measure'), pdiv(3), one('g4RulePattern', { kind: 'twoStep' }), one('g4FracDecimal', { kind: 'tenth' })],
  15: [meas(), w2('timesMore'), shape('congruent'), fw('addLike'), rnd(10, { digits: [6, 6] }), B(fo({ op: 'add', bonus: 'reduce' }), fo({ op: 'add' })), cmpD(), pdiv(3), dec(3), one('g4NumToWord', { digits: [6, 6] })],
  16: [meas(), eq('groups'), shape('obtuse'), cmpD(), one('g4MulWhole', {}), B(sub(5, 5), sub(5, 5)), fw('addLike'), rnd(10, { digits: [6, 6] }), B(fo({ op: 'add', bonus: 'reduce' }), fo({ op: 'add' })), one('g4WordToStd', { digits: [5, 5] })],
  17: [B(sub(6, 5), add(5, 5)), w2('half'), mixed('add'), rnd(10, { digits: [6, 6] }), B(['g4Factors', { kind: 'list' }], ['g4Factors', { kind: 'prime' }]), B(fo({ op: 'add', bonus: 'reduce' }), fo({ op: 'add' })), B(vm([3, 3], [1, 1]), vm([3, 3], [1, 1])), one('g4TenthsHund'), w2('roundTrip'), one('g4LineRel')],
  18: [B(sub(6, 6), add(6, 6)), unit('gal-qt'), one('g4Factors', { kind: 'list' }), mixed('add'), one('g4RulePattern', { kind: 'twoStep' }), B(vm([3, 3], [1, 1]), vm([3, 3], [1, 1])), B(ldv(6, [10, 99]), ldv(7, [10, 99])), one('g4TenthsHund'), one('g4Factors', { kind: 'list' }), lp('less')],
  19: [B(['vmul', { a: [2, 2], b: 10 }], ldv(5, [100, 199])), lp('diff'), ang('measure'), one('g4RulePattern', { kind: 'twoStep' }), pdiv(4), one('g4TenthsHund2'), dec(4), one('g4ShadeMult'), cmpD(), w2('mulAdd')],
  20: [one('g4UnitMul'), mixed('add'), lp('less'), cmpD(), ang('measure'), B(ldv(3, [100, 399]), ldv(6, [100, 199])), dec(4), pdiv(4), one('g4ShadeMult'), one('g4RulePattern', { kind: 'twoStep' })],
  21: [rnd(100000), mixed('add'), one('g4TimeSum'), one('g4UnitMul'), one('g4ShadeMult'), one('g4MatchUnits', { set: 'length' }), B(one('g4MulWhole').parts[0], w2('mulAdd').parts[0]), B(sub(6, 6), add(6, 6)), one('g4LineRel'), meas()],
  22: [cmpN([6, 6]), shape('acute'), one('g4PerimVar'), one('g4UnitMul'), fw('subLeft'), rnd(100000), w2('allowance'), B(fo({ op: 'add', bonus: 'reduce' }), add(6, 6)), B(['g4AngleAdd', {}], ['g4Factors', { kind: 'list' }]), dm('ways')],
  23: [one('g4RulePattern', { kind: 'twoStep' }), B(dec(3).parts[0], pdiv(4).parts[0]), shape('obtuse'), B(vm([2, 2], [2, 2]), vm([2, 2], [2, 2])), cmpD(), cmpN([7, 7]), lp('less'), one('g4EquivMul'), one('g4TenthsHund2'), B(['g4Factors', { kind: 'list' }], ['g4Factors', { kind: 'prime' }])],
  24: [cmpD(), B(sub(6, 6), add(6, 6)), rnd(100), one('g4AngleAdd'), pdiv(4), w2('timesMore'), meas(), w2('mulAdd'), fw('addLike'), B(mixed('sub'), ['g4CompareFrac', { kinds: ['unlike'] }])],
  25: [cmpN([6, 6]), B(vm([2, 2], [2, 2]), ldv(6, [100, 199])), one('g4AngleAdd'), eq('groups'), meas(), one('g4EquivMul'), fw('subLeft'), one('g4FracWordMul'), cmpF(['sameNum', 'sameDen']), shape('verts4')],
  26: [rnd(10000), one('g4EquivMul'), one('g4AngleAdd'), one('g4MultiStep', { kind: 'groupsLeft' }), mixed('sub'), ang('measure'), one('g4TimeSum'), dec(3), cmpD(), eq('times')],
  27: [B(sub(6, 6), add(6, 6)), one('g4PerimVar'), one('g4FracWordMul'), eq('times'), mixed('add'), B(one('g4MulWhole').parts[0], B(vm([2, 2], [2, 2])).parts[0]), w2('half'), one('g4TenthsHund2'), unit('kg-g'), fw('addLike')],
  28: [B(vm([2, 2], [2, 2]), ldv(4, [100, 299])), lp('diff'), ang('measure'), one('g4RulePattern', { kind: 'twoStep' }), w2('divMinus'), pdiv(4), dm('ways'), one('g4TenthsHund2'), one('g4ShadeMult'), fw('sub3')],
  29: [pdiv(4), B(ldv(3, [100, 399]), vm([2, 2], [2, 2])), mixed('sub'), one('g4RulePattern', { kind: 'twoStep' }), w2('divMinus'), dec(4), dm('ways'), one('g4TenthsHund2'), fw('sub3'), lp('outlier')],
  30: [B(vm([2, 2], [2, 2]), ldv(6, [100, 199])), lp('diff'), one('g4AngleAdd'), one('g4RulePattern', { kind: 'twoStep' }), one('g4FracWordMul'), eq('times'), dm('ways'), B(sub(6, 5), mixed('sub')), one('g4ShadeMult'), cmpN([5, 7])],
  31: [B(one('g4Factors', { kind: 'list' }).parts[0], w2('saveFrac').parts[0]), rnd(100000), one('g4AngleAdd'), one('g4PerimVar'), one('g4ShadeMult'), B(one('g4MulWhole').parts[0], mixed('add')), unit('m-mm'), ang('type'), cmpN([6, 7]), w2('divMinus')],
  32: [rnd(1000), eq('times'), meas(), cmpF(['sameNum', 'sameDen', 'bench']), cmpD(), one('g4EquivMul'), unit('ft-in'), ang('type'), w2('saveFrac'), one('g4MulWhole')],
  33: [one('g4TimeSum'), mixed('add'), eq('times'), ang('measure'), fw('addLike'), cmpD(), B(sub(6, 6), add(6, 6)), one('g4TenthsHund2'), one('g4Factors', { kind: 'list' }), pdiv(4)],
  34: [w2('divMinus'), cmpF(['sameNum', 'sameDen', 'unlike']), mixed('add'), dec(4), one('g4ClassifyTri', {}), B(sub(6, 6), add(6, 6)), one('g4PerimVar'), one('g4SymLetter'), one('g4TenthsHund2'), one('g4Factors', { kind: 'list' })],
  35: [mixed('add'), B(vm([3, 3], [1, 1]), ldv(7, [100, 199])), pdiv(4), eq('groups'), one('g4RulePattern', { kind: 'twoStep' }), one('g4AreaPerim'), one('g4ShadeMult'), ang('type'), cmpF(['sameNum', 'sameDen', 'bench']), rnd(10000)],
  36: [eq('groups'), one('g4RulePattern', { kind: 'twoStep' }), cmpN([6, 7]), one('g4EquivMul'), cmpF(['sameNum', 'sameDen', 'bench']), mixed('sub'), lp('diff'), B(vm([2, 2], [2, 2]), ldv(4, [100, 299])), ang('measure'), dec(4)],
};

// a bare part (such as a fraction operation written with frac(...)) stands for a one-part box
module.exports = Object.fromEntries(Object.entries(RAW).map(([k, v]) => [k, v.map((b) => (Array.isArray(b) ? B(b) : b))]));
