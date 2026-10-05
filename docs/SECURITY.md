# Security: OWASP Top 10 (2021) mapping

| # | Risk | Controls in this app | Where |
|---|---|---|---|
| A01 | Broken access control | Default-deny global gate: every route requires a signed-in **approved** user except `/login`, `/register`, `/healthz`, `/static`. Admin routes behind `requireAdmin`. Status and role are re-read from the DB on every request, so disabling a user takes effect immediately and their sessions are deleted. The last admin cannot be removed; admins cannot demote themselves. | `middleware/auth.js`, `routes/admin.js` |
| A02 | Cryptographic failures | bcrypt (cost 12) password hashes; HTTPS by Railway + HSTS (2 yrs) + `Secure` cookie in production; `SESSION_SECRET` required (32+ chars) in production; secrets only in env vars; `Cache-Control: no-store` on dynamic pages. | `lib/password.js`, `app.js`, `config.js` |
| A03 | Injection | All SQL is parameterised. All output is HTML-escaped by EJS (`<%= %>`); no unescaped user data. Query parameters are whitelisted or range-checked and fall back to defaults. Strict CSP blocks inline script. | `lib/params.js`, `routes/*` |
| A04 | Insecure design | Approval workflow; one-time admin-issued temporary passwords with forced change; rate limits on login, register, password change and generators; request bodies capped at 20 KB; worksheet sizes capped. | `lib/limits.js` |
| A05 | Security misconfiguration | Helmet: CSP (`default-src 'self'`, no inline script/style, `frame-ancestors 'none'`, `object-src 'none'`), HSTS, nosniff, same-origin referrer/CORP, no `X-Powered-By`. Generic error pages (stack traces only in logs). `noindex`. | `app.js` |
| A06 | Vulnerable components | Small dependency set, lockfile committed, `npm audit` clean at commit. Re-run regularly; consider Dependabot. | `package.json` |
| A07 | Identification & authentication failures | 12+ char passwords (length over composition; common/repetitive/contains-username checks); lockout after 5 failures (15 min) plus IP rate limit; uniform error and dummy-hash timing for unknown usernames; registration says when a username is taken (a deliberate usability trade-off: it is rate-limited to 5 per hour per IP and every account still needs admin approval); session ID regenerated on login; 8 h rolling idle timeout; HttpOnly + SameSite=Lax cookies; other sessions revoked on password change/reset/disable; logout destroys the session. **MFA not yet implemented.** | `routes/auth.js`, `routes/account.js` |
| A08 | Software & data integrity | No user uploads, no deserialisation of user data, no third-party scripts (all assets same-origin). CSRF synchroniser token on every POST. | `middleware/security.js` |
| A09 | Logging & monitoring | Audit log (login, failure, lockout, register, admin actions, password change) with IP, viewable by admins. **Alerting not yet implemented.** | `lib/audit.js` |
| A03/A04 (AI) | LLM-specific risks | Teacher text is sent as quoted data with angle brackets stripped; model output is validated (JSON shape, word limits, question counts), length-capped, stripped of markdown, and always HTML-escaped when rendered (the only markup is the bolded vocabulary word, built from escaped segments). Per-teacher hourly cap on AI calls (cost abuse); API key only in an environment variable; error text from the API is logged, never shown. Drafts live in the user's own session; saved sheets are scoped to the owner's `user_id`. | `lib/reading/*`, `routes/reading.js`, `lib/library.js` |
| A10 | SSRF | The only outbound call is to the fixed Anthropic API endpoint (SDK); no user-supplied URLs are fetched. Saved-sheet URLs are re-validated against a whitelist of our own worksheet routes before use. | `lib/sheets.js` |

## Known gaps / next steps
- MFA (TOTP or email) at least for admins.
- Email: notify admins of new requests, users of approval, and self-service password reset (needs a mail provider such as Resend).
- Alerting on repeated lockouts; pruning of `audit_log`.
- Optional: Dependabot, CodeQL, `npm audit` in CI.
