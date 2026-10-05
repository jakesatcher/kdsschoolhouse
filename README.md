# KDS Schoolhouse

Printable worksheet generator for South Carolina grades 1–5: **Math**, **Reading** and **Writing**.
Node 22 · Express 5 · PostgreSQL · EJS (server-rendered, no client framework). Built to deploy on Railway.

## What is in the framework

| Section | Menu | What it makes |
|---|---|---|
| Math | Addition, Subtraction | 2–7 digits, every problem needs regrouping (or "any"), 2 or 3 addends, vertical/horizontal |
| Math | Multiplication, Division | Facts 0–12 for one factor or all mixed; "mixed" adds multi-digit work (division with remainders). No division by 0 |
| Math | Word Problems | Grades 1–5; add/sub/mul/div or all; whole numbers, decimals (money, measurement), fractions; one-step, multi-step or mixed. Answers are computed, never typed in |
| Reading | Comprehension, Vocabulary, Inferences, Main Idea, Cause & Effect, Problem & Solution, Author's Purpose | A passage plus questions. Fiction or nonfiction, Short (≤75 words), Medium (≤150) or Long (≤250), grades 1–5. The passage and/or the questions can be AI-written or typed by the teacher, in any combination, and **everything is editable** before printing. Vocabulary: a grade-level word (or your own) in a ≤50-word passage with the word bolded |
| Reading | Phonics | CVC, blends, digraphs, VCE, R-controlled, advanced consonants, prefixes/suffixes, multi-syllable (each with sub-types). 20 words per sheet, real + nonsense (◇), teacher key |
| Reading | Sight Words | Dolch pre-primer (40), primer (52), first (41), second (46), third (41), nouns (95); word list, flash cards, trace |
| Writing | Prompts & lined paper | Starter: opinion / informative / narrative prompts by grade band, primary or wide-ruled lines |

**Favorites** (★) groups saved sheets by subject; **Print Later** (⏰) is a queue you can print one at a time or all together. Both are per teacher. Math, phonics, sight-word and writing sheets are saved as a pinned link (same seed = same sheet); reading sheets are saved as text, including your edits.

**Names:** word problems and AI passages use Zach, AC, Screech, Kelly, Lisa and Jessie first; other names are only randomized when a story needs more than six characters.

**Look and feel:** a 90s neon "Saved by the Bell"-inspired theme (original artwork), responsive down to phone width, with a clean black-on-white print stylesheet (the toolbar, header and colors are not printed).

Every worksheet has a **sheet code (seed)**; the answer key is generated from the same problems and prints on its own page.

## AI-written reading content

Passages and questions are written by Claude through the Anthropic API.
- Set `ANTHROPIC_API_KEY` (and optionally `AI_MODEL`, default `claude-opus-5-5`, and `AI_HOURLY_LIMIT`, default 30 AI worksheets per teacher per hour) in Railway. Without a key, the reading pages still work with teacher-written passages and questions.
- Each AI worksheet is roughly one short API call (about 1–2k tokens). Passage length and question counts are checked server-side; an over-long passage is retried once and then trimmed at a sentence boundary.
- Only the grade, settings, and anything the teacher typed (topic, custom passage, word) are sent to Anthropic: no student names or account data.
- AI output is school-safety prompted but **not guaranteed**: teachers should read a sheet before handing it out (the edit page makes changes easy).

## Accounts

- Anyone can **request access** at `/register`; the account is `pending` and cannot sign in.
- An **admin** approves/rejects/disables users, promotes/demotes, and issues one-time temporary passwords (`/admin/users`). Roles: `admin`, `user`.
- The first admin is created at boot from `ADMIN_EMAIL` / `ADMIN_PASSWORD`.
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
2. Variables: `DATABASE_URL=${{Postgres.DATABASE_URL}}`, `NODE_ENV=production`, `SESSION_SECRET` (`openssl rand -base64 48`), `ADMIN_EMAIL`, `ADMIN_PASSWORD` (12+ chars), `ADMIN_NAME`.
3. Settings → Networking → **Custom Domain**, add the CNAME at your registrar. TLS is automatic. Health check: `/healthz`.

## Security

See [docs/SECURITY.md](docs/SECURITY.md) for the OWASP Top 10 (2021) mapping and known gaps (MFA and email are not built yet).

## Standards alignment: please review

Grade guidance lives in `src/lib/generators/scope.js` and number ranges in `wordProblems.js` (`PROFILE`). They follow typical SC College- and Career-Ready grade expectations but are **not an official crosswalk**; an SC educator should confirm them before the content is described as "standards-aligned". Phonics pools are in `phonicsData.js`; nonsense words are tested against the real-word pools and a block-list, but skim sheets before use.

## Interpretations to confirm

- "Mixed numbers / mixed problems" for multiplication and division = a random mix of facts, plus an optional "Mixed" set with multi-digit problems (and remainders for division). Tell me if you meant something else, e.g. fractions.
- Division by zero is excluded; division facts use divisors 1–12 and quotients 0–12.
- Nonsense-only phonics sheets are capped at the size of that pattern's nonsense pool (10–22 words).
