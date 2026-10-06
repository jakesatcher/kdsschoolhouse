'use strict';

// Whole-number scenes. Ranges are chosen per scene so the numbers are believable for what is being counted
// (pages in a chapter book, riders on a city bus, fans at a high-school game), then grouped by grade.
module.exports = function register(t, H) {
  const { int, pick, fmt, ORD } = H;
  const R = (r, spec, g) => { const [lo, hi] = Array.isArray(spec) ? spec : spec[g]; return int(r, lo, hi); };
  const money = (n) => `$${fmt(n)}`;

  // ---------- one-step builders ----------
  const addStory = (id, grades, A, B, text) => t({ id, ops: ['add'], kind: 'whole', steps: 1, grades, make: (r, c, g) => {
    const a = R(r, A, g);
    const bSpec = Array.isArray(B) ? B : B[g];
    const b = int(r, bSpec[0], g === 1 ? Math.min(bSpec[1], 20 - a) : bSpec[1]); // first grade stays within 20
    return { text: text(c, fmt(a), fmt(b)), answerText: fmt(a + b) };
  } });
  const subStory = (id, grades, A, B, text) => t({ id, ops: ['sub'], kind: 'whole', steps: 1, grades, make: (r, c, g) => {
    const a = R(r, A, g);
    const bSpec = Array.isArray(B) ? B : B[g];
    const hi = Math.min(bSpec[1], a - 1);
    const b = int(r, Math.min(bSpec[0], hi), hi);
    return { text: text(c, fmt(a), fmt(b)), answerText: fmt(a - b) };
  } });
  const mulStory = (id, grades, A, B, text) => t({ id, ops: ['mul'], kind: 'whole', steps: 1, grades, make: (r, c, g) => {
    const a = R(r, A, g); const b = typeof B === 'function' ? B(r, g) : R(r, B, g);
    return { text: text(c, fmt(a), fmt(b), g), answerText: fmt(a * b) };
  } });
  const divStory = (id, grades, Q, K, text) => t({ id, ops: ['div'], kind: 'whole', steps: 1, grades, make: (r, c, g) => {
    const k = R(r, K, g); const q = R(r, Q, g);
    return { text: text(c, fmt(k * q), fmt(k), g), answerText: fmt(q) };
  } });

  // ======================= ADDING (join, combine) =======================
  addStory('add-ducks', [1, 1], [5, 12], [2, 8], ({ A }, a, b) => `${a} ducks were swimming in the pond. Then ${b} more ducks landed on the water. How many ducks are on the pond now?`);
  addStory('add-flowers', [1, 2], { 1: [4, 9], 2: [15, 35] }, { 1: [2, 8], 2: [10, 30] }, ({ A }, a, b) => `${A} picked ${a} flowers from the garden before lunch and ${b} more after lunch. How many flowers did ${A.s} pick in all?`);
  addStory('add-blocks', [1, 2], { 1: [4, 10], 2: [12, 30] }, { 1: [3, 8], 2: [10, 28] }, ({ A, B }, a, b) => `${A} and ${B} are building a block tower. ${A} stacks ${a} blocks, and ${B} stacks ${b} blocks. How many blocks are in the tower?`);
  addStory('add-beads', [1, 2], { 1: [4, 10], 2: [18, 40] }, { 1: [3, 9], 2: [12, 30] }, ({ A }, a, b) => `${A} is making a bracelet. ${A.S} uses ${a} blue beads and ${b} red beads. How many beads are on the bracelet?`);
  addStory('add-jump-rope', [2, 2], [18, 45], [12, 40], ({ A }, a, b) => `Before the bell rang, ${A} jumped rope ${a} times without stopping. After a short rest, ${A.s} jumped ${b} more times. How many jumps was that in all?`);
  addStory('add-cafeteria-fruit', [2, 3], { 2: [30, 55], 3: [120, 220] }, { 2: [20, 40], 3: [90, 200] }, (c, a, b) => `For lunch today, the cafeteria put out ${a} apples and ${b} oranges. How many pieces of fruit did the cafeteria put out?`);
  addStory('add-pennies', [3, 3], [140, 360], [40, 150], ({ A }, a, b) => `${A} dumped out ${A.p} penny jar and counted ${a} pennies. Then ${A.s} found ${b} more pennies under the couch cushions. How many pennies does ${A.s} have now?`);
  addStory('add-museum', [3, 3], [220, 480], [180, 420], (c, a, b) => `Families visited the science museum all weekend. ${a} people came on Saturday, and ${b} people came on Sunday. How many people visited the museum that weekend?`);
  addStory('add-pages-two-weeks', [3, 3], [60, 160], [70, 180], ({ A }, a, b) => `${A} is reading a long chapter book. ${A.S} read ${a} pages last week and ${b} pages this week. How many pages has ${A.s} read in the two weeks?`);
  addStory('add-can-drive', [3, 3], [80, 200], [90, 210], (c, a, b) => `Room 4 and Room 7 are competing in a can drive for the food pantry. Room 4 collected ${a} cans, and Room 7 collected ${b} cans. How many cans did the two classes collect together?`);
  addStory('add-steps', [4, 4], [4200, 9800], [3000, 8500], ({ A }, a, b) => `${A} wears a step counter every day. On Saturday, ${A.s} walked ${a} steps, and on Sunday, ${A.s} walked ${b} steps. How many steps did ${A.s} walk over the weekend?`);
  addStory('add-home-games', [4, 4], [1200, 4200], [1000, 4200], (c, a, b) => `The high school football team drew ${a} fans to its first home game and ${b} fans to its second home game. How many fans came to the two games?`);
  addStory('add-library-semesters', [4, 4], [2200, 4400], [2000, 4200], (c, a, b) => `The school librarian keeps careful records. Students checked out ${a} books during the fall and ${b} books during the spring. How many books were checked out in all?`);
  addStory('add-zoo-weekend', [4, 4], [2500, 6500], [2000, 6000], (c, a, b) => `The zoo counts every visitor who walks through the gate. ${a} people visited on Saturday and ${b} people visited on Sunday. How many people visited the zoo that weekend?`);
  addStory('add-fair-tickets', [5, 5], [8000, 28000], [6000, 22000], (c, a, b) => `The county fair sold ${a} tickets online before opening day. At the gate, ${b} more tickets were sold. How many tickets did the fair sell altogether?`);
  addStory('add-town-populations', [5, 5], [12000, 48000], [9000, 40000], (c, a, b) => `The town of Lakeview has ${a} people, and the nearby town of Pine Hill has ${b} people. How many people live in the two towns combined?`);
  addStory('add-ballpark', [5, 5], [6000, 15000], [5000, 15000], (c, a, b) => `A minor league baseball team had ${a} fans at Friday night's game. On Saturday, ${b} fans came to see them play again. How many fans came to the two games?`);
  addStory('add-recycled-paper', [5, 5], [2200, 9800], [2000, 9500], (c, a, b) => `Two middle schools collected paper for recycling this year. Hillcrest collected ${a} pounds, and Riverview collected ${b} pounds. How many pounds of paper did the two schools collect in all?`);

  // three addends, narrated
  t({ id: 'add-three-rooms', ops: ['add'], kind: 'whole', steps: 1, grades: [3, 5], make: (r, c, g) => {
    const [lo, hi] = { 3: [40, 160], 4: [150, 450], 5: [300, 900] }[g];
    const a = int(r, lo, hi); const b = int(r, lo, hi); const d = int(r, lo, hi);
    return { text: `Three classes collected cans for the recycling drive. Room 4 collected ${fmt(a)} cans, Room 7 collected ${fmt(b)} cans, and Room 9 collected ${fmt(d)} cans. How many cans did the three classes collect in all?`, answerText: fmt(a + b + d) };
  } });
  t({ id: 'add-three-lunches', ops: ['add'], kind: 'whole', steps: 1, grades: [3, 5], make: (r, c, g) => {
    const [lo, hi] = { 3: [110, 220], 4: [260, 420], 5: [380, 560] }[g];
    const a = int(r, lo, hi); const b = int(r, lo, hi); const d = int(r, lo, hi);
    return { text: `The school cafeteria keeps a tally of lunches served. It served ${fmt(a)} lunches on Monday, ${fmt(b)} on Tuesday, and ${fmt(d)} on Wednesday. How many lunches did the cafeteria serve in those three days?`, answerText: fmt(a + b + d) };
  } });

  // ======================= TAKING AWAY (separate, compare) =======================
  subStory('sub-birds', [1, 1], [8, 16], [2, 7], (c, a, b) => `${a} birds were sitting on a fence. Then ${b} birds flew away. How many birds are still on the fence?`);
  subStory('sub-stickers-given', [1, 2], { 1: [8, 16], 2: [30, 80] }, { 1: [2, 7], 2: [8, 28] }, ({ A, B }, a, b) => `${A} had ${a} stickers. ${A.S} gave ${b} stickers to ${B}. How many stickers does ${A} have now?`);
  subStory('sub-bake-sale', [1, 2], { 1: [10, 18], 2: [30, 72] }, { 1: [3, 9], 2: [10, 40] }, ({ A }, a, b) => `${A} baked ${a} cookies for the bake sale. ${A.S} sold ${b} of them before lunch. How many cookies are left to sell?`);
  subStory('sub-marbles', [1, 2], { 1: [10, 20], 2: [30, 60] }, { 1: [3, 9], 2: [10, 35] }, (c, a, b) => `A bag had ${a} marbles. ${b} of them were blue, and the rest were green. How many marbles were green?`);
  subStory('sub-bean-seeds', [2, 2], [18, 30], [6, 20], (c, a, b) => `The class planted ${a} bean seeds in paper cups. Only ${b} of the seeds have sprouted so far. How many seeds have not sprouted yet?`);
  subStory('sub-pages-to-go', [2, 3], { 2: [40, 90], 3: [120, 300] }, { 2: [15, 40], 3: [40, 130] }, ({ A }, a, b) => `${A} wants to read ${a} pages this week. ${A.S} has read ${b} pages so far. How many more pages does ${A.s} need to read?`);
  subStory('sub-playground', [2, 2], [30, 60], [8, 20], (c, a, b) => `${a} children were playing on the playground at recess. ${b} of them were on the swings. How many children were not on the swings?`);
  subStory('sub-school-store', [3, 3], [200, 420], [90, 300], (c, a, b) => `The school store started the week with ${a} pencils on the shelf. By Friday afternoon, ${b} pencils had been sold. How many pencils were left?`);
  subStory('sub-auditorium', [3, 3], [250, 450], [100, 300], (c, a, b) => `The auditorium has ${a} seats for the school play. ${b} of the seats are already taken. How many seats are still open?`);
  subStory('sub-step-goal', [4, 4], [40000, 70000], [18000, 50000], ({ A }, a, b) => `${A}'s goal is to walk ${a} steps this week. So far, ${A.s} has walked ${b} steps. How many more steps does ${A.s} need to reach the goal?`);
  subStory('sub-stadium-seats', [4, 4], [1500, 4500], [900, 4000], (c, a, b) => `The high school stadium holds ${a} fans. ${b} tickets have been sold for Friday night's game. How many seats are still open?`);
  subStory('sub-library-compare', [4, 5], { 4: [1800, 3200], 5: [4500, 9000] }, { 4: [900, 1700], 5: [2000, 4400] }, (c, a, b) => `The school library has ${a} fiction books and ${b} nonfiction books. How many more fiction books than nonfiction books does the library have?`);
  subStory('sub-town-growth', [5, 5], [18000, 48000], [12000, 40000], (c, a, b) => `Ten years ago, the town of Maple Grove had ${b} people. Today it has ${a} people. How many more people live there now?`);
  subStory('sub-arena', [5, 5], [15000, 22000], [9000, 20000], (c, a, b) => `An arena holds ${a} fans for a concert. So far, ${b} tickets have been sold. How many tickets are still available?`);

  // ======================= EQUAL GROUPS (multiplication) =======================
  mulStory('mul-garden-rows', [2, 3], { 2: [2, 5], 3: [3, 8] }, { 2: [3, 6], 3: [4, 9] }, ({ A }, a, b) => `${A} is planting a vegetable garden. ${A.S} plants ${a} rows of carrots with ${b} seeds in each row. How many carrot seeds does ${A.s} plant?`);
  mulStory('mul-orange-bags', [2, 3], { 2: [2, 4], 3: [3, 6] }, { 2: [3, 6], 3: [5, 8] }, ({ A }, a, b) => `${A} is bringing snacks for the class. ${A.S} buys ${a} bags of oranges, and each bag has ${b} oranges. How many oranges does ${A.s} have?`);
  t({ id: 'mul-sock-pairs', ops: ['mul'], kind: 'whole', steps: 1, level: 1, grades: [2, 2], make: (r, { A }) => { const k = int(r, 3, 9); return { text: `${A} counted ${k} pairs of socks in the laundry basket. How many socks is that?`, answerText: fmt(k * 2) }; } });
  t({ id: 'mul-egg-cartons', ops: ['mul'], kind: 'whole', steps: 1, level: 1, grades: [3, 4], make: (r, { A }, g) => { const k = g === 3 ? int(r, 2, 6) : int(r, 4, 12); return { text: `A carton holds 12 eggs. ${A} buys ${k} cartons for a big family breakfast. How many eggs does ${A.s} have?`, answerText: fmt(k * 12) }; } });
  mulStory('mul-marker-tubs', [3, 4], [4, 8], [8, 16], (c, a, b) => `The art teacher keeps markers in ${a} tubs. Each tub holds ${b} markers. How many markers are in the art room?`);
  mulStory('mul-tomatoes', [3, 4], [3, 8], [6, 15], ({ A }, a, b) => `${A} planted ${a} tomato plants this spring. At harvest time, each plant had ${b} ripe tomatoes. How many tomatoes did ${A.s} pick?`);
  mulStory('mul-auditorium', [4, 5], { 4: [8, 14], 5: [14, 20] }, { 4: [12, 20], 5: [18, 28] }, (c, a, b) => `The school auditorium has ${a} rows of seats, with ${b} seats in each row. How many people can sit in the auditorium?`);
  mulStory('mul-juice-cases', [4, 4], [6, 15], [24, 48], (c, a, b) => `A case holds ${b} juice boxes. The cafeteria orders ${a} cases for field day lunches. How many juice boxes is that?`);
  mulStory('mul-field-trip', [3, 5], { 3: [2, 3], 4: [3, 5], 5: [5, 8] }, { 3: [24, 40], 4: [36, 52], 5: [48, 60] }, (c, a, b, g) => g === 5
    ? `A school is taking every student to the state fair. ${a} buses will make the trip, and each bus carries ${b} students. How many students are going?`
    : `The ${ORD[g]} grade is going on a field trip to the science museum. The school is sending ${a} buses, and each bus carries ${b} students. How many students are going on the trip?`);
  mulStory('mul-crayon-boxes', [5, 5], [14, 32], (r) => pick(r, [24, 48, 64]), (c, a, b) => `The supply closet at an elementary school has ${a} boxes of crayons. Each box holds ${b} crayons. How many crayons are in the closet?`);
  mulStory('mul-desks', [5, 5], [18, 30], [22, 30], (c, a, b) => `There are ${a} classrooms in the school building. Each classroom has ${b} desks. How many desks are in the school?`);
  t({ id: 'mul-hen-eggs', ops: ['mul'], kind: 'whole', steps: 1, level: 1, grades: [4, 5], make: (r, c, g) => { const h = int(r, 12, 30); const d = g === 4 ? pick(r, [5, 7]) : pick(r, [10, 14]); return { text: `A farm has ${h} hens, and each hen lays one egg a day. How many eggs do the hens lay in ${d} days?`, answerText: fmt(h * d) }; } });
  t({ id: 'mul-jerseys', ops: ['mul'], kind: 'whole', steps: 1, level: 1, grades: [3, 5], make: (r, c, g) => { const a = int(r, 4, 10); const b = int(r, 8, 12); return { text: `A youth basketball league has ${a} teams with ${b} players on each team. Every player gets one jersey. How many jerseys does the league need?`, answerText: fmt(a * b) }; } });

  // ======================= SHARING / GROUPING (division) =======================
  divStory('div-seashells', [2, 4], { 2: [3, 8], 3: [5, 15], 4: [10, 40] }, [3, 3], ({ A, B, C }, t0) => `${A}, ${B}, and ${C} found ${t0} seashells on the beach. They agreed to share them equally. How many seashells does each friend get?`);
  divStory('div-picnic-tables', [2, 3], { 2: [2, 4], 3: [3, 6] }, [4, 8], (c, t0, k) => `The whole class is eating lunch outside today. There are ${t0} children, and each picnic table seats ${k}. How many tables are needed?`);
  divStory('div-sticker-pages', [2, 3], { 2: [3, 6], 3: [5, 10] }, [3, 6], ({ A }, t0, k) => `${A} has a sticker book with ${k} pages and ${t0} stickers to put in it. ${A.S} wants the same number of stickers on every page. How many stickers go on each page?`);
  t({ id: 'div-field-day-teams', ops: ['div'], kind: 'whole', steps: 1, level: 1, grades: [3, 4], make: (r) => { const k = pick(r, [3, 4, 5, 6]); const q = int(r, Math.ceil(18 / k), Math.floor(36 / k)); return { text: `${fmt(k * q)} students are in the gym for field day. The coach splits them into ${k} equal teams. How many students are on each team?`, answerText: fmt(q) }; } });
  t({ id: 'div-crayon-boxes', ops: ['div'], kind: 'whole', steps: 1, level: 1, grades: [4, 4], make: (r) => { const k = pick(r, [8, 12, 16, 24]); const q = int(r, 12, Math.floor(950 / k)); return { text: `A craft company packs ${k} crayons in each box. Today it has ${fmt(k * q)} crayons ready to pack. How many boxes will it fill?`, answerText: fmt(q) }; } });
  divStory('div-card-binder', [3, 4], { 3: [6, 20], 4: [12, 40] }, [9, 9], ({ A }, t0) => `${A} keeps ${A.p} baseball cards in a binder. Each page holds 9 cards. ${A.S} has ${t0} cards. How many pages does ${A.s} need?`);
  divStory('div-classrooms', [5, 5], [20, 28], [18, 28], (c, t0, k) => `An elementary school has ${t0} students in ${k} classrooms. Every classroom has the same number of students. How many students are in each classroom?`);
  divStory('div-bus-seats', [5, 5], [4, 9], [48, 60], (c, t0, k) => `A school needs to take ${t0} students to a play. Each bus holds ${k} students, and every bus will be full. How many buses are needed?`);

  // ======================= LEFTOVERS AND ROUNDING UP =======================
  t({ id: 'rem-muffin-boxes', ops: ['div'], kind: 'whole', steps: 1, level: 1, grades: [4, 5], make: (r, { A }, g) => {
    const k = pick(r, [4, 6, 8, 12]); const q = g === 4 ? int(r, 5, 12) : int(r, 8, 16); const rem = int(r, 1, k - 1);
    return { text: `${A} baked ${fmt(k * q + rem)} muffins for a bake sale and packs ${k} muffins in each box. How many full boxes can ${A.s} fill, and how many muffins will be left over?`, answerText: `${q} full boxes with ${rem} left over` };
  } });
  t({ id: 'rem-vans', ops: ['div'], kind: 'whole', steps: 1, level: 2, grades: [3, 5], make: (r, { A }) => {
    const k = int(r, 5, 8); const q = int(r, 3, 6); const rem = int(r, 1, k - 1);
    return { text: `The soccer team is going to a tournament, and ${fmt(k * q + rem)} players need rides. Each van holds ${k} players. How many vans are needed so that everyone has a seat?`, answerText: `${q + 1} vans` };
  } });
  t({ id: 'rem-pizza', ops: ['div'], kind: 'whole', steps: 2, level: 2, grades: [3, 5], make: (r, { A }, g) => {
    let f; let s; do { f = g === 3 ? int(r, 4, 9) : int(r, 6, 14); s = int(r, 2, 3); } while ((f * s) % 8 === 0);
    return { text: `${A} is ordering pizza for a sleepover. Each of the ${f} friends will eat about ${s} slices, and every pizza has 8 slices. How many pizzas should ${A.s} order?`, answerText: `${Math.ceil((f * s) / 8)} pizzas` };
  } });

  // ======================= COMPARING AND "TIMES AS MANY" =======================
  t({ id: 'cmp-times-as-heavy', ops: ['mul'], kind: 'whole', steps: 1, level: 1, grades: [3, 5], make: (r, { A }, g) => { const a = int(r, 6, 15); const k = g === 3 ? int(r, 2, 4) : int(r, 3, 6); return { text: `${A}'s puppy weighs ${a} pounds. ${A}'s grandfather has a full-grown dog that weighs ${k} times as much as the puppy. How many pounds does the big dog weigh?`, answerText: fmt(a * k) }; } });
  t({ id: 'cmp-books-read', ops: ['mul'], kind: 'whole', steps: 1, level: 1, grades: [3, 5], make: (r, { A, B }, g) => { const a = int(r, 6, 14); const k = int(r, 2, g === 3 ? 3 : 4); return { text: `Over the summer, ${A} read ${a} books. ${B} read ${k} times as many books as ${A}. How many books did ${B} read?`, answerText: fmt(a * k) }; } });
  t({ id: 'cmp-times-then-total', ops: ['mul', 'add'], kind: 'whole', steps: 2, level: 2, grades: [3, 5], make: (r, { A, B }, g) => { const a = int(r, 6, 14); const k = int(r, 2, g === 3 ? 3 : 4); return { text: `Over the summer, ${A} read ${a} books. ${B} read ${k} times as many books as ${A}. How many books did the two friends read together?`, answerText: fmt(a * (k + 1)) }; } });
  t({ id: 'cmp-cranes', ops: ['mul', 'sub'], kind: 'whole', steps: 3, level: 2, grades: [3, 5], make: (r) => {
    const a = int(r, 4, 12); const x = int(r, 3, 6); let b = int(r, 4, 12); const y = int(r, 3, 6);
    if (a * x === b * y) b += 1; // never a tie
    const p = a * x; const q = b * y;
    return { text: `Two classes are folding paper cranes for a school display. Room 3 folds ${a} cranes a day for ${x} days. Room 5 folds ${b} cranes a day for ${y} days. Which room folds more cranes, and how many more?`, answerText: `Room ${p > q ? 3 : 5} folds ${fmt(Math.abs(p - q))} more` };
  } });

  // ======================= TWO-STEP STORIES =======================
  t({ id: 'two-cards', ops: ['add', 'sub'], kind: 'whole', steps: 2, level: 1, grades: [2, 5], make: (r, { A, B }, g) => {
    const [alo, ahi, blo, bhi, clo, chi] = { 2: [20, 50, 8, 20, 3, 12], 3: [80, 200, 20, 60, 10, 40], 4: [250, 600, 40, 120, 30, 100], 5: [600, 1500, 100, 300, 80, 250] }[g];
    const a = int(r, alo, ahi); const b = int(r, blo, bhi); const d = int(r, clo, chi);
    return { text: `${A} collects trading cards. ${A.S} had ${fmt(a)} cards in a shoebox, and ${A.s} got ${fmt(b)} more for ${A.p} birthday. Later, ${A.s} gave ${fmt(d)} cards to ${B}. How many cards does ${A} have now?`, answerText: fmt(a + b - d) };
  } });
  t({ id: 'two-pond-ducks', ops: ['add', 'sub'], kind: 'whole', steps: 2, level: 1, grades: [1, 2], make: (r, c, g) => {
    const a = g === 1 ? int(r, 8, 12) : int(r, 20, 40); const left = int(r, 2, g === 1 ? 5 : 12); const joined = int(r, 2, g === 1 ? 5 : 12);
    return { text: `${a} ducks were swimming in the pond. ${left} ducks flew away. Then ${joined} more ducks landed on the water. How many ducks are on the pond now?`, answerText: fmt(a - left + joined) };
  } });
  t({ id: 'ch-first-grade-marbles', ops: ['add', 'sub'], kind: 'whole', steps: 3, level: 2, grades: [1, 1], make: (r, { A, B }) => {
    const a = int(r, 10, 14); const lost = int(r, 2, 4); const found = int(r, 2, 5); const gave = int(r, 2, Math.min(5, a - lost + found - 1));
    return { text: `${A} had ${a} marbles. ${A.S} lost ${lost} marbles on the playground and found ${found} more under the slide. Then ${A.s} gave ${gave} marbles to ${B}. How many marbles does ${A} have now?`, answerText: fmt(a - lost + found - gave) };
  } });
  t({ id: 'two-spend-allowance', ops: ['sub'], kind: 'whole', steps: 2, level: 1, grades: [2, 5], make: (r, { A }, g) => {
    const [lo, hi] = { 2: [20, 50], 3: [30, 80], 4: [40, 120], 5: [50, 200] }[g];
    const a = int(r, lo, hi); const b = int(r, Math.ceil(a * 0.15), Math.floor(a * 0.4)); const d = int(r, Math.ceil(a * 0.1), Math.floor(a * 0.3));
    return { text: `${A} got ${money(a)} for ${A.p} birthday. At the mall, ${A.s} spent ${money(b)} on a book and ${money(d)} on a snack. How much money does ${A.s} have left?`, answerText: money(a - b - d) };
  } });
  t({ id: 'two-play-chairs', ops: ['mul', 'add'], kind: 'whole', steps: 2, level: 1, grades: [3, 5], make: (r, { A, B }, g) => {
    const [rlo, rhi, plo, phi, xlo, xhi] = { 3: [5, 8, 8, 12, 8, 20], 4: [8, 12, 12, 16, 10, 30], 5: [12, 16, 14, 20, 15, 40] }[g];
    const rows = int(r, rlo, rhi); const per = int(r, plo, phi); const x = int(r, xlo, xhi);
    return { text: `The school is getting ready for the spring play. The custodian sets up ${rows} rows with ${per} chairs in each row. Then ${B} carries ${x} more chairs in from the cafeteria. How many chairs are there now?`, answerText: fmt(rows * per + x) };
  } });
  t({ id: 'two-buses-absent', ops: ['mul', 'sub'], kind: 'whole', steps: 2, level: 1, grades: [3, 5], make: (r, c, g) => {
    const b = { 3: int(r, 2, 3), 4: int(r, 3, 5), 5: int(r, 5, 8) }[g]; const s = g === 3 ? int(r, 24, 40) : g === 4 ? int(r, 36, 52) : int(r, 48, 60); const x = int(r, 2, 9);
    return { text: `A school has ${b} buses ready for a field trip, and each bus can carry ${s} students. On the morning of the trip, ${x} students are out sick. How many students ride the buses if every other student comes?`, answerText: fmt(b * s - x) };
  } });
  t({ id: 'two-pages-left', ops: ['mul', 'sub'], kind: 'whole', steps: 2, level: 1, grades: [3, 5], make: (r, { A }, g) => {
    const p = g === 3 ? int(r, 8, 15) : g === 4 ? int(r, 12, 25) : int(r, 15, 40); const d = int(r, 4, 9); const extra = int(r, 20, 80);
    return { text: `${A} is reading a ${fmt(p * d + extra)}-page chapter book. ${A.S} reads ${p} pages every night for ${d} nights in a row. How many pages does ${A.s} still have to read?`, answerText: fmt(extra) };
  } });
  t({ id: 'two-shelter-dogs', ops: ['sub', 'add'], kind: 'whole', steps: 2, level: 1, grades: [2, 4], make: (r, c, g) => {
    const a = g === 2 ? int(r, 15, 30) : int(r, 20, 40); const b = int(r, 4, g === 2 ? 9 : 12); const d = int(r, 3, 10);
    return { text: `The animal shelter had ${a} dogs on Monday. Over the weekend, ${b} dogs were adopted, and ${d} new dogs arrived. How many dogs are at the shelter now?`, answerText: fmt(a - b + d) };
  } });
  t({ id: 'two-nickels-dimes', ops: ['mul', 'add'], kind: 'whole', steps: 2, level: 1, grades: [3, 4], make: (r, { A }, g) => {
    const q = int(r, 2, 8); const d = int(r, 2, 9); const n = g === 4 ? int(r, 2, 9) : 0;
    return { text: `${A} emptied ${A.p} piggy bank and sorted the coins. ${A.S} found ${q} quarters, ${d} dimes${n ? `, and ${n} nickels` : ''}. How many cents does ${A.s} have in all?`, answerText: fmt(q * 25 + d * 10 + n * 5) };
  } });
  t({ id: 'two-concert-tickets', ops: ['mul', 'add'], kind: 'whole', steps: 3, level: 1, grades: [4, 5], make: (r, c, g) => {
    const a = g === 4 ? int(r, 40, 90) : int(r, 60, 140); const pa = g === 4 ? int(r, 5, 8) : int(r, 6, 10); const k = g === 4 ? int(r, 60, 140) : int(r, 80, 220); const ps = g === 4 ? int(r, 2, 4) : int(r, 3, 5);
    return { text: `The school concert sold ${a} adult tickets for ${money(pa)} each and ${k} student tickets for ${money(ps)} each. How much money did the concert make in all?`, answerText: money(a * pa + k * ps) };
  } });
  t({ id: 'two-basketball', ops: ['mul', 'add'], kind: 'whole', steps: 3, level: 1, grades: [3, 5], make: (r, { A }, g) => {
    const a = g === 3 ? int(r, 3, 7) : g === 4 ? int(r, 4, 9) : int(r, 5, 10); const b = g === 3 ? int(r, 1, 4) : int(r, 2, 6);
    return { text: `In the championship game, ${A} made ${a} two-point baskets and ${b} three-point shots. How many points did ${A.s} score?`, answerText: fmt(2 * a + 3 * b) };
  } });
  t({ id: 'two-reams', ops: ['mul', 'sub'], kind: 'whole', steps: 2, level: 1, grades: [4, 5], make: (r) => {
    const u = int(r, 18, 35); const d = int(r, 5, 10);
    return { text: `The art room starts the month with a full ream of 500 sheets of paper. The classes use about ${u} sheets each day. How many sheets are left after ${d} school days?`, answerText: fmt(500 - u * d) };
  } });
  t({ id: 'two-penguins', ops: ['mul'], kind: 'whole', steps: 2, level: 1, grades: [4, 5], make: (r) => {
    const p = int(r, 12, 24); const d = pick(r, [5, 7, 10]);
    return { text: `At the zoo, each penguin eats about 2 pounds of fish a day. The zoo has ${p} penguins. How many pounds of fish do the penguins eat in ${d} days?`, answerText: fmt(2 * p * d) };
  } });
  t({ id: 'two-city-bus', ops: ['add', 'sub'], kind: 'whole', steps: 3, level: 2, grades: [2, 5], make: (r, c, g) => {
    const a = g === 2 ? int(r, 12, 25) : int(r, 18, 40); const b = int(r, 3, g === 2 ? 8 : 12); const on = int(r, 3, g === 2 ? 8 : 12); const off2 = int(r, 2, Math.min(10, a - b + on - 1));
    return { text: `A city bus leaves the station with ${a} riders. At Maple Street, ${b} riders get off and ${on} get on. At the next stop, ${off2} more riders get off. How many riders are on the bus now?`, answerText: fmt(a - b + on - off2) };
  } });

  // ======================= AREA, PERIMETER, RATES, MORE STEPS =======================
  t({ id: 'geo-area', ops: ['mul'], kind: 'whole', steps: 1, level: 1, grades: [3, 5], make: (r, { A }, g) => {
    const [what, unit, lo1, hi1, lo2, hi2] = pick(r, g === 3
      ? [['a rectangular vegetable garden', 'feet', 6, 12, 4, 9], ['the classroom rug', 'feet', 6, 12, 5, 9]]
      : [['a rectangular school garden', 'feet', 12, 30, 8, 20], ['the new playground', 'yards', 20, 40, 12, 25], ['the gym floor', 'feet', 70, 94, 40, 60]]);
    const l = int(r, lo1, hi1); const w = int(r, lo2, hi2);
    return { text: `${A} is helping to measure ${what}. It is ${l} ${unit} long and ${w} ${unit} wide. What is its area in square ${unit}?`, answerText: `${fmt(l * w)} square ${unit}` };
  } });
  t({ id: 'geo-perimeter', ops: ['add', 'mul'], kind: 'whole', steps: 2, level: 2, grades: [3, 5], make: (r, { A }, g) => {
    const l = g === 3 ? int(r, 6, 12) : g === 4 ? int(r, 12, 30) : int(r, 20, 50); const w = g === 3 ? int(r, 4, 9) : g === 4 ? int(r, 8, 20) : int(r, 12, 36);
    const [what, unit, trim] = pick(r, [['vegetable garden', 'feet', 'fencing'], ['bulletin board', 'inches', 'trim'], ['dog park', 'yards', 'rope']]);
    return { text: `${A} is putting ${trim} around the edge of a rectangular ${what}. The ${what} is ${l} ${unit} long and ${w} ${unit} wide. How many ${unit} of ${trim} does ${A.s} need to go all the way around?`, answerText: `${fmt(2 * (l + w))} ${unit}` };
  } });
  t({ id: 'geo-fence-cost', ops: ['add', 'mul'], kind: 'whole', steps: 3, level: 2, grades: [5, 5], make: (r) => {
    const l = int(r, 30, 60); const w = int(r, 20, 40); const p = int(r, 8, 15);
    return { text: `The school is building a rectangular playground that is ${l} meters long and ${w} meters wide. A fence will go all the way around it and costs ${money(p)} for every meter. How much will the fence cost?`, answerText: money(2 * (l + w) * p) };
  } });
  t({ id: 'rate-practice', ops: ['mul'], kind: 'whole', steps: 2, level: 1, grades: [4, 5], make: (r, { A }, g) => {
    const m = pick(r, [20, 25, 30, 40]); const d = pick(r, [3, 4, 5]); const w = g === 4 ? int(r, 2, 4) : int(r, 4, 8);
    return { text: `${A} is learning to play the trumpet. ${A.S} practices ${m} minutes a day, ${d} days a week. How many minutes does ${A.s} practice in ${w} weeks?`, answerText: fmt(m * d * w) };
  } });
  t({ id: 'rate-road-trip', ops: ['mul', 'add'], kind: 'whole', steps: 3, level: 2, grades: [4, 5], make: (r, { A }, g) => {
    const s1 = int(r, 45, 65); const h1 = int(r, 2, 4); const s2 = int(r, 40, 65); const h2 = int(r, 2, g === 4 ? 3 : 5);
    return { text: `${A}'s family drove ${s1} miles per hour for ${h1} hours in the morning. After lunch, they drove ${s2} miles per hour for ${h2} more hours. How many miles did they drive in all?`, answerText: fmt(s1 * h1 + s2 * h2) };
  } });
  t({ id: 'ch-bakery-trays', ops: ['mul', 'sub', 'div'], kind: 'whole', steps: 3, level: 2, grades: [5, 5], make: (r, { A }) => {
    const trays = int(r, 6, 12); const per = pick(r, [18, 24, 30]); const total = trays * per; const k = pick(r, [4, 6, 8, 12]);
    const rest = k * int(r, Math.ceil(total * 0.3 / k), Math.floor(total * 0.7 / k)); const sold = total - rest;
    return { text: `${A} bakes ${trays} trays of muffins with ${per} muffins on each tray. By noon, ${sold} of the muffins have been sold. ${A.S} packs the rest into boxes of ${k}. How many boxes does ${A.s} fill?`, answerText: `${fmt(rest / k)} boxes` };
  } });
  t({ id: 'ch-fair-goal', ops: ['add', 'sub'], kind: 'whole', steps: 3, level: 2, grades: [5, 5], make: (r) => {
    const a = int(r, 14000, 26000); const b = int(r, 20000, 34000); const d = int(r, 12000, 24000); const goal = Math.ceil((a + b + d + 3000) / 5000) * 5000;
    return { text: `The county fair wanted ${fmt(goal)} visitors this year. ${fmt(a)} people came on Friday, ${fmt(b)} came on Saturday, and ${fmt(d)} came on Sunday. How many more visitors did the fair need to reach its goal?`, answerText: fmt(goal - a - b - d) };
  } });
  t({ id: 'ch-pencil-order', ops: ['mul', 'div'], kind: 'whole', steps: 2, level: 2, grades: [4, 5], make: (r, { A }, g) => {
    const per = 24; const rooms = pick(r, [6, 8, 12]); const boxes = g === 4 ? int(r, 3, 9) : int(r, 6, 16);
    return { text: `The school secretary orders ${boxes} boxes of pencils with ${per} pencils in each box. ${A.S} splits them equally among ${rooms} classrooms. How many pencils does each classroom get?`, answerText: fmt((boxes * per) / rooms) };
  } });

  // ======================= CHALLENGE: MORE STEPS, EXTRA INFORMATION =======================
  t({ id: 'ch-extra-info', ops: ['mul'], kind: 'whole', steps: 1, level: 2, grades: [3, 5], make: (r, { A, B }, g) => {
    const boxes = int(r, 4, g === 3 ? 8 : 12); const per = int(r, 6, g === 3 ? 12 : 24); const spoiled = int(r, 1, 5);
    return { text: `${A} is helping at the food pantry. ${A.S} packs ${boxes} boxes with ${per} cans of soup in each box. ${B} points out that ${spoiled} of the cans have a dented label, but the soup inside is fine. How many cans of soup did ${A} pack?`, answerText: fmt(boxes * per) };
  } });
  t({ id: 'ch-empty-seats', ops: ['mul', 'sub'], kind: 'whole', steps: 2, level: 2, grades: [3, 5], make: (r, c, g) => {
    const b = g === 3 ? int(r, 2, 3) : int(r, 2, 4); const cap = int(r, 40, 56); const empty = int(r, 4, 20);
    return { text: `${b} buses take the ${ORD[g]} grade to the planetarium. Each bus has ${cap} seats. After everyone sits down, there are ${empty} empty seats in all. How many students are riding the buses?`, answerText: fmt(b * cap - empty) };
  } });
  t({ id: 'ch-markers-shared', ops: ['mul', 'sub', 'div'], kind: 'whole', steps: 3, level: 2, grades: [4, 5], make: (r, c, g) => {
    const b = g === 4 ? int(r, 3, 6) : int(r, 4, 10); const p = g === 4 ? int(r, 12, 36) : int(r, 24, 72); const groups = pick(r, [3, 4, 5, 6]);
    const total = b * p; const rem = total % groups; const lost = (rem === 0 ? groups : rem) + groups * int(r, 0, 2);
    return { text: `The art teacher opens ${b} new boxes of markers with ${p} markers in each box. ${lost} markers turn out to be dried out, so she throws them away. She shares the rest equally among ${groups} classes. How many markers does each class get?`, answerText: fmt((total - lost) / groups) };
  } });
  t({ id: 'ch-laps', ops: ['mul', 'sub'], kind: 'whole', steps: 2, level: 2, grades: [3, 5], make: (r, { A, B, C }, g) => {
    const a = g === 3 ? int(r, 4, 9) : int(r, 5, 12); const fewer = int(r, 2, 2 * a - 3);
    return { text: `During gym class, ${A} ran ${a} laps around the track. ${B} ran twice as many laps as ${A}. ${C} ran ${fewer} fewer laps than ${B}. How many laps did ${C} run?`, answerText: fmt(2 * a - fewer) };
  } });
  t({ id: 'ch-packs-needed', ops: ['sub', 'div'], kind: 'whole', steps: 2, level: 2, grades: [3, 5], make: (r, { A }, g) => {
    const k = g === 3 ? int(r, 2, 6) : int(r, 6, 12); const p = int(r, 2, g === 3 ? 6 : 10); const a = g === 3 ? int(r, 4, 14) : int(r, 10, 60);
    return { text: `${A} needs ${fmt(a + k * p)} index cards to make flash cards for a spelling bee. ${A.S} already has ${fmt(a)}. Index cards are sold in packs of ${k}. How many packs does ${A.s} need to buy?`, answerText: `${p} packs` };
  } });
  t({ id: 'ch-bike-savings', ops: ['add', 'sub'], kind: 'whole', steps: 2, level: 2, grades: [3, 5], make: (r, { A }, g) => {
    const [clo, chi] = { 3: [60, 90], 4: [90, 140], 5: [120, 220] }[g]; const cost = int(r, clo, chi); const have = int(r, Math.floor(cost * 0.3), Math.floor(cost * 0.55)); const x = int(r, Math.floor(cost * 0.1), Math.floor(cost * 0.3));
    return { text: `${A} is saving for a new bike that costs ${money(cost)}. ${A.S} has ${money(have)} from birthday money and earned ${money(x)} walking a neighbor's dog. How much more money does ${A.s} need?`, answerText: money(cost - have - x) };
  } });
  t({ id: 'ch-change-two-items', ops: ['mul', 'add', 'sub'], kind: 'whole', steps: 3, level: 2, grades: [4, 5], make: (r, { A }, g) => {
    const a = int(r, 2, 6); const p = g === 4 ? int(r, 2, 5) : int(r, 3, 8); const q = g === 4 ? int(r, 4, 9) : int(r, 5, 14); const total = a * p + q; const paid = Math.ceil((total + 1) / 10) * 10;
    return { text: `At the school store, ${A} buys ${a} pens for ${money(p)} each and a notebook for ${money(q)}. ${A.S} pays with a ${money(paid)} bill. How much change should ${A.s} get back?`, answerText: money(paid - total) };
  } });
  t({ id: 'ch-reading-plan', ops: ['mul', 'sub', 'div'], kind: 'whole', steps: 3, level: 2, grades: [5, 5], make: (r, { A }) => {
    const x = int(r, 15, 30); const d1 = int(r, 3, 5); const m = int(r, 3, 5); const q = int(r, 20, 40);
    return { text: `${A} wants to finish a ${fmt(x * d1 + q * m)}-page novel before a book club meeting. ${A.S} read ${x} pages a day for the first ${d1} days. If ${A.s} reads the same number of pages each day for the last ${m} days, how many pages a day must ${A.s} read to finish the book?`, answerText: `${q} pages a day` };
  } });
  t({ id: 'ch-weekly-steps', ops: ['mul', 'sub'], kind: 'whole', steps: 2, level: 2, grades: [5, 5], make: (r, { A }) => {
    const per = int(r, 5500, 9500); const goal = Math.ceil((per * 7 + 2000) / 5000) * 5000 + 5000;
    return { text: `${A} walks about ${fmt(per)} steps every day. ${A.S} is trying to walk ${fmt(goal)} steps in one week. After 7 days at that pace, how many more steps does ${A.s} still need?`, answerText: fmt(Math.max(0, goal - per * 7)) };
  } });
  t({ id: 'ch-field-day-relay', ops: ['add', 'sub'], kind: 'whole', steps: 3, level: 2, grades: [3, 5], make: (r, { A, B }, g) => {
    const [lo, hi] = { 3: [24, 40], 4: [60, 120], 5: [120, 240] }[g]; const t1 = int(r, lo, hi); const joined = int(r, Math.ceil(lo / 6), Math.ceil(hi / 6)); const left = int(r, 2, Math.max(3, Math.floor(joined * 0.8)));
    return { text: `At the start of field day, ${fmt(t1)} students lined up on the field. Then ${fmt(joined)} students from another class joined them. Later, ${fmt(left)} students went inside to get water. How many students are on the field now?`, answerText: fmt(t1 + joined - left) };
  } });
};
