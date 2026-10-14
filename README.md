# KDS Schoolhouse

Printable worksheet generator for South Carolina grades 1–5: **Math**, **Reading** and **Writing**.
Node 22 · Express 5 · PostgreSQL · EJS (server-rendered, no client framework). Built to deploy on Railway.

## What is in the framework

| Section | Menu | What it makes |
|---|---|---|
| Math | Addition, Subtraction | 2–7 digits, every problem needs regrouping (or "any"), 2 or 3 addends, vertical/horizontal |
| Math | Multiplication, Division | Facts for one factor or all mixed (no division by 0), with a range choice: 0–10 only, or 0–12 (11s and 12s are available at any grade but count half as much, so they do not take over a sheet). Each fact is used before any repeats, and a fact and its flip (3×7, 7×3) never share a sheet. **Multi-digit:** multiply a 1–4 digit number by a 1–2 digit number; divide 2–4 digit dividends by 1–2 digit divisors with no remainders, all with remainders, or a mix (quotients are always at least 2). Single-digit numbers in multiplication are 0–9, 1-digit divisors are 1–9 and 2-digit divisors are 10–99. A checkbox ("Include multiplying by 0 and 1" / "Include dividing by 1 and 10", on by default) lets a teacher leave those out; a factor or divisor chosen by name is always honoured. Each digit size can also be a mix. "Mixed" combines facts and multi-digit |
| Math | Decimals | Add, subtract, multiply, divide with whole-number parts up to the thousands (1–4 digits) and tenths, hundredths or thousandths (or a mix of places in one problem). Stacked problems line the decimal points up; multiply by a whole number or a decimal; divide by a whole number or a decimal, always coming out evenly. Exact scaled-integer math, no floats |
| Math | Fractions | Add, subtract, multiply, divide with like, unlike or mixed denominators (largest denominator 4–20); proper fractions, mixed numbers, or both (plus whole numbers for × and ÷). Operands are in lowest terms, answers in simplest form (improper results as mixed numbers). Stacked fraction layout |
| Math | Spiral Review | Grades 3, 4 and 5 (grades 3 and 4 Practice 1-36; grade 5 Practice 1-30). Each page is a ten-box review in the style of a classroom spiral-review practice sheet: place value and rounding, long division and multiplication, fraction and decimal operations, expressions, coordinate planes, line plots, volume, polygons, angles and measurement conversions, with the pictures drawn in SVG. Skills build from test to test and earlier skills keep coming back. Choose grade, practice number and 1-5 copies (each with new numbers); the answer key is a separate page. Each skill draws from a bank of different stories and sentence shapes, and when a box names one flavour of a skill (a "times as many" equation, say) a sheet may swap in another flavour of the same level, so the same practice number gives a different sheet each time |
| Math | Word Problems | Grades 1–5; about 130 realistic, narrated scenes (school, sports, shopping, cooking, travel) with realistic quantities per grade and varied sentence shapes; add/sub/mul/div or all; Standard or Challenge difficulty; whole numbers, decimals (money, measurement), fractions; one-step, multi-step or mixed. Answers are computed, never typed in |
| Reading | Comprehension, Vocabulary, Context Clues, Inferences, Main Idea, Cause & Effect, Problem & Solution, Author's Purpose | A passage plus questions. Fiction or nonfiction, Short (≤75 words), Medium (≤150) or Long (≤250), grades 1–5. The passage and/or the questions can be AI-written or typed by the teacher, in any combination, and **everything is editable** before printing. Vocabulary: a grade-level word (or your own) in a ≤50-word passage with the word bolded. Context Clues: a passage with 2-3 grade-level target words (bolded) whose meaning the text reveals, a choice of clue type (definition, synonym, antonym, example, general sense), and questions that ask for the meaning and for the clue itself |
| Reading | Phonics | CVC, blends, digraphs, VCE, R-controlled, advanced consonants, prefixes/suffixes, multi-syllable (each with sub-types). 20 words per sheet, real + nonsense (◇), teacher key |
| Reading | Sight Words | Dolch pre-primer (40), primer (52), first (41), second (46), third (41), nouns (95); word list, flash cards, trace |
| Writing | Prompts & lined paper | Starter: opinion / informative / narrative prompts by grade band, primary or wide-ruled lines |

**Favorites** (★) groups saved sheets by subject; **Print Later** (⏰) is a queue you can print one at a time or all together. Both are per teacher. Math, phonics, sight-word and writing sheets are saved as a pinned link (same seed = same sheet); reading sheets are saved as text, including your edits.

**Spiral Review sources.** Grade 3 Practice 1-36 follow the 36 Test pages of the 3rd grade sample in order (rounding, arrays and equal groups, fact families, function rules, fraction models and number lines, partitioning, polygons, graphs, line plots, area and perimeter, time, properties of multiplication, estimation and two-step stories); digital drag-and-type items become draw-it or write-it boxes. Grade 5 Practice 2-12 and 14-30 follow the sample 5th grade tests (Practice 1 and 13 were not in the sample and are assembled from their neighbours). Grade 4 Practice 1-36 follow the 36 Test pages of the 4th grade sample in order (place value and rounding, multi-digit operations, fractions and decimals, unit fractions and equivalent fractions, protractor and lines-and-angles diagrams, symmetry, patterns, factors and primes, line plots, measurement and multi-step stories). Pages use their own layout and wording and fresh random numbers, never the source pages. In the geometry answers a trapezoid has *at least one* pair of parallel sides.

**Names:** word problems and AI passages use Zach, AC, Screech, Kelly, Lisa and Jessie first; other names are only randomized when a story needs more than six characters.

**Look and feel:** a 90s neon "Saved by the Bell"-inspired theme (original artwork), responsive down to phone width, with a clean black-on-white print stylesheet (the toolbar, header and colors are not printed). Math sheets print as 5 columns × 5 rows (25 problems per page) for vertical problems and 3 columns × 5 rows (15 per page) for horizontal ones; longer sheets continue on the next page with the numbering carried over, and the answer key prints on its own page.

Every worksheet has a **sheet code (seed)**; the answer key is generated from the same problems and prints on its own page.

## Home page pep talk

After sign-in the home page shows a random cheeky pep talk (picked once per sign-in). Edit the list in `src/lib/greetings.js`. Set `GREETING_LEVEL=mild` for a no-swearing version, or `off` to hide it (worth considering if teachers project the site in front of students).

## AI-written reading content

Passages and questions are written by Claude through the Anthropic API.
- Set `ANTHROPIC_API_KEY` (and optionally `AI_MODEL`, default `claude-opus-5-5`, and `AI_HOURLY_LIMIT`, default 30 AI worksheets per teacher per hour) in Railway. Without a key, the reading pages still work with teacher-written passages and questions.
- Each AI worksheet is roughly one short API call (about 1–2k tokens). Passage length and question counts are checked server-side; an over-long passage is retried once and then trimmed at a sentence boundary.
- Only the grade, settings, and anything the teacher typed (topic, custom passage, word) are sent to Anthropic: no student names or account data.
- AI output is school-safety prompted but **not guaranteed**: teachers should read a sheet before handing it out (the edit page makes changes easy).

## Accounts

- Anyone can **request access** at `/register` with just a name, username and password (no email); the account is `pending` and cannot sign in.
- An **admin** approves/rejects/disables users, promotes/demotes, and issues one-time temporary passwords (`/admin/users`). Roles: `admin`, `user`.
- The first admin is created at boot from `ADMIN_USERNAME` (or the older `ADMIN_EMAIL`, used as the username) and `ADMIN_PASSWORD`. Existing accounts keep working: their old email became their username.
- **Forgot the admin password?** `ADMIN_PASSWORD` only applies when the admin account is first created; changing it later does nothing. To recover: set `ADMIN_RESET_PASSWORD=true` and a temporary `ADMIN_PASSWORD` (12+ chars) on the service, redeploy, sign in with it (you will be asked to choose a new password), then **delete `ADMIN_RESET_PASSWORD`**. This also clears any lockout. Another admin can instead issue a temporary password from `/admin/users`.
- Nothing is reachable without signing in except `/login`, `/register`, `/healthz`, and the CSS/JS/icon under `/static`.

## Run locally

```bash
createdb kdsschoolhouse
cp .env.example .env   # set DATABASE_URL, SESSION_SECRET, ADMIN_*
npm install
npm start              # migrations run on boot
npm test               # (AI is stubbed in tests) needs TEST_DATABASE_URL, e.g. postgres://user:pw@localhost/kds_test (that schema is dropped!)
```

## Deploy on Railway

1. New project → Deploy from GitHub repo → this repo. Add a **PostgreSQL** service.
2. Variables: `DATABASE_URL=${{Postgres.DATABASE_URL}}`, `NODE_ENV=production`, `SESSION_SECRET` (`openssl rand -base64 48`), `ADMIN_USERNAME`, `ADMIN_PASSWORD` (12+ chars), `ADMIN_NAME`.
3. Settings → Networking → **Custom Domain**, add the CNAME at your registrar. TLS is automatic. Health check: `/healthz`.

## Security

See [docs/SECURITY.md](docs/SECURITY.md) for the OWASP Top 10 (2021) mapping and known gaps (MFA and email are not built yet).

## Standards alignment: please review

Grade guidance lives in `src/lib/generators/scope.js` and number ranges in `wordProblems.js` (`PROFILE`). They follow typical SC College- and Career-Ready grade expectations but are **not an official crosswalk**; an SC educator should confirm them before the content is described as "standards-aligned". Phonics pools are in `phonicsData.js`; nonsense words are tested against the real-word pools and a block-list, but skim sheets before use.

## Interpretations to confirm

- "Mixed numbers / mixed problems" for multiplication and division = a random mix of facts, plus an optional "Mixed" set with multi-digit problems (and remainders for division). Tell me if you meant something else, e.g. fractions.
- Division by zero is excluded; division facts use divisors 1–12 and quotients 0–12.
- Nonsense-only phonics sheets are capped at the size of that pattern's nonsense pool (10–22 words).
