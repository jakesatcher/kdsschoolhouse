# Security: OWASP Top 10 (2021) mapping

| # | Risk | Controls in this app | Where |
|---|---|---|---|
| A01 | Broken access control | Default-deny global gate: every route requires a signed-in **approved** user except `/login`, `/register`, `/healthz`, `/static`. Admin routes behind `requireAdmin`. Status and role are re-read from the DB on every request, so disabling a user takes effect immediately and their sessions are deleted. The last admin cannot be removed; admins cannot demote themselves. | `middleware/auth.js`, `routes/admin.js` |
| A02 | Cryptographic failures | bcrypt (cost 12) password hashes; HTTPS by Railway + HSTS (2 yrs) + `Secure` cookie in production; `SESSION_SECRET` required (32+ chars) in production; secrets only in env vars; `Cache-Control: no-store` on dynamic pages. | `lib/password.js`, `app.js`, `config.js` |
| A03 | Injection | All SQL is parameterised. All output is HTML-escaped by EJS (`<%= %>`); no unescaped user data. Query parameters are whitelisted or range-checked and fall back to defaults. Strict CSP blocks inline script. | `lib/params.js`, `routes/*` |
| A04 | Insecure design | Approval workflow; one-time admin-issued temporary passwords with forced change; rate limits on login, register, password change and generators; request bodies capped at 20 KB; worksheet sizes capped. | `lib/limits.js` |
| A05 | Security misconfiguration | Helmet: CSP (`default-src 'self'`, no inline script/style, `frame-ancestors 'none'`, `object-src 'none'`), HSTS, nosniff, same-origin referrer/CORP, no `X-Powered-By`. Generic error pages (stack traces only in logs). `noindex`. | `app.js` |
| A06 | Vulnerable components | Small dependency set, lockfile committed, `npm audit` clean at commit. Re-run regularly; consider Dependabot. | `package.json` |
| A07 | Identification & authentication failures | 12+ char passwords (length over composition; common/repetitive/email checks); lockout after 5 failures (15 min) plus IP rate limit; uniform error and dummy-hash timing for unknown emails; session ID regenerated on login; 8 h rolling idle timeout; HttpOnly + SameSite=Lax cookies; other sessions revoked on password change/reset/disable; logout destroys the session. **MFA not yet implemented.** | `routes/auth.js`, `routes/account.js` |
| A08 | Software & data integrity | No user uploads, no deserialisation of user data, no third-party scripts (all assets same-origin). CSRF synchroniser token on every POST. | `middleware/security.js` |
| A09 | Logging & monitoring | Audit log (login, failure, lockout, register, admin actions, password change) with IP, viewable by admins. **Alerting not yet implemented.** | `lib/audit.js` |
| A10 | SSRF | The server makes no outbound requests based on user input. | n/a |

## Known gaps / next steps
- MFA (TOTP or email) at least for admins.
- Email: notify admins of new requests, users of approval, and self-service password reset (needs a mail provider such as Resend).
- Alerting on repeated lockouts; pruning of `audit_log`.
- Optional: Dependabot, CodeQL, `npm audit` in CI.
